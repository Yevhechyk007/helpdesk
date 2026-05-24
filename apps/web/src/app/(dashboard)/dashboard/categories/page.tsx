'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
}

// ─── Category form inside dialog ─────────────────────────────────────────────

function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CategoryFormData>(initial);
  const [error, setError] = useState('');

  // Reset form when dialog opens
  function handleOpenChange(v: boolean) {
    if (v) {
      setForm(initial);
      setError('');
    }
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    onSubmit({ name: form.name.trim(), description: form.description.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial.name ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Billing"
              className={cn(error ? 'border-red-400' : '')}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  categoryName,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryName: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 py-2">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900">{categoryName}</span>? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
    enabled: user?.role === 'admin',
    retry: false,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: CategoryFormData) => api.post('/categories', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryFormData }) =>
      api.patch(`/categories/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      setEditTarget(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
    },
  });

  // Guard: admin only
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64">
        <Tag size={40} className="text-gray-200 mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Access Denied</h2>
        <p className="text-sm text-gray-400 mt-1">This page is only accessible to administrators.</p>
      </div>
    );
  }

  const formInitial: CategoryFormData = editTarget
    ? { name: editTarget.name, description: editTarget.description ?? '' }
    : { name: '', description: '' };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleFormSubmit(data: CategoryFormData) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: data });
    } else {
      createMutation.mutate(data);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setDialogOpen(true);
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-400">Manage ticket categories and their settings.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={15} />
          New Category
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag size={36} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No categories yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "New Category" to create your first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Name', 'Description', 'Status', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        'text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 text-left',
                        col === 'Actions' && 'text-right'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="text-sm text-gray-500 line-clamp-1">
                        {cat.description ?? (
                          <span className="text-gray-300 italic">No description</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={cat.isActive ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs font-medium',
                          cat.isActive
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-50'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditTarget(null);
        }}
        initial={formInitial}
        onSubmit={handleFormSubmit}
        isPending={isMutating}
      />

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          categoryName={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
