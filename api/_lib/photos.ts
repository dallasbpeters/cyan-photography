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

export const rowToDto = (row: PhotoRow): PhotoDto => ({
  id: row.id,
  url: row.url,
  title: row.title,
  categoryId: row.category_id,
  category: row.category_slug,
  categoryLabel: row.category_label,
  order: row.sort_order,
  createdAt: new Date(row.created_at).toISOString(),
});
