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

export type DailyChallengeInfo = {
  challengeDate: string;
  imageUrl: string;
  imageThumbUrl: string | null;
  photographerName: string | null;
  photographerUsername: string | null;
  unsplashPhotoId: string | null;
  unsplashHtmlLink: string | null;
  altText: string | null;
};

export type DailyChallengeJournal = {
  body: string;
  updatedAt: string;
};

export type DailyChallengeResponse = {
  challenge: DailyChallengeInfo;
  journal: DailyChallengeJournal | null;
};
