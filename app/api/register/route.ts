import { NextRequest, NextResponse } from 'next/server';
import { registerParticipantSchema } from '@/lib/validation/participant';
import { getOrCreateEvent } from '@/lib/events/service';
import { registerParticipantWithMatching } from '@/lib/matching/transaction';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Server-side Zod validation
    const parsed = registerParticipantSchema.safeParse(body);
    if (!parsed.success) {
      const errorDetails = parsed.error.issues.map((issue) => issue.message).join('. ');
      return NextResponse.json({ error: errorDetails }, { status: 400 });
    }

    const { eventSlug, displayName, discipline, skills, interests, visitorId } = parsed.data;

    // Retrieve or initialize event
    const event = await getOrCreateEvent(eventSlug);

    // Concurrency-safe registration + matching in PostgreSQL transaction
    const result = await registerParticipantWithMatching({
      eventId: event.id,
      displayName,
      discipline,
      skills,
      interests,
      goal: '',
      visitorId,
    });

    return NextResponse.json(
      {
        success: true,
        participant: result.participant,
        newConnections: result.newConnections,
        isExisting: result.isExisting,
        message: result.isExisting ? 'Perfil actualizado' : '¡Bienvenido a la red!',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error during participant registration:', error);
    const message = error instanceof Error ? error.message : 'Error interno al registrar participante';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
