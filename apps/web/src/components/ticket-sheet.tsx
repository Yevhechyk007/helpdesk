'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowRight, MessageSquare, Activity, Lock } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Ticket, TicketStatus, TicketPriority, ActivityItem } from '@/types/ticket';
import { useAuthStore } from '@/store/auth-store';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

// ─── Badge helpers ────────────────────────────────────────────────────────────

const statusColors: Record<TicketStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  open: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        statusColors[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        priorityColors[priority],
      )}
    >
      {priority}
    </span>
  );
}

// ─── Activity item renderer ───────────────────────────────────────────────────

function renderAuditDescription(item: ActivityItem): string {
  if (item.action === 'created') return 'created this ticket';
  if (item.action === 'status_changed') {
    const from = (item.oldValues?.status as string) ?? '?';
    const to = (item.newValues?.status as string) ?? '?';
    return `changed status from "${from.replace('_', ' ')}" → "${to.replace('_', ' ')}"`;
  }
  if (item.action === 'assigned') return 'assigned this ticket';
  return item.action ?? 'updated this ticket';
}

function authorName(item: ActivityItem): string {
  const parts = [item.authorFirstName, item.authorLastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'System';
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const time = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  const fullTime = format(new Date(item.createdAt), 'PPp');

  if (item.kind === 'comment') {
    return (
      <div className="flex gap-3">
        <div className="flex-none">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="size-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium">{authorName(item)}</span>
            {item.isInternal && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Lock className="size-2.5" />
                Internal
              </span>
            )}
            <span className="text-xs text-muted-foreground" title={fullTime}>
              {time}
            </span>
          </div>
          <p className="mt-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap">
            {item.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex-none">
        <div className="flex size-7 items-center justify-center rounded-full bg-muted">
          <Activity className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap py-1">
        <span className="text-sm font-medium">{authorName(item)}</span>
        <span className="text-sm text-muted-foreground">{renderAuditDescription(item)}</span>
        <span className="text-xs text-muted-foreground" title={fullTime}>
          · {time}
        </span>
      </div>
    </div>
  );
}

// ─── Comment form ─────────────────────────────────────────────────────────────

const commentSchema = z.object({
  content: z.string().min(1, 'Message is required'),
  isInternal: z.boolean(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

function CommentForm({
  ticketId,
  onSuccess,
}: {
  ticketId: string;
  onSuccess: () => void;
}) {
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '', isInternal: false },
  });

  const mutation = useMutation({
    mutationFn: (dto: CommentFormValues) =>
      api.post(`/tickets/${ticketId}/comments`, dto).then((r) => r.data),
    onSuccess: () => {
      form.reset();
      onSuccess();
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add a comment…"
                  className="min-h-[80px] resize-none text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-3.5 accent-amber-500"
              {...form.register('isInternal')}
            />
            <span className="text-xs text-muted-foreground">Internal note</span>
          </label>

          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main TicketSheet ─────────────────────────────────────────────────────────

interface TicketSheetProps {
  ticketId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function TicketSheet({ ticketId, onOpenChange }: TicketSheetProps) {
  const queryClient = useQueryClient();
  const open = ticketId !== null;

  const currentUser = useAuthStore((s) => s.user);
  const isAgentOrAdmin = currentUser?.role === 'agent' || currentUser?.role === 'admin';

  const { data: usersList = [] } = useQuery<{ id: string; firstName: string; lastName: string; role: string }[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isAgentOrAdmin,
  });

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => api.get<Ticket>(`/tickets/${ticketId}`).then((r) => r.data),
    enabled: open,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['ticket-activity', ticketId],
    queryFn: () =>
      api.get<ActivityItem[]>(`/tickets/${ticketId}/activity`).then((r) => r.data),
    enabled: open,
  });

  const assigneeMutation = useMutation({
    mutationFn: (assignedTo: string) =>
      api.patch<Ticket>(`/tickets/${ticketId}`, { assignedTo }).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket', ticketId], updated);
      queryClient.invalidateQueries({ queryKey: ['ticket-activity', ticketId] });
      toast.success('Assignee updated');
    },
    onError: () => toast.error('Failed to update assignee'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      api.patch<Ticket>(`/tickets/${ticketId}`, { status }).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.setQueryData(['ticket', ticketId], updated);
      queryClient.invalidateQueries({ queryKey: ['ticket-activity', ticketId] });
      toast.success(`Status set to "${updated.status.replace('_', ' ')}"`);
    },
    onError: () => toast.error('Failed to update status'),
  });

  function handleActivityRefresh() {
    queryClient.invalidateQueries({ queryKey: ['ticket-activity', ticketId] });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {ticketLoading || !ticket ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {ticketLoading ? 'Loading…' : ''}
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────── */}
            <SheetHeader>
              <SheetTitle>{ticket.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Select
                  value={ticket.status}
                  onValueChange={(val) => {
                    if (val) statusMutation.mutate(val as TicketStatus);
                  }}
                >
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        'new',
                        'open',
                        'in_progress',
                        'pending',
                        'resolved',
                        'closed',
                      ] as TicketStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusMutation.isPending && (
                  <span className="text-xs text-muted-foreground">Saving…</span>
                )}
              </div>

              {/* Assignee selector (agents/admins only) */}
              {isAgentOrAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-muted-foreground">Assignee</span>
                  <Select
                    value={ticket.assignedTo ?? ''}
                    onValueChange={(val) => { if (val) assigneeMutation.mutate(val); }}
                  >
                    <SelectTrigger className="h-7 w-[180px] text-xs">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList.filter(u => u.role === 'agent' || u.role === 'admin').map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs">
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assigneeMutation.isPending && (
                    <span className="text-xs text-muted-foreground">Saving…</span>
                  )}
                </div>
              )}
            </SheetHeader>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Description */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              <Separator />

              {/* Activity feed */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity
                </p>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="size-7 rounded-full bg-muted" />
                        <div className="flex-1 space-y-1.5 pt-1">
                          <div className="h-3 w-1/3 rounded bg-muted" />
                          <div className="h-3 w-2/3 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-4">
                    {activity.map((item) => (
                      <ActivityFeedItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Comment form footer ─────────────────────────────────── */}
            <div className="border-t px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Add Comment
              </p>
              <CommentForm ticketId={ticket.id} onSuccess={handleActivityRefresh} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
