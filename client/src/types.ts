export interface Video {
  id: number;
  file_path: string;
  file_name: string;
  title: string;
  description: string;
  tags: string[];
  category_path: string;
  size_bytes: number;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  play_count: number;
  download_count: number;
  liked: boolean;
  favorite: boolean;
  favorited_at: string | null;
  last_played_at: string | null;
  file_modified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Video[];
}

export interface CategoryNode {
  name: string;
  path: string;
  count: number;
  children: CategoryNode[];
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface StatsSummary {
  total_videos: number;
  total_size_bytes: number;
  total_plays: number;
  total_downloads: number;
  total_duration_seconds: number;
  total_categories: number;
}

export interface TopPlayed {
  id: number;
  title: string;
  category_path: string;
  play_count: number;
  download_count: number;
  last_played_at: string | null;
}

export interface RecentVideo {
  id: number;
  title: string;
  category_path: string;
  size_bytes: number;
  created_at: string;
}

export interface PlaysOverTime {
  day: string;
  plays: number;
}

export interface ScanResult {
  scanned: number;
  added: number;
  updated: number;
  removed: number;
  durationMs: number;
}
