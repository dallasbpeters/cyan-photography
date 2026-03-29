import React, { useEffect, useId, useMemo, useState } from 'react';
import type { Category } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export type CategoriesManageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  loading: boolean;
  isCreating: boolean;
  onCreate: (label: string) => Promise<string | null>;
  onDelete: (cat: Category) => void | Promise<void>;
};

export const CategoriesManageDialog = ({
  open,
  onOpenChange,
  categories,
  loading,
  isCreating,
  onCreate,
  onDelete,
}: CategoriesManageDialogProps) => {
  const inputId = useId();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const trimmed = query.trim();
  const qLower = trimmed.toLowerCase();

  const filtered = useMemo(() => {
    if (!trimmed) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(qLower) || c.slug.toLowerCase().includes(qLower),
    );
  }, [categories, trimmed, qLower]);

  const hasExactLabel = useMemo(
    () => categories.some((c) => c.label.toLowerCase() === qLower),
    [categories, qLower],
  );

  const showAddNew = Boolean(trimmed) && !hasExactLabel;

  const handleAdd = async () => {
    if (!trimmed || isCreating) return;
    const id = await onCreate(trimmed);
    if (id) setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(32rem,85dvh)] w-[calc(100vw-1.5rem)] max-w-md overflow-hidden border-white/10 bg-neutral-950 text-white sm:w-full"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-light uppercase tracking-[0.2em] text-white">
            Categories
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs uppercase tracking-widest">
            Search, add a new name, or remove categories that have no photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-[10px] uppercase tracking-widest text-white/40">
              Find or add
            </Label>
            <Input
              id={inputId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              disabled={loading}
              autoComplete="off"
              className="border-white/10 bg-black/40 focus:border-white/40"
            />
          </div>

          {showAddNew && (
            <Button
              type="button"
              variant="outline"
              disabled={isCreating || loading}
              className="w-full border-white/20 text-[10px] uppercase tracking-widest text-white hover:bg-white/10"
              onClick={() => void handleAdd()}
            >
              {isCreating ? 'Adding…' : `Add category “${trimmed}”`}
            </Button>
          )}

          <div
            className="max-h-52 overflow-y-auto rounded-md border border-white/10"
            role="list"
            aria-label="Categories"
          >
            {loading ? (
              <p className="p-4 text-center text-xs uppercase tracking-widest text-white/40">
                Loading…
              </p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-white/40">
                {trimmed ? 'No categories match.' : 'No categories yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {filtered.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-light text-white">{cat.label}</span>
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-white/35">
                        {cat.slug}
                      </span>
                      <span className="ml-2 text-xs text-white/40">· {cat.photoCount} photos</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={cat.photoCount > 0}
                      className="shrink-0 text-white/30 hover:text-red-400 disabled:opacity-25"
                      aria-label={`Remove category ${cat.label}`}
                      onClick={() => void onDelete(cat)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
