export interface Category {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  photoCount: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  url: string;
  title: string;
  categoryId: string;
  /** URL-safe key; matches `Category.slug` */
  category: string;
  categoryLabel: string;
  order: number;
  createdAt: string;
}

export type ViewMode = 'all' | string;
