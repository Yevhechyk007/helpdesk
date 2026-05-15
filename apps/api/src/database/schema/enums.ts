import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'agent', 'customer']);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'new',
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const ticketSourceEnum = pgEnum('ticket_source', [
  'web',
  'email',
  'import',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'created',
  'updated',
  'assigned',
  'escalated',
  'status_changed',
  'commented',
  'attachment_added',
  'attachment_removed',
]);

export const importJobStatusEnum = pgEnum('import_job_status', [
  'queued',
  'processing',
  'completed',
  'failed',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'assigned',
  'escalated',
  'sla_warning',
  'sla_breached',
  'comment_added',
  'status_changed',
]);
