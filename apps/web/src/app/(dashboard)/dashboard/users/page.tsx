'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'agent' | 'customer';

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const roleStyle: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  agent: 'bg-green-100 text-green-700',
  customer: 'bg-blue-100 text-blue-700',
};

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  agent: 'Agent',
  customer: 'Klient',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        roleStyle[role],
      )}
    >
      {roleLabel[role]}
    </span>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

const avatarColors = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-500',
];

function UserAvatar({ user }: { user: UserRow }) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const color = avatarColors[user.email.charCodeAt(0) % avatarColors.length];
  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white',
        color,
      )}
    >
      {initials}
    </div>
  );
}

// ─── Create user dialog ───────────────────────────────────────────────────────

const createUserSchema = z
  .object({
    firstName: z.string().min(1, 'Required').max(100),
    lastName: z.string().min(1, 'Required').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters').max(72),
    confirmPassword: z.string(),
    role: z.enum(['customer', 'agent', 'admin']),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type CreateUserValues = z.infer<typeof createUserSchema>;

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateUserValues) =>
      api.post('/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('Email already registered');
      } else {
        toast.error('Failed to create user');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Klient (Customer)</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Role selector (inline, admin only) ──────────────────────────────────────

function RoleSelector({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (role: UserRole) =>
      api.patch(`/users/${user.id}/role`, { role }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  // Prevent changing your own role
  if (user.id === currentUserId) {
    return <RoleBadge role={user.role} />;
  }

  return (
    <Select
      value={user.role}
      onValueChange={(val) => mutation.mutate(val as UserRole)}
      disabled={mutation.isPending}
    >
      <SelectTrigger className="h-7 w-[110px] text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0">
        <SelectValue>
          <RoleBadge role={user.role} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="customer" className="text-xs">Klient</SelectItem>
        <SelectItem value="agent" className="text-xs">Agent</SelectItem>
        <SelectItem value="admin" className="text-xs">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="space-y-1">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-3 w-36 rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-muted" />
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: usersList = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: () => api.get<UserRow[]>('/users').then((r) => r.data),
  });

  const filtered = usersList.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const counts = {
    total: usersList.length,
    admin: usersList.filter((u) => u.role === 'admin').length,
    agent: usersList.filter((u) => u.role === 'agent').length,
    customer: usersList.filter((u) => u.role === 'customer').length,
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {counts.total} total · {counts.admin} admin · {counts.agent} agent · {counts.customer} klient
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            Create User
          </Button>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {search ? 'No users match your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {u.firstName} {u.lastName}
                          {u.id === currentUser?.id && (
                            <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <RoleSelector user={u} currentUserId={currentUser?.id ?? ''} />
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
