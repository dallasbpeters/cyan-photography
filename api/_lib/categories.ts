export type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  created_at: string | Date;
  photo_count?: number;
};

export type CategoryDto = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  photoCount: number;
  createdAt: string;
};

export const categoryRowToDto = (row: CategoryRow): CategoryDto => ({
  id: row.id,
  slug: row.slug,
  label: row.label,
  sortOrder: row.sort_order,
  photoCount: row.photo_count ?? 0,
  createdAt: new Date(row.created_at).toISOString(),
});

export const slugifyLabel = (label: string): string => {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'category';
};
