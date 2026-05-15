import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { importJobStatusEnum } from './enums';
import { users } from './users';

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  originalFilename: varchar('original_filename', { length: 500 }).notNull(),
  storageKey: varchar('storage_key', { length: 1000 }).notNull(),
  status: importJobStatusEnum('status').notNull().default('queued'),
  totalRows: integer('total_rows'),
  importedCount: integer('imported_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  errors: jsonb('errors'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const importJobsRelations = relations(importJobs, ({ one }) => ({
  creator: one(users, {
    fields: [importJobs.createdBy],
    references: [users.id],
  }),
}));
