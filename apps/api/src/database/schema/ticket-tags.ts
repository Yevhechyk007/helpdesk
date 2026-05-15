import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

export const ticketTags = pgTable(
  'ticket_tags',
  {
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 100 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.ticketId, t.tag] })],
);

export const ticketTagsRelations = relations(ticketTags, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketTags.ticketId],
    references: [tickets.id],
  }),
}));
