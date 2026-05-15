import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { notificationTypeEnum } from './enums';
import { users } from './users';
import { tickets } from './tickets';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ticketId: uuid('ticket_id').references(() => tickets.id, {
      onDelete: 'cascade',
    }),
    type: notificationTypeEnum('type').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_id_idx').on(t.userId),
    index('notifications_unread_idx').on(t.userId, t.isRead),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [notifications.ticketId],
    references: [tickets.id],
  }),
}));
