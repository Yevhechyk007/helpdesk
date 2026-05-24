'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Ticket, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  ticketId: string | null;
  ticketTitle: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0';
  if (type === 'assigned') {
    return (
      <div className={cn(base, 'bg-blue-50')}>
        <Ticket size={14} className="text-blue-500" />
      </div>
    );
  }
  if (type === 'status_changed') {
    return (
      <div className={cn(base, 'bg-green-50')}>
        <CheckCircle2 size={14} className="text-green-500" />
      </div>
    );
  }
  if (type === 'escalated' || type === 'sla_breached' || type === 'sla_warning') {
    return (
      <div className={cn(base, 'bg-red-50')}>
        <AlertCircle size={14} className="text-red-500" />
      </div>
    );
  }
  return (
    <div className={cn(base, 'bg-gray-50')}>
      <MessageSquare size={14} className="text-gray-400" />
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () =>
      api
        .get<NotificationsResponse>('/notifications', {
          params: { limit: 10, unreadOnly: false },
        })
        .then((r) => r.data),
    refetchInterval: 30_000,
    retry: false,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleNotifClick(notif: Notification) {
    if (!notif.isRead) {
      markOneRead.mutate(notif.id);
    }
    setOpen(false);
    router.push('/dashboard/tickets');
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell style={{ width: 18, height: 18 }} className="text-[#8a9e8d]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-full ml-2 top-0 z-50 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
          style={{ maxHeight: 420 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 352 }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={28} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
                    !notif.isRead && 'bg-blue-50/40 hover:bg-blue-50/60'
                  )}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {notif.ticketTitle ?? 'Ticket notification'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5 capitalize">
                      {notif.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
