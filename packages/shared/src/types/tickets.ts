export type TicketStatus = 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketSource = 'web' | 'email' | 'import';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Valid forward transitions for the ticket state machine */
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new:         ['open', 'closed'],
  open:        ['in_progress', 'pending', 'closed'],
  in_progress: ['pending', 'resolved', 'closed'],
  pending:     ['open', 'in_progress', 'closed'],
  resolved:    ['closed', 'open'],
  closed:      [],
};
