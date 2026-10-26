import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { events, Event } from '../db/schema';
import { DEFAULT_EVENT_NAME, DEFAULT_EVENT_SLUG } from './constants';

export async function getOrCreateEvent(slug: string = DEFAULT_EVENT_SLUG): Promise<Event> {
  const db = getDb();

  const existing = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  // Create default event if not present
  const name = slug === DEFAULT_EVENT_SLUG ? DEFAULT_EVENT_NAME : `Evento ${slug}`;
  const inserted = await db
    .insert(events)
    .values({
      slug,
      name,
    })
    .onConflictDoNothing({ target: events.slug })
    .returning();

  if (inserted.length > 0) {
    return inserted[0];
  }

  // If another process inserted it concurrently
  const fallback = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return fallback[0];
}
