import type { Photo } from '../types';

const apiBase = (): string => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const photosPath = (): string => `${apiBase()}/api/photos`;

const getAuthToken = (): string | null => sessionStorage.getItem('cyan_admin_token');

const jsonHeaders = (): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const portfolioService = {
  getPhotos: async (): Promise<Photo[]> => {
    const res = await fetch(photosPath());
    if (!res.ok) {
      throw new Error('Failed to load portfolio');
    }
    return res.json() as Promise<Photo[]>;
  },

  addPhoto: async (photo: Omit<Photo, 'id' | 'createdAt'>): Promise<Photo> => {
    const res = await fetch(photosPath(), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        url: photo.url,
        title: photo.title,
        category: photo.category,
        order: photo.order,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Photo & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Could not add photo');
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

  notifyPhotosChanged: () => {
    window.dispatchEvent(new CustomEvent('cyan-photos-changed'));
  },
};

export const authStorage = {
  getToken: getAuthToken,
  setToken: (token: string | null) => {
    if (token) sessionStorage.setItem('cyan_admin_token', token);
    else sessionStorage.removeItem('cyan_admin_token');
  },
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string }> => {
    const res = await fetch(`${apiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    if (!data.token) {
      throw new Error('Invalid response from server');
    }
    return { token: data.token };
  },
};
