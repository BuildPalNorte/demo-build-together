import { sql, eq } from 'drizzle-orm';
import { getDbPool } from '../db';
import { participants, connections, events, Participant, Connection } from '../db/schema';
import { findTopMatches } from './engine';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../db/schema';

export interface RegisterParticipantInput {
  eventId: string;
  displayName: string;
  discipline: string;
  skills: string[];
  interests: string[];
  goal: string;
  visitorId: string;
}

export interface RegisterResult {
  participant: Participant;
  newConnections: Connection[];
  isExisting: boolean;
}

/**
 * Executes an advisory-locked transaction in PostgreSQL to safely register
 * a participant and deterministically compute & insert up to 3 compatible connections.
 */
export async function registerParticipantWithMatching(
  input: RegisterParticipantInput
): Promise<RegisterResult> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Acquire transaction-level advisory lock scoped to this specific event
    // This serializes concurrent matching calculations for this workshop event
    // while keeping lock scope strictly within this transaction.
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1))`,
      [`event_matching_${input.eventId}`]
    );

    // 2. Check if participant with this visitorId already exists in this event (Idempotency)
    const existingCheckRes = await client.query(
      `SELECT * FROM participants WHERE event_id = $1 AND visitor_id = $2 LIMIT 1`,
      [input.eventId, input.visitorId]
    );

    let participant: Participant;
    let isExisting = false;

    if (existingCheckRes.rows.length > 0) {
      participant = existingCheckRes.rows[0] as Participant;
      isExisting = true;
    } else {
      // Insert new participant
      const insertRes = await client.query(
        `INSERT INTO participants (event_id, display_name, discipline, skills, interests, goal, visitor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.eventId,
          input.displayName,
          input.discipline,
          JSON.stringify(input.skills),
          JSON.stringify(input.interests),
          input.goal,
          input.visitorId,
        ]
      );
      participant = insertRes.rows[0] as Participant;
    }

    // 3. Fetch all other participants in the event to compute matches
    const allParticipantsRes = await client.query(
      `SELECT * FROM participants WHERE event_id = $1 AND id != $2`,
      [input.eventId, participant.id]
    );

    const otherParticipants = allParticipantsRes.rows as Participant[];

    // 4. Compute top 3 deterministic matches
    const computedMatches = findTopMatches(participant, otherParticipants, 3);

    const insertedConnections: Connection[] = [];

    // 5. Insert each computed connection with canonical ordering and conflict suppression
    for (const match of computedMatches) {
      const connInsertRes = await client.query(
        `INSERT INTO connections (event_id, source_id, target_id, score, reason)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (event_id, source_id, target_id) DO NOTHING
         RETURNING *`,
        [input.eventId, match.sourceId, match.targetId, match.score, match.reason]
      );

      if (connInsertRes.rows.length > 0) {
        insertedConnections.push(connInsertRes.rows[0] as Connection);
      }
    }

    // 6. Commit transaction atomically
    await client.query('COMMIT');

    return {
      participant,
      newConnections: insertedConnections,
      isExisting,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
