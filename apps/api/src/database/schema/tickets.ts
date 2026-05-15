import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  ticketStatusEnum,
  ticketPriorityEnum,
  ticketSourceEnum,
} from './enums';
import { users } from './users';
import { categories } from './categories';
import { ticketComments } from './ticket-comments';
import { ticketAttachments } from './ticket-attachments';
import { ticketTags } from './ticket-tags';
import { auditLogs } from './audit-logs';
import { notifications } from './notifications';

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').notNull().default('new'),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  source: ticketSourceEnum('source').notNull().default('web'),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id, {
    onDelete: 'set null',
  }),
  customerId: uuid('customer_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  dueAt: timestamp('due_at', { withTimezone: true }),
  firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  slaBreached: boolean('sla_breached').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  category: one(categories, {
    fields: [tickets.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: 'created_tickets',
  }),
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: 'assigned_tickets',
  }),
  customer: one(users, {
    fields: [tickets.customerId],
    references: [users.id],
    relationName: 'customer_tickets',
  }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
  tags: many(ticketTags),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));
