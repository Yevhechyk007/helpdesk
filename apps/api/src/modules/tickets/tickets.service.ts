import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { and, asc, eq, or, count, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import {
  tickets,
  ticketComments,
  auditLogs,
  users,
} from '../../database/schema';
import * as schema from '../../database/schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

export type TicketRecord = typeof tickets.$inferSelect;

@Injectable()
export class TicketsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateTicketDto, userId: string): Promise<TicketRecord> {
    const [ticket] = await this.db
      .insert(tickets)
      .values({
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'medium',
        source: 'web',
        createdBy: userId,
        customerId: userId,
      })
      .returning();

    await this.db.insert(auditLogs).values({
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'created',
      performedBy: userId,
      newValues: {
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
      },
    });

    return ticket;
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(
    query: ListTicketsDto,
    userId: string,
    userRole: string,
  ): Promise<{ data: TicketRecord[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = this.buildConditions(query, userId, userRole);

    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(tickets)
      .where(conditions);

    const data = await this.db
      .select()
      .from(tickets)
      .where(conditions)
      .orderBy(desc(tickets.updatedAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total), page, limit };
  }

  // ─── Find one ─────────────────────────────────────────────────────────────

  async findOne(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<TicketRecord> {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    if (userRole === 'customer') {
      const owns =
        ticket.createdBy === userId || ticket.customerId === userId;
      if (!owns) throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  // ─── Update status ────────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    dto: UpdateTicketDto,
    userId: string,
    userRole: string,
  ): Promise<TicketRecord> {
    const ticket = await this.findOne(id, userId, userRole);

    const [updated] = await this.db
      .update(tickets)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();

    await this.db.insert(auditLogs).values({
      entityType: 'ticket',
      entityId: id,
      action: 'status_changed',
      performedBy: userId,
      oldValues: { status: ticket.status },
      newValues: { status: dto.status },
    });

    return updated;
  }

  // ─── Activity feed ────────────────────────────────────────────────────────

  async getActivity(ticketId: string, userId: string, userRole: string) {
    await this.findOne(ticketId, userId, userRole);

    const [logs, comments] = await Promise.all([
      this.db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          oldValues: auditLogs.oldValues,
          newValues: auditLogs.newValues,
          authorId: auditLogs.performedBy,
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.performedBy, users.id))
        .where(
          and(
            eq(auditLogs.entityType, 'ticket'),
            eq(auditLogs.entityId, ticketId),
          ),
        )
        .orderBy(asc(auditLogs.createdAt)),

      this.db
        .select({
          id: ticketComments.id,
          content: ticketComments.content,
          isInternal: ticketComments.isInternal,
          authorId: ticketComments.authorId,
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          createdAt: ticketComments.createdAt,
        })
        .from(ticketComments)
        .leftJoin(users, eq(ticketComments.authorId, users.id))
        .where(eq(ticketComments.ticketId, ticketId))
        .orderBy(asc(ticketComments.createdAt)),
    ]);

    const auditItems = logs
      .filter((l) => l.action !== 'commented')
      .map((l) => ({
        id: l.id,
        kind: 'audit' as const,
        action: l.action as string,
        oldValues: l.oldValues as Record<string, unknown> | null,
        newValues: l.newValues as Record<string, unknown> | null,
        content: null as string | null,
        isInternal: false,
        authorId: l.authorId,
        authorFirstName: l.authorFirstName ?? null,
        authorLastName: l.authorLastName ?? null,
        createdAt: l.createdAt.toISOString(),
      }));

    const commentItems = comments.map((c) => ({
      id: c.id,
      kind: 'comment' as const,
      action: null as string | null,
      oldValues: null as Record<string, unknown> | null,
      newValues: null as Record<string, unknown> | null,
      content: c.content,
      isInternal: c.isInternal,
      authorId: c.authorId,
      authorFirstName: c.authorFirstName ?? null,
      authorLastName: c.authorLastName ?? null,
      createdAt: c.createdAt.toISOString(),
    }));

    return [...auditItems, ...commentItems].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  async addComment(
    ticketId: string,
    dto: CreateCommentDto,
    userId: string,
    userRole: string,
  ) {
    await this.findOne(ticketId, userId, userRole);

    const [comment] = await this.db
      .insert(ticketComments)
      .values({
        ticketId,
        authorId: userId,
        content: dto.content,
        isInternal: dto.isInternal === true && userRole !== 'customer',
      })
      .returning();

    return comment;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildConditions(
    query: ListTicketsDto,
    userId: string,
    userRole: string,
  ) {
    const filters = [];

    if (userRole === 'customer') {
      filters.push(
        or(eq(tickets.createdBy, userId), eq(tickets.customerId, userId)),
      );
    }
    if (query.status) filters.push(eq(tickets.status, query.status));
    if (query.priority) filters.push(eq(tickets.priority, query.priority));

    return filters.length > 0 ? and(...filters) : undefined;
  }
}
