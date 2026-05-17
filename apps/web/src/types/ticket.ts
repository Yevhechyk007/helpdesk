export type TicketStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivityItem {
  id: string;
  kind: 'audit' | 'comment';
  action: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  content: string | null;
  isInternal: boolean;
  authorId: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  createdAt: string;
}
