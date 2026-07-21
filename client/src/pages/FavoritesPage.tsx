import { useCallback, useEffect, useState } from 'react';
import { clearFavorites, fetchVideos } from '../api';
import type { Video } from '../types';
import VideoGrid from '../components/VideoGrid';
import VideoModal from '../components/VideoModal';

const PAGE_SIZE = 24;

/** Section where the user views and administers their favorite videos. */
export default function FavoritesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('favorited');
  const [page, setPage] = useState(1);

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Video | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchVideos({ favorites: true, search: debouncedSearch, sort, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setVideos(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  /** When a video changes: if unfavorited, remove it from this list. */
  const handleVideoChange = useCallback((updated: Video) => {
    if (!updated.favorite) {
      setVideos((prev) => prev.filter((v) => v.id !== updated.id));
      setTotal((t) => Math.max(0, t - 1));
      setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
      return;
    }
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  const handleClearAll = () => {
    if (!window.confirm('Remove ALL videos from your favorites?')) return;
    clearFavorites()
      .then(() => {
        setVideos([]);
        setTotal(0);
      })
      .catch((err) => setError(err.message));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div>
          <h1>★ My Favorites</h1>
          <p className="favorites-subtitle">
            {total} favorite {total === 1 ? 'video' : 'videos'}
          </p>
        </div>
        <div className="favorites-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search favorites…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="favorited">Recently favorited</option>
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="plays">Most played</option>
            <option value="duration">Longest</option>
          </select>
          {total > 0 && (
            <button className="btn danger" onClick={handleClearAll}>
              Clear all favorites
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && videos.length === 0 ? (
        <div className="empty-state">Loading favorites…</div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          No favorites yet. Browse the library and click the ☆ icon on any video to add it here.
        </div>
      ) : (
        <VideoGrid videos={videos} onSelect={setSelected} onVideoChange={handleVideoChange} />
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ‹ Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next ›
          </button>
        </div>
      )}

      {selected && (
        <VideoModal
          video={selected}
          onClose={() => setSelected(null)}
          onVideoChange={handleVideoChange}
        />
      )}
    </div>
  );
}
