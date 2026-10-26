import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { events, participants, connections } from '@/lib/db/schema';
import { getOrCreateEvent } from '@/lib/events/service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const event = await getOrCreateEvent(slug);

    const db = getDb();

    // Fetch participants ordered by creation
    const eventParticipants = await db
      .select({
        id: participants.id,
        displayName: participants.displayName,
        discipline: participants.discipline,
        skills: participants.skills,
        interests: participants.interests,
        goal: participants.goal,
        createdAt: participants.createdAt,
      })
      .from(participants)
      .where(eq(participants.eventId, event.id))
      .orderBy(desc(participants.createdAt));

    // Fetch connections
    const eventConnections = await db
      .select({
        id: connections.id,
        sourceId: connections.sourceId,
        targetId: connections.targetId,
        score: connections.score,
        reason: connections.reason,
        createdAt: connections.createdAt,
      })
      .from(connections)
      .where(eq(connections.eventId, event.id))
      .orderBy(desc(connections.createdAt));

    // Compute live stats
    const disciplinesSet = new Set(eventParticipants.map((p) => p.discipline));
    const breakdown: Record<string, number> = {};
    for (const p of eventParticipants) {
      breakdown[p.discipline] = (breakdown[p.discipline] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        name: event.name,
      },
      participants: eventParticipants,
      connections: eventConnections,
      stats: {
        totalBuilders: eventParticipants.length,
        totalConnections: eventConnections.length,
        disciplinesCount: disciplinesSet.size,
        breakdown,
      },
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    console.error('Error fetching event data:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener datos del evento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
