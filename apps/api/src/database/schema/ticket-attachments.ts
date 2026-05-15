import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';
import { users } from './users';

export const ticketAttachments = pgTable('ticket_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  originalFilename: varchar('original_filename', { length: 500 }).notNull(),
  storageKey: varchar('storage_key', { length: 1000 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketAttachmentsRelations = relations(
  ticketAttachments,
  ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketAttachments.ticketId],
      references: [tickets.id],
    }),
    uploader: one(users, {
      fields: [ticketAttachments.uploadedBy],
      references: [users.id],
    }),
  }),
);
