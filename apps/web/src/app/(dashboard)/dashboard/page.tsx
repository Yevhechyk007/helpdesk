'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle, Zap, CheckCircle2, ArrowUpRight } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TicketsResponse, TicketStatus } from '@/types/ticket';

// ─── Fake 7-day trend data ────────────────────────────────────────────────────

const chartData = [
  { day: 'Mon', created: 4, resolved: 2 },
  { day: 'Tue', created: 7, resolved: 5 },
  { day: 'Wed', created: 5, resolved: 4 },
  { day: 'Thu', created: 11, resolved: 6 },
  { day: 'Fri', created: 8, resolved: 9 },
  { day: 'Sat', created: 3, resolved: 3 },
  { day: 'Sun', created: 6, resolved: 4 },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusColors: Record<TicketStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  glowColor: string;
  trend?: string;
}

function StatCard({ label, value, icon, iconBg, glowColor, trend }: StatCardProps) {
  return (
    <motion.div variants={fadeUp}>
      <div
        className={cn(
          'relative rounded-xl border bg-gradient-to-br from-white to-gray-50/80 p-5',
          'dark:from-gray-800/70 dark:to-gray-900/60 dark:border-white/[0.08]',
          'shadow-sm transition-shadow duration-300 hover:shadow-md',
          glowColor,
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={cn('flex size-10 items-center justify-center rounded-xl', iconBg)}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: openData } = useQuery<TicketsResponse>({
    queryKey: ['tickets', { status: 'open' }],
    queryFn: () =>
      api
        .get<TicketsResponse>('/tickets', { params: { status: 'open', limit: 1 } })
        .then((r) => r.data),
  });

  const { data: inProgressData } = useQuery<TicketsResponse>({
    queryKey: ['tickets', { status: 'in_progress' }],
    queryFn: () =>
      api
        .get<TicketsResponse>('/tickets', { params: { status: 'in_progress', limit: 1 } })
        .then((r) => r.data),
  });

  const { data: resolvedData } = useQuery<TicketsResponse>({
    queryKey: ['tickets', { status: 'resolved' }],
    queryFn: () =>
      api
        .get<TicketsResponse>('/tickets', { params: { status: 'resolved', limit: 1 } })
        .then((r) => r.data),
  });

  const { data: recentData } = useQuery<TicketsResponse>({
    queryKey: ['tickets', { limit: 5 }],
    queryFn: () =>
      api
        .get<TicketsResponse>('/tickets', { params: { limit: 5 } })
        .then((r) => r.data),
  });

  const recentTickets = recentData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        {user && (
          <p className="mt-1 text-muted-foreground">
            Welcome back,{' '}
            <span className="font-medium text-foreground">{user.firstName}</span>
          </p>
        )}
      </motion.div>

      {/* Stat cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <StatCard
          label="Open Tickets"
          value={openData?.total ?? '—'}
          icon={<AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
          glowColor="hover:shadow-amber-500/10"
          trend="Needs attention"
        />
        <StatCard
          label="In Progress"
          value={inProgressData?.total ?? '—'}
          icon={<Zap className="size-5 text-violet-600 dark:text-violet-400" />}
          iconBg="bg-violet-100 dark:bg-violet-500/15"
          glowColor="hover:shadow-violet-500/10"
          trend="Being handled"
        />
        <StatCard
          label="Resolved"
          value={resolvedData?.total ?? '—'}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          glowColor="hover:shadow-emerald-500/10"
          trend="All time"
        />
      </motion.div>

      {/* Volume chart */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div
          className={cn(
            'rounded-xl border bg-gradient-to-br from-white to-gray-50/80 p-5',
            'dark:from-gray-800/70 dark:to-gray-900/60 dark:border-white/[0.08]',
            'shadow-sm',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Ticket Volume</p>
              <p className="text-xs text-muted-foreground">Last 7 days — created vs resolved</p>
            </div>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border/50"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#gradCreated)"
                  dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradResolved)"
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <h3 className="mb-3 text-base font-semibold">Recent Activity</h3>
        {recentTickets.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border bg-gradient-to-br from-white to-gray-50/80 px-5 py-10',
              'dark:from-gray-800/70 dark:to-gray-900/60 dark:border-white/[0.08]',
              'text-center shadow-sm',
            )}
          >
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <motion.div
            className={cn(
              'rounded-xl border bg-gradient-to-br from-white to-gray-50/80',
              'dark:from-gray-800/70 dark:to-gray-900/60 dark:border-white/[0.08]',
              'overflow-hidden shadow-sm divide-y divide-border/60',
            )}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {recentTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                variants={fadeUp}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ticket.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    updated{' '}
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
