'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Inbox,
  CheckCircle2,
  Zap,
  Star,
  Search,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { TicketsResponse } from '@/types/ticket';
import { useAnalytics } from '@/hooks/use-analytics';

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.07,
      ease: 'easeOut',
    },
  }),
};

// ─── Chart data ───────────────────────────────────────────────────────────────

const CHART_DATA = [
  { m: 'Jan', cur: 65, prev: 48 },
  { m: 'Feb', cur: 72, prev: 55 },
  { m: 'Mar', cur: 58, prev: 62 },
  { m: 'Apr', cur: 89, prev: 71 },
  { m: 'May', cur: 95, prev: 68 },
  { m: 'Jun', cur: 78, prev: 74 },
  { m: 'Jul', cur: 102, prev: 79 },
  { m: 'Aug', cur: 88, prev: 83 },
  { m: 'Sep', cur: 115, prev: 88 },
  { m: 'Oct', cur: 98, prev: 91 },
  { m: 'Nov', cur: 124, prev: 95 },
  { m: 'Dec', cur: 109, prev: 88 },
];

// ─── Mock tickets ─────────────────────────────────────────────────────────────

const TICKETS = [
  {
    id: 'TCK-10241',
    subject: 'Cannot access my account after 2FA update',
    customer: { name: 'Sarah M.', color: '#3b82f6' },
    channel: 'Email',
    priority: 'high' as const,
    date: '12 Jan 2026 09:14',
    assignee: { name: 'Jake R.', color: '#8b5cf6' },
    status: 'open' as const,
  },
  {
    id: 'TCK-10242',
    subject: 'Payment declined on checkout — urgent',
    customer: { name: 'David L.', color: '#10b981' },
    channel: 'Live Chat',
    priority: 'critical' as const,
    date: '12 Jan 2026 10:02',
    assignee: { name: 'Maria S.', color: '#f59e0b' },
    status: 'in_progress' as const,
  },
  {
    id: 'TCK-10243',
    subject: 'Slow loading times reported in EU region',
    customer: { name: 'Anna K.', color: '#ec4899' },
    channel: 'Email',
    priority: 'medium' as const,
    date: '11 Jan 2026 16:44',
    assignee: { name: 'Jake R.', color: '#8b5cf6' },
    status: 'pending' as const,
  },
  {
    id: 'TCK-10244',
    subject: 'Refund request for duplicate charge',
    customer: { name: 'Mike T.', color: '#f59e0b' },
    channel: 'Phone',
    priority: 'low' as const,
    date: '11 Jan 2026 14:30',
    assignee: { name: 'Maria S.', color: '#f59e0b' },
    status: 'resolved' as const,
  },
  {
    id: 'TCK-10245',
    subject: 'API rate limit exceeded on enterprise plan',
    customer: { name: 'Lisa P.', color: '#6366f1' },
    channel: 'Live Chat',
    priority: 'high' as const,
    date: '11 Jan 2026 12:15',
    assignee: { name: 'Chris B.', color: '#10b981' },
    status: 'open' as const,
  },
  {
    id: 'TCK-10246',
    subject: 'Dark mode not saving user preference',
    customer: { name: 'Tom W.', color: '#ef4444' },
    channel: 'Social',
    priority: 'low' as const,
    date: '10 Jan 2026 09:55',
    assignee: { name: 'Jake R.', color: '#8b5cf6' },
    status: 'pending' as const,
  },
  {
    id: 'TCK-10247',
    subject: 'Integration with Zapier stopped working',
    customer: { name: 'Rachel D.', color: '#8b5cf6' },
    channel: 'Email',
    priority: 'medium' as const,
    date: '10 Jan 2026 08:20',
    assignee: { name: 'Chris B.', color: '#10b981' },
    status: 'in_progress' as const,
  },
  {
    id: 'TCK-10248',
    subject: 'Feature request: bulk ticket export to CSV',
    customer: { name: 'James O.', color: '#14b8a6' },
    channel: 'Email',
    priority: 'low' as const,
    date: '09 Jan 2026 17:10',
    assignee: { name: 'Maria S.', color: '#f59e0b' },
    status: 'resolved' as const,
  },
];

// ─── Overlapping avatars ──────────────────────────────────────────────────────

const TEAM_AVATARS = [
  { initials: 'SA', bg: 'bg-blue-500' },
  { initials: 'JK', bg: 'bg-violet-500' },
  { initials: 'ML', bg: 'bg-emerald-500' },
  { initials: 'PD', bg: 'bg-amber-500' },
  { initials: 'RC', bg: 'bg-rose-500' },
];

// ─── Channel bar data ─────────────────────────────────────────────────────────

const CHANNELS = [
  { name: 'Email', pct: 68, color: '#3b82f6' },
  { name: 'Live Chat', pct: 52, color: '#10b981' },
  { name: 'Social', pct: 31, color: '#ec4899' },
  { name: 'Phone', pct: 24, color: '#f59e0b' },
];

// ─── KB docs ──────────────────────────────────────────────────────────────────

const INITIAL_DOCS = [
  { id: 1, title: 'Two-step verification', enabled: true },
  { id: 2, title: 'How to reset your password', enabled: false },
  { id: 3, title: 'Billing & subscription FAQ', enabled: true },
];

// ─── Priority bars ────────────────────────────────────────────────────────────

function PriorityBars({ priority }: { priority: 'low' | 'medium' | 'high' | 'critical' }) {
  const config: Record<string, { filled: number; color: string }> = {
    critical: { filled: 4, color: 'bg-red-500' },
    high: { filled: 3, color: 'bg-red-400' },
    medium: { filled: 2, color: 'bg-blue-400' },
    low: { filled: 1, color: 'bg-yellow-400' },
  };
  const { filled, color } = config[priority];
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={cn('inline-block w-3 h-1.5 rounded-sm', i < filled ? color : 'bg-gray-200')}
        />
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'border border-blue-300 text-blue-600 bg-blue-50',
    in_progress: 'border border-red-300 text-red-600 bg-red-50',
    pending: 'border border-amber-300 text-amber-600 bg-amber-50',
    resolved: 'border border-green-300 text-green-600 bg-green-50',
  };
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    pending: 'Pending',
    resolved: 'Resolved',
  };
  return (
    <span
      className={cn(
        'text-xs px-2.5 py-0.5 rounded-full font-medium',
        styles[status] ?? 'border border-gray-200 text-gray-500 bg-gray-50'
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Channel icon ─────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, string> = {
    Email: '✉️',
    'Live Chat': '💬',
    Social: '📱',
    Phone: '📞',
  };
  return (
    <span className="text-xs text-gray-500 flex items-center gap-1">
      <span>{icons[channel] ?? '📋'}</span>
      {channel}
    </span>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.name === 'cur');
  const prev = payload.find((p) => p.name === 'prev');
  return (
    <div className="bg-white shadow-lg border border-gray-100 rounded-xl px-3 py-2">
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      {cur && (
        <p className="text-xs text-gray-500">
          This Month: <span className="font-semibold text-orange-500">{cur.value}</span>
        </p>
      )}
      {prev && (
        <p className="text-xs text-gray-500">
          Last Month: <span className="font-semibold text-gray-400">{prev.value}</span>
        </p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
        <div className="flex -space-x-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
          ))}
        </div>
      </div>
      {/* KPI skeleton */}
      <div className="grid grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-2xl h-28" />
        ))}
      </div>
      {/* Analytics skeleton */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-gray-200 rounded-2xl h-64" />
        <div className="space-y-5">
          <div className="bg-gray-200 rounded-2xl h-[120px]" />
          <div className="bg-gray-200 rounded-2xl h-[120px]" />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="bg-gray-200 rounded-2xl h-96" />
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex w-8 h-4 rounded-full transition-colors flex-shrink-0',
        enabled ? 'bg-green-400' : 'bg-gray-200'
      )}
      aria-pressed={enabled}
    >
      <span
        className={cn(
          'inline-block w-3 h-3 rounded-full bg-white shadow-sm transition-transform absolute top-0.5',
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [viewMode, setViewMode] = useState<'List' | 'Board' | 'Pipeline'>('List');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState(INITIAL_DOCS);

  const { isLoading } = useQuery<TicketsResponse>({
    queryKey: ['tickets-dashboard'],
    queryFn: () =>
      api.get<TicketsResponse>('/tickets', { params: { limit: 1 } }).then((r) => r.data),
    retry: false,
  });

  const { data: analyticsData } = useAnalytics();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const firstName = user?.firstName ?? 'Admin';

  return (
    <div className="p-8 space-y-6">
      {/* SECTION 1 — Page Header */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey {firstName} 👋</h1>
          <p className="mt-1 text-gray-400">
            <span className="font-bold text-gray-900">14</span> conversations need your attention
          </p>
        </div>

        {/* Overlapping avatars */}
        <div className="flex items-center">
          {TEAM_AVATARS.map(({ initials, bg }, i) => (
            <div key={initials} className={cn('relative', i !== 0 && '-ml-2')}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white',
                  bg
                )}
              >
                {initials}
              </div>
              {/* Green online dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* SECTION 2 — KPI Stats Grid */}
      <div className="grid grid-cols-4 gap-5">
        {[
          {
            label: 'Open Tickets',
            value: analyticsData?.openTickets ?? '…',
            icon: <Inbox size={18} className="text-gray-500" />,
            trend: '+12 from yesterday',
            trendColor: 'text-emerald-500',
          },
          {
            label: 'Resolved Today',
            value: analyticsData?.resolvedToday ?? '…',
            icon: <CheckCircle2 size={18} className="text-gray-500" />,
            trend: '+5 vs avg',
            trendColor: 'text-emerald-500',
          },
          {
            label: 'SLA Met',
            value: analyticsData?.slaMet != null ? analyticsData.slaMet.toFixed(0) + '%' : '…',
            icon: <Zap size={18} className="text-gray-500" />,
            trend: '-2% this week',
            trendColor: 'text-red-400',
          },
          {
            label: 'CSAT Score',
            value: '4.7',
            icon: <Star size={18} className="text-yellow-400 fill-yellow-400" />,
            trend: '↑ 0.2 vs last month',
            trendColor: 'text-emerald-500',
          },
        ].map(({ label, value, icon, trend, trendColor }, i) => (
          <motion.div
            key={label}
            custom={i + 1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="bg-white border border-gray-100 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
              {icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className={cn('text-xs mt-1', trendColor)}>{trend}</p>
          </motion.div>
        ))}
      </div>

      {/* SECTION 3 — Middle Analytics Row */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid grid-cols-3 gap-5"
      >
        {/* Ticket Volume Chart — col span 2 */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Ticket Volume</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <svg width="20" height="6">
                  <line
                    x1="0"
                    y1="3"
                    x2="20"
                    y2="3"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                <span className="text-xs text-gray-400">Last Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-orange-500 rounded-full" />
                <span className="text-xs text-gray-400">This Month</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="m"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="prev"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="cur"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#gradCur)"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right column — two stacked cards */}
        <div className="flex flex-col gap-5">
          {/* By Channel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1">
            <p className="text-sm font-semibold text-gray-800 mb-4">By Channel</p>
            <div className="space-y-3">
              {CHANNELS.map(({ name, pct, color }) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{name}</span>
                    <span className="text-xs text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-sm font-semibold text-gray-800">Knowledge Base</p>
              <BookOpen size={14} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search docs..."
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300"
                />
              </div>
              <button className="text-xs bg-violet-50 text-violet-600 border border-violet-100 rounded-lg px-3 py-1.5 whitespace-nowrap hover:bg-violet-100 transition-colors">
                + Test AI reply
              </button>
            </div>
            <div className="space-y-2.5">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700 truncate">{doc.title}</span>
                  <Toggle
                    enabled={doc.enabled}
                    onToggle={() =>
                      setDocs((prev) =>
                        prev.map((d) => (d.id === doc.id ? { ...d, enabled: !d.enabled } : d))
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION 4 — Tickets Data Table */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {/* Segmented toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
            {(['List', 'Board', 'Pipeline'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-md transition-all',
                  viewMode === mode
                    ? 'bg-white shadow-sm text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 w-48"
              />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal size={13} />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50 w-10">
                  <input type="checkbox" className="rounded border-gray-300 w-4 h-4" />
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Ticket ID
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Subject
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Customer
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Channel
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Priority
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Date
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Assignee
                </th>
                <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100 text-left bg-gray-50/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {TICKETS.filter(
                (t) =>
                  search === '' ||
                  t.subject.toLowerCase().includes(search.toLowerCase()) ||
                  t.id.toLowerCase().includes(search.toLowerCase())
              ).map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <input type="checkbox" className="rounded border-gray-300 w-4 h-4" />
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {ticket.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50 max-w-xs">
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">
                      {ticket.subject.length > 45
                        ? ticket.subject.slice(0, 45) + '…'
                        : ticket.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: ticket.customer.color }}
                      >
                        {ticket.customer.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700 whitespace-nowrap">
                        {ticket.customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <ChannelIcon channel={ticket.channel} />
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <PriorityBars priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{ticket.date}</span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: ticket.assignee.color }}
                      >
                        {ticket.assignee.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {ticket.assignee.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 border-b border-gray-50">
                    <StatusBadge status={ticket.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
