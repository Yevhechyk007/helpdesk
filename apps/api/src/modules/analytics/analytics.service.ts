import { Injectable, Inject } from '@nestjs/common';
import { count, avg, eq, gte, inArray, and, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { tickets } from '../../database/schema';
import * as schema from '../../database/schema';

export interface AnalyticsResult {
  openTickets: number;
  resolvedToday: number;
  slaMet: number;
  avgResolutionHours: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getSummary(): Promise<AnalyticsResult> {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const openStatuses = ['new', 'open', 'in_progress', 'pending'] as const;
    const closedStatuses = ['resolved', 'closed'] as const;

    const [openResult] = await this.db
      .select({ value: count() })
      .from(tickets)
      .where(inArray(tickets.status, openStatuses));

    const [resolvedTodayResult] = await this.db
      .select({ value: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, 'resolved'),
          gte(tickets.resolvedAt, todayMidnight),
        ),
      );

    const slaRows = await this.db
      .select({ slaBreached: tickets.slaBreached, value: count() })
      .from(tickets)
      .where(inArray(tickets.status, closedStatuses))
      .groupBy(tickets.slaBreached);

    let slaMetCount = 0;
    let slaTotalCount = 0;
    for (const row of slaRows) {
      const n = Number(row.value);
      slaTotalCount += n;
      if (!row.slaBreached) {
        slaMetCount += n;
      }
    }
    const slaMet =
      slaTotalCount > 0
        ? Math.round((slaMetCount / slaTotalCount) * 100)
        : 100;

    const [avgResult] = await this.db
      .select({
        avgHours: avg(
          sql<number>`EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) / 3600`,
        ),
      })
      .from(tickets)
      .where(eq(tickets.status, 'resolved'));

    const avgResolutionHours = avgResult?.avgHours
      ? Math.round(Number(avgResult.avgHours) * 10) / 10
      : 0;

    const statusRows = await this.db
      .select({ status: tickets.status, value: count() })
      .from(tickets)
      .groupBy(tickets.status);

    const byStatus = statusRows.map((r) => ({
      status: r.status,
      count: Number(r.value),
    }));

    const priorityRows = await this.db
      .select({ priority: tickets.priority, value: count() })
      .from(tickets)
      .groupBy(tickets.priority);

    const byPriority = priorityRows.map((r) => ({
      priority: r.priority,
      count: Number(r.value),
    }));

    return {
      openTickets: Number(openResult.value),
      resolvedToday: Number(resolvedTodayResult.value),
      slaMet,
      avgResolutionHours,
      byStatus,
      byPriority,
    };
  }
}
