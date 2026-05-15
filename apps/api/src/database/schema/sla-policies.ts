import {
  pgTable,
  uuid,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ticketPriorityEnum } from './enums';
import { categories } from './categories';

export const slaPolicies = pgTable(
  'sla_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    priority: ticketPriorityEnum('priority').notNull(),
    responseTimeHours: integer('response_time_hours').notNull(),
    resolutionTimeHours: integer('resolution_time_hours').notNull(),
  },
  (t) => [unique('sla_category_priority_unique').on(t.categoryId, t.priority)],
);

export const slaPoliciesRelations = relations(slaPolicies, ({ one }) => ({
  category: one(categories, {
    fields: [slaPolicies.categoryId],
    references: [categories.id],
  }),
}));
