import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateEvent } from '@/lib/events/service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const event = await getOrCreateEvent(slug);

    const realtimeSecret = process.env.NEON_REALTIME_SECRET;

    // If Neon Realtime is not configured or in an unsupported region,
    // explicitly signal that client should use the high-frequency polling synchronization.
    if (!realtimeSecret) {
      return NextResponse.json({
        enabled: false,
        reason: 'NEON_REALTIME_SECRET not configured. Operating in near-realtime polling mode.',
        eventId: event.id,
      });
    }

    // Attempt to seal queries with official SDK
    try {
      // Dynamic import to avoid runtime crashes if the server environment lacks crypto/neon socket
      const { createRealtime } = await import('@neon/realtime/server');
      const { drizzleAdapter } = await import('@neon/realtime-drizzle');
      const { getDb } = await import('@/lib/db');
      const { participants, connections } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');

      const db = getDb();
      const realtime = createRealtime({
        secret: realtimeSecret,
        db: process.env.NEON_DATABASE_NAME || 'neondb',
        adapter: drizzleAdapter(),
      });

      const participantsQuery = db.select().from(participants).where(eq(participants.eventId, event.id));
      const connectionsQuery = db.select().from(connections).where(eq(connections.eventId, event.id));

      const sealedParticipants = await realtime.seal({ query: participantsQuery });
      const sealedConnections = await realtime.seal({ query: connectionsQuery });

      return NextResponse.json({
        enabled: true,
        eventId: event.id,
        sealedParticipants,
        sealedConnections,
      });
    } catch (sealErr: unknown) {
      console.warn('Neon Realtime sealing encountered error, falling back to polling:', sealErr);
      return NextResponse.json({
        enabled: false,
        reason: sealErr instanceof Error ? sealErr.message : 'Neon Realtime seal error',
        eventId: event.id,
      });
    }
  } catch (error: unknown) {
    console.error('Realtime configuration route error:', error);
    return NextResponse.json({ enabled: false, error: 'Realtime route failure' }, { status: 500 });
  }
}
