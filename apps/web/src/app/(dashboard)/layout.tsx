'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Ticket, Users, LogOut, MessageSquare } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/users', label: 'Users', icon: Users },
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return null;
  }

  const handleSignOut = () => {
    logout();
    document.cookie =
      'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/login');
  };

  const initials = user ? getInitials(user.firstName, user.lastName) : 'U';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Narrow icon-only sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col items-center"
        style={{ width: 68, backgroundColor: '#1c241e' }}
      >
        {/* Logo area */}
        <div className="flex h-16 w-full items-center justify-center">
          <MessageSquare className="text-white" style={{ width: 16, height: 16 }} />
        </div>

        {/* Nav icons */}
        <nav className="flex flex-1 flex-col items-center gap-1 pt-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                  isActive
                    ? 'bg-[#a8e063]/20'
                    : 'hover:bg-white/5'
                )}
              >
                <Icon
                  style={{ width: 20, height: 20 }}
                  className={cn(
                    isActive ? 'text-[#a8e063]' : 'text-[#8a9e8d]'
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user avatar with dropdown */}
        <div className="mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white outline-none hover:opacity-90 transition-opacity"
              title={user ? `${user.firstName} ${user.lastName}` : 'User'}
            >
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-44">
              {user && (
                <div className="px-2 py-1.5 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600 mt-1"
              >
                <LogOut className="mr-2 size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto bg-[#f9fafb]"
        style={{ marginLeft: 68 }}
      >
        {children}
      </main>
    </div>
  );
}
