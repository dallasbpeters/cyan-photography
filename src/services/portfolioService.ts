import type { Category, Photo } from '../types';

const apiBase = (): string => {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_API === '1') {
    return '';
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || String(raw).trim() === '') {
    return '';
  }
  return String(raw).replace(/\/$/, '');
};

const photosPath = (): string => `${apiBase()}/api/photos`;
const categoriesPath = (): string => `${apiBase()}/api/categories`;
const uploadPath = (): string => `${apiBase()}/api/upload`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
/** Persists across iOS PWA launches; sessionStorage did not. */
const ADMIN_TOKEN_KEY = 'cyan_admin_token';

const readStoredToken = (): string | null => {
  try {
    const persisted = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (persisted) return persisted;
    const legacy = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (legacy) {
      localStorage.setItem(ADMIN_TOKEN_KEY, legacy);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      return legacy;
    }
    return null;
  } catch {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  }
};

const writeStoredToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    try {
      if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* storage unavailable (e.g. locked down mode) */
    }
  }
};

const getAuthToken = (): string | null => readStoredToken();

const jsonHeaders = (): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const devApiHintLocal =
  'Run `pnpm dev:local` (starts API on :3000 + Vite on :5173), or two terminals: `pnpm dev:vercel` then `pnpm dev`. Comment out `VITE_API_BASE_URL` when using the local API.';

const devApiHintRemote =
  'You are calling a remote API via `VITE_API_BASE_URL`. If that fails, use `pnpm dev:local` instead (it ignores that var), or fix production CORS / deploy.';

export const portfolioService = {
  getPhotos: async (): Promise<Photo[]> => {
    let res: Response;
    try {
      res = await fetch(photosPath());
    } catch {
      if (import.meta.env.DEV) {
        const url = photosPath();
        const hint = url.startsWith('http') ? devApiHintRemote : devApiHintLocal;
        throw new Error(`Could not reach ${url}. ${hint}`);
      }
      throw new Error('Failed to load portfolio');
    }
    if (!res.ok) {
      const detail = import.meta.env.DEV ? ` (${res.status} ${res.statusText})` : '';
      throw new Error(`Failed to load portfolio${detail}`);
    }
    return res.json() as Promise<Photo[]>;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(categoriesPath());
    if (!res.ok) {
      const detail = import.meta.env.DEV ? ` (${res.status})` : '';
      throw new Error(`Failed to load categories${detail}`);
    }
    return res.json() as Promise<Category[]>;
  },

  createCategory: async (input: {
    label: string;
    slug?: string;
    sortOrder: number;
  }): Promise<Category> => {
    const res = await fetch(categoriesPath(), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        label: input.label,
        ...(input.slug ? { slug: input.slug } : {}),
        sortOrder: input.sortOrder,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Category & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Could not create category');
    }
    return data as Category;
  },

  deleteCategory: async (id: string): Promise<void> => {
    const res = await fetch(`${categoriesPath()}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    if (res.status === 204 || res.status === 404) return;
    const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    const msg = [data.error, data.detail].filter(Boolean).join(' ');
    throw new Error(msg || 'Could not delete category');
  },

  uploadImageFile: async (file: File): Promise<{ url: string }> => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
    const contentType = file.type && (allowed as readonly string[]).includes(file.type) ? file.type : '';
    if (!contentType) {
      throw new Error('Choose a JPEG, PNG, WebP, or GIF image');
    }
    const b64 = await fileToBase64(file);
    const res = await fetch(uploadPath(), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        file: b64,
        filename: file.name || 'image',
        contentType,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      hint?: string;
    };
    if (!res.ok) {
      throw new Error([data.error, data.hint].filter(Boolean).join(' — ') || 'Upload failed');
    }
    if (!data.url) {
      throw new Error('Invalid upload response');
    }
    return { url: data.url };
  },

  batchSetPhotoCategories: async (photoIds: string[], categoryId: string): Promise<number> => {
    const res = await fetch(`${photosPath()}/batch`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ photoIds, categoryId }),
    });
    const data = (await res.json().catch(() => ({}))) as { updated?: number; error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Could not update categories');
    }
    return typeof data.updated === 'number' ? data.updated : 0;
  },

  batchDeletePhotos: async (photoIds: string[]): Promise<number> => {
    const res = await fetch(`${photosPath()}/batch-delete`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ photoIds }),
    });
    const data = (await res.json().catch(() => ({}))) as { deleted?: number; error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Could not delete photos');
    }
    return typeof data.deleted === 'number' ? data.deleted : 0;
  },

  addPhoto: async (photo: {
    url: string;
    title: string;
    categoryId: string;
    order: number;
  }): Promise<Photo> => {
    const res = await fetch(photosPath(), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        url: photo.url,
        title: photo.title,
        categoryId: photo.categoryId,
        order: photo.order,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Photo & { error?: string; debug?: string };
    if (!res.ok) {
      const base = data.error || 'Could not add photo';
      const hint =
        import.meta.env.DEV && typeof data.debug === 'string' && data.debug.trim()
          ? ` (${data.debug})`
          : '';
      throw new Error(base + hint);
    }
    return data as Photo;
  },

  deletePhoto: async (id: string): Promise<void> => {
    const res = await fetch(`${photosPath()}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    if (res.status === 204 || res.status === 404) return;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Could not delete photo');
  },

  updatePhoto: async (
    id: string,
    data: { title: string; categoryId: string; order: number },
  ): Promise<Photo> => {
    const res = await fetch(`${photosPath()}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({
        title: data.title,
        categoryId: data.categoryId,
        order: data.order,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Photo & { error?: string };
    if (!res.ok) {
      throw new Error(json.error || 'Could not update photo');
    }
    return json as Photo;
  },

  notifyPhotosChanged: () => {
    window.dispatchEvent(new CustomEvent('cyan-photos-changed'));
  },

  notifyCategoriesChanged: () => {
    window.dispatchEvent(new CustomEvent('cyan-categories-changed'));
  },
};

export const authStorage = {
  getToken: readStoredToken,
  setToken: writeStoredToken,
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string }> => {
    const url = `${apiBase()}/api/auth/login`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
    } catch {
      throw new Error(
        `Could not reach ${url}. Use \`pnpm dev:local\` (API on :3000) or check your network / VITE_API_BASE_URL.`,
      );
    }

    const text = await res.text();
    let data: { token?: string; error?: string };
    try {
      data = JSON.parse(text) as { token?: string; error?: string };
    } catch {
      throw new Error(
        `Login failed (${res.status}): server did not return JSON. Is the API running?`,
      );
    }

    if (!res.ok) {
      throw new Error(data.error || `Login failed (${res.status})`);
    }
    if (!data.token) {
      throw new Error('Invalid response from server (no token)');
    }
    return { token: data.token };
  },
};
