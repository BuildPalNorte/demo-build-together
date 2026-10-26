import { pgTable, uuid, text, varchar, integer, jsonb, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const participants = pgTable(
  'participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 40 }).notNull(),
    discipline: text('discipline').notNull(),
    skills: jsonb('skills').$type<string[]>().notNull(),
    interests: jsonb('interests').$type<string[]>().notNull(),
    goal: text('goal').notNull(),
    visitorId: text('visitor_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_participants_event_visitor').on(table.eventId, table.visitorId),
    uniqueIndex('idx_participants_event_created').on(table.eventId, table.createdAt),
  ]
);

export const connections = pgTable(
  'connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_connections_event_source_target').on(table.eventId, table.sourceId, table.targetId),
    uniqueIndex('idx_connections_event_created').on(table.eventId, table.createdAt),
    check('chk_canonical_source_target', sql`${table.sourceId} < ${table.targetId}`),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
