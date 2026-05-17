'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Ticket, TicketsResponse, TicketStatus, TicketPriority } from '@/types/ticket';
import { TicketSheet } from '@/components/ticket-sheet';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const label = status.replace('_', ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        statusColors[status]
      )}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        priorityColors[priority]
      )}
    >
      {priority}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── New ticket form schema ───────────────────────────────────────────────────

const newTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be at most 500 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

// ─── New ticket dialog ────────────────────────────────────────────────────────

function NewTicketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const mutation = useMutation({
    mutationFn: (dto: NewTicketFormValues) =>
      api.post<Ticket>('/tickets', dto).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onOpenChange(false);
      form.reset();
      toast.success('Ticket created');
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });

  function onSubmit(values: NewTicketFormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Ticket</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summarise the issue…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail…"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        if (val !== null) field.onChange(val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter selects ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<TicketsResponse>({
    queryKey: ['tickets', { status: statusFilter, priority: priorityFilter, page }],
    queryFn: () =>
      api
        .get<TicketsResponse>('/tickets', {
          params: {
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(priorityFilter ? { priority: priorityFilter } : {}),
            page,
            limit: 20,
          },
        })
        .then((r) => r.data),
  });

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Heading row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus />
          New Ticket
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <TicketIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tickets yet. Create your first ticket.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedId(ticket.id)} />
          ))}
        </div>
      )}

      {/* New ticket dialog */}
      <NewTicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Ticket detail sheet */}
      <TicketSheet
        ticketId={selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      />
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{ticket.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {ticket.description}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </CardContent>
    </Card>
  );
}
