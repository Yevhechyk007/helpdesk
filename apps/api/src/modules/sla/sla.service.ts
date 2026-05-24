import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNotNull, lte, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { tickets, slaPolicies, notifications } from '../../database/schema';
import * as schema from '../../database/schema';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

const OPEN_STATUSES = ['new', 'open', 'in_progress', 'pending'] as const;

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  /**
   * Called after a ticket is created. If the ticket has a category with an SLA
   * policy matching the ticket's priority, calculates and persists dueAt.
   */
  async setDueAt(
    ticketId: string,
    categoryId: string,
    priority: TicketPriority,
  ): Promise<void> {
    const [policy] = await this.db
      .select()
      .from(slaPolicies)
      .where(
        and(
          eq(slaPolicies.categoryId, categoryId),
          eq(slaPolicies.priority, priority),
        ),
      );

    if (!policy) return;

    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + policy.resolutionTimeHours);

    await this.db
      .update(tickets)
      .set({ dueAt })
      .where(eq(tickets.id, ticketId));
  }

  /**
   * Runs every 5 minutes. Finds open tickets whose dueAt has passed and
   * marks them as slaBreached = true, then notifies the assignee.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkBreaches(): Promise<void> {
    const now = new Date();

    const overdueTickets = await this.db
      .select({ id: tickets.id, assignedTo: tickets.assignedTo })
      .from(tickets)
      .where(
        and(
          eq(tickets.slaBreached, false),
          isNotNull(tickets.dueAt),
          lte(tickets.dueAt, now),
          inArray(tickets.status, [...OPEN_STATUSES]),
        ),
      );

    if (overdueTickets.length === 0) return;

    this.logger.log(`SLA breach detected for ${overdueTickets.length} ticket(s)`);

    for (const ticket of overdueTickets) {
      await this.db
        .update(tickets)
        .set({ slaBreached: true, updatedAt: new Date() })
        .where(eq(tickets.id, ticket.id));

      if (ticket.assignedTo) {
        await this.db.insert(notifications).values({
          userId: ticket.assignedTo,
          ticketId: ticket.id,
          type: 'sla_breached',
        });
      }
    }
  }
}
