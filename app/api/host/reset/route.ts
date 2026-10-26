import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { events, participants, connections } from '@/lib/db/schema';
import { DEFAULT_EVENT_SLUG, HOST_PASSCODE } from '@/lib/events/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedPasscode = body.passcode || bearerToken;

    if (!providedPasscode || providedPasscode !== HOST_PASSCODE) {
      return NextResponse.json(
        { error: 'Código de acceso de anfitrión incorrecto o no proporcionado' },
        { status: 401 }
      );
    }

    const slug = body.slug || DEFAULT_EVENT_SLUG;
    const db = getDb();

    const targetEvent = await db
      .select()
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);

    if (targetEvent.length === 0) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const eventId = targetEvent[0].id;

    // Transactional deletion of participants and connections for this event
    const deletedConnections = await db
      .delete(connections)
      .where(eq(connections.eventId, eventId))
      .returning();

    const deletedParticipants = await db
      .delete(participants)
      .where(eq(participants.eventId, eventId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `El evento ${slug} ha sido reiniciado con éxito.`,
      deletedParticipants: deletedParticipants.length,
      deletedConnections: deletedConnections.length,
    });
  } catch (error: unknown) {
    console.error('Error resetting event:', error);
    const message = error instanceof Error ? error.message : 'Error interno al reiniciar evento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
