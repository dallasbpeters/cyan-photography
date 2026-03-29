export type DailyInspirationPhoto = {
  unsplashPhotoId: string;
  imageUrl: string;
  imageThumbUrl: string;
  photographerName: string;
  photographerUsername: string;
  unsplashHtmlLink: string;
  altText: string | null;
  downloadLocation: string | null;
};

type UnsplashRandomJson = {
  id: string;
  urls?: { regular?: string; small?: string; thumb?: string };
  user?: { name?: string; username?: string };
  links?: { html?: string; download_location?: string };
  description?: string | null;
  alt_description?: string | null;
};

const FALLBACK_BY_DAY: DailyInspirationPhoto[] = [
  {
    unsplashPhotoId: 'fallback-0',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    imageThumbUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
    photographerName: 'Yannick Pulver',
    photographerUsername: 'yanu',
    unsplashHtmlLink: 'https://unsplash.com/photos/white-and-black-mountain-snowcap-under-clear-skies-SqE4YLx1Iog',
    altText: 'Mountain landscape',
    downloadLocation: null,
  },
  {
    unsplashPhotoId: 'fallback-1',
    imageUrl:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
    imageThumbUrl:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
    photographerName: 'David Marcu',
    photographerUsername: 'davidmarcu',
    unsplashHtmlLink: 'https://unsplash.com/photos/green-pine-trees-on-mountain-range-78A265wPiO4',
    altText: 'Forest and mountains',
    downloadLocation: null,
  },
  {
    unsplashPhotoId: 'fallback-2',
    imageUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    imageThumbUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
    photographerName: 'V2osk',
    photographerUsername: 'v2osk',
    unsplashHtmlLink: 'https://unsplash.com/photos/landscape-photography-of-mountain-hit-by-sun-rays-lVljzGX9BN4',
    altText: 'Foggy mountains',
    downloadLocation: null,
  },
];

export const pickFallbackForDate = (utcDate: string): DailyInspirationPhoto => {
  let hash = 0;
  for (let i = 0; i < utcDate.length; i++) hash = (hash + utcDate.charCodeAt(i) * (i + 1)) % 997;
  return FALLBACK_BY_DAY[Math.abs(hash) % FALLBACK_BY_DAY.length]!;
};

const mapJson = (json: UnsplashRandomJson): DailyInspirationPhoto | null => {
  const id = json.id;
  const regular = json.urls?.regular;
  if (!id || !regular) return null;
  const user = json.user;
  const links = json.links;
  return {
    unsplashPhotoId: id,
    imageUrl: regular,
    imageThumbUrl: json.urls?.small ?? json.urls?.thumb ?? regular,
    photographerName: user?.name ?? 'Unknown',
    photographerUsername: user?.username ?? '',
    unsplashHtmlLink: links?.html ?? 'https://unsplash.com',
    altText: json.description ?? json.alt_description ?? null,
    downloadLocation: links?.download_location ?? null,
  };
};

export const fetchUnsplashDailyPhoto = async (): Promise<DailyInspirationPhoto> => {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) {
    const d = new Date().toISOString().slice(0, 10);
    return pickFallbackForDate(d);
  }

  const url =
    'https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high';
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) {
    const d = new Date().toISOString().slice(0, 10);
    return pickFallbackForDate(d);
  }
  const json = (await res.json()) as UnsplashRandomJson;
  const mapped = mapJson(json);
  if (!mapped) {
    const d = new Date().toISOString().slice(0, 10);
    return pickFallbackForDate(d);
  }

  if (mapped.downloadLocation) {
    void fetch(mapped.downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    }).catch(() => {});
  }

  return mapped;
};
