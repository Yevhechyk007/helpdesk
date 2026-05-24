import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { notifications, tickets } from '../../database/schema';
import * as schema from '../../database/schema';

export type NotificationRecord = typeof notifications.$inferSelect;

export interface NotificationWithTicket extends NotificationRecord {
  ticketTitle: string | null;
}

export interface NotificationsResult {
  data: NotificationWithTicket[];
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll(
    userId: string,
    limit: number,
    unreadOnly: boolean,
  ): Promise<NotificationsResult> {
    const conditions = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const rows = await this.db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        ticketId: notifications.ticketId,
        type: notifications.type,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        ticketTitle: tickets.title,
      })
      .from(notifications)
      .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
      .where(conditions)
      .orderBy(notifications.createdAt)
      .limit(limit);

    const [{ value: unreadCount }] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    const data: NotificationWithTicket[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      ticketId: r.ticketId ?? null,
      type: r.type,
      isRead: r.isRead,
      createdAt: r.createdAt,
      ticketTitle: r.ticketTitle ?? null,
    }));

    return { data, unreadCount: Number(unreadCount) };
  }

  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationRecord> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning({ id: notifications.id });

    return { updated: result.length };
  }
}
