import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Category } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CategoryPickerProps = {
  id: string;
  label: string;
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  onCreate: (label: string) => Promise<string | null>;
  disabled?: boolean;
  isCreating?: boolean;
  className?: string;
};

export const CategoryPicker = ({
  id,
  label,
  categories,
  value,
  onChange,
  onCreate,
  disabled = false,
  isCreating = false,
  className,
}: CategoryPickerProps) => {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value],
  );

  useEffect(() => {
    if (open) return;
    setQuery(selected?.label ?? '');
  }, [selected?.label, open]);

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

  const pick = useCallback(
    (cat: Category) => {
      onChange(cat.id);
      setQuery(cat.label);
      setOpen(false);
    },
    [onChange],
  );

  const handleCreate = useCallback(async () => {
    if (!trimmed || isCreating) return;
    const newId = await onCreate(trimmed);
    if (newId) {
      onChange(newId);
      setQuery(trimmed);
      setOpen(false);
    }
  }, [trimmed, isCreating, onCreate, onChange]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (filtered.length === 1) {
        pick(filtered[0]);
        return;
      }
      if (showAddNew) {
        void handleCreate();
      }
    }
  };

  return (
    <div ref={containerRef} className={cn('relative gap-3 flex flex-col', className)}>
      <Label htmlFor={id} className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        placeholder="Search or add…"
        className="min-h-11 text-base sm:text-sm border-white/10 bg-black/40 focus:border-white/40"
      />
      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-200 mt-1 max-h-48 min-w-60 w-full overflow-auto rounded-md border border-white/10 bg-neutral-950 py-1 shadow-xl ring-1 ring-black/40"
        >
          {filtered.length === 0 && !showAddNew && (
            <p className="px-3 py-2 text-xs text-white/40">No matches</p>
          )}
          {filtered.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="option"
              aria-selected={cat.id === value}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(cat)}
            >
              <span>{cat.label}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/35">
                {cat.slug}
              </span>
            </button>
          ))}
          {showAddNew && (
            <div className="border-t border-white/10 p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCreating}
                className="w-full border-white/20 text-[10px] uppercase tracking-widest text-white hover:bg-white/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void handleCreate()}
              >
                {isCreating ? 'Adding…' : `Add “${trimmed}”`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
