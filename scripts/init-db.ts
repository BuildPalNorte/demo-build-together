import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { directDatabaseUrl } from '../lib/db/url';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function initDb() {
  let connectionString: string;
  try {
    connectionString = directDatabaseUrl();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'DATABASE_URL is not set.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Creating database tables if not exist...');

    // 1. Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Participants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        display_name VARCHAR(40) NOT NULL,
        discipline TEXT NOT NULL,
        skills JSONB NOT NULL,
        interests JSONB NOT NULL,
        goal TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Connections Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        source_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        target_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Indexes & Constraints
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_event_visitor ON participants(event_id, visitor_id);
      CREATE INDEX IF NOT EXISTS idx_participants_event_created ON participants(event_id, created_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_event_source_target ON connections(event_id, source_id, target_id);
      CREATE INDEX IF NOT EXISTS idx_connections_event_created ON connections(event_id, created_at);
    `);

    // 5. Seed default workshop event
    const eventSlug = 'tec-matamoros-2026';
    const eventName = 'Build Together — Tec de Matamoros';

    const insertEvent = await client.query(`
      INSERT INTO events (slug, name)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET name = $2
      RETURNING *;
    `, [eventSlug, eventName]);

    console.log('Workshop event ready:', insertEvent.rows[0]);
    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
