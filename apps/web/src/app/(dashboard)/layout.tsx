'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Headphones,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

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

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'User';
  const initials = user
    ? getInitials(user.firstName, user.lastName)
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4">
          <Headphones className="size-5 text-primary" />
          <span className="font-semibold text-sm">Helpdesk</span>
        </div>
        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator />

        {/* User info at bottom */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm',
                'hover:bg-muted transition-colors outline-none'
              )}
            >
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {user?.email ?? ''}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col pl-60">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
          <h1 className="text-sm font-semibold text-foreground">
            {navLinks.find(({ href }) =>
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href)
            )?.label ?? 'Dashboard'}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
