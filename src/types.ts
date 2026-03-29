export interface Photo {
  id: string;
  url: string;
  title: string;
  category: 'film' | 'photography';
  order: number;
  createdAt: string;
}

export type ViewMode = 'all' | 'film' | 'photography';
