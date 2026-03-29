export type PhotoRow = {
  id: string;
  url: string;
  title: string;
  category: string;
  sort_order: number;
  created_at: string | Date;
};

export type PhotoDto = {
  id: string;
  url: string;
  title: string;
  category: 'film' | 'photography';
  order: number;
  createdAt: string;
};

export const rowToDto = (row: PhotoRow): PhotoDto => ({
  id: row.id,
  url: row.url,
  title: row.title,
  category: row.category as 'film' | 'photography',
  order: row.sort_order,
  createdAt: new Date(row.created_at).toISOString(),
});
