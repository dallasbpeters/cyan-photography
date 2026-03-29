export type PhotoRow = {
  id: string;
  url: string;
  title: string;
  sort_order: number;
  created_at: string | Date;
  category_id: string;
  category_slug: string;
  category_label: string;
};

export type PhotoDto = {
  id: string;
  url: string;
  title: string;
  categoryId: string;
  category: string;
  categoryLabel: string;
  order: number;
  createdAt: string;
};

const toIso = (value: string | Date): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date(0).toISOString();
  return d.toISOString();
};

export const rowToDto = (row: PhotoRow): PhotoDto => ({
  id: row.id,
  url: row.url,
  title: row.title,
  categoryId: row.category_id,
  category: row.category_slug,
  categoryLabel: row.category_label,
  order: Number(row.sort_order),
  createdAt: toIso(row.created_at),
});
