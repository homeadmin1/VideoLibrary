import type {
  CategoryNode,
  PlaysOverTime,
  RecentVideo,
  ScanResult,
  StatsSummary,
  TagCount,
  TopPlayed,
  Video,
  VideoListResponse
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export interface VideoQuery {
  search?: string;
  category?: string;
  tag?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  favorites?: boolean;
}

export function fetchVideos(query: VideoQuery): Promise<VideoListResponse> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.tag) params.set('tag', query.tag);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.favorites) params.set('favorites', 'true');
  return request(`/api/videos?${params}`);
}

export const fetchCategories = (): Promise<CategoryNode> => request('/api/categories');

export const fetchTags = (): Promise<TagCount[]> => request('/api/tags');

export const streamUrl = (id: number): string => `/api/videos/${id}/stream`;
export const downloadUrl = (id: number): string => `/api/videos/${id}/download`;

export const registerPlay = (id: number): Promise<{ ok: boolean }> =>
  request(`/api/videos/${id}/play`, { method: 'POST' });

export const toggleLike = (id: number): Promise<{ id: number; liked: boolean }> =>
  request(`/api/videos/${id}/like`, { method: 'POST' });

export const toggleFavorite = (
  id: number
): Promise<{ id: number; favorite: boolean; favorited_at: string | null }> =>
  request(`/api/videos/${id}/favorite`, { method: 'POST' });

export const clearFavorites = (): Promise<{ cleared: number }> =>
  request('/api/videos/favorites/clear', { method: 'POST' });

export const updateVideo = (
  id: number,
  data: { title?: string; description?: string; tags?: string[] }
): Promise<Video> =>
  request(`/api/admin/videos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const rescanLibrary = (): Promise<ScanResult> =>
  request('/api/admin/scan', { method: 'POST' });

export const fetchSummary = (): Promise<StatsSummary> => request('/api/stats/summary');
export const fetchTopPlayed = (limit = 10): Promise<TopPlayed[]> =>
  request(`/api/stats/top-played?limit=${limit}`);
export const fetchRecent = (limit = 10): Promise<RecentVideo[]> =>
  request(`/api/stats/recent?limit=${limit}`);
export const fetchPlaysOverTime = (days = 30): Promise<PlaysOverTime[]> =>
  request(`/api/stats/plays-over-time?days=${days}`);

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}
