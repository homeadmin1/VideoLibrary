import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchCategories, fetchVideos } from '../api';
import type { CategoryNode, Video } from '../types';
import FilterBar from '../components/FilterBar';
import VideoGrid from '../components/VideoGrid';
import VideoModal from '../components/VideoModal';

const PAGE_SIZE = 24;

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const categoryPath = useMemo(() => (category ? category.split('/') : []), [category]);
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<CategoryNode | null>(null);
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
    fetchCategories().then(setCategories).catch(() => setCategories(null));
  }, []);

  const setCategoryPath = useCallback(
    (path: string[]) => {
      const joined = path.join('/');
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (joined) next.set('category', joined);
          else next.delete('category');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearTag = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('tag');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, tag, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVideos({ search: debouncedSearch, category, tag, sort, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setVideos(res.items);
        setTotal(res.total);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, tag, sort, page]);

  /** Merge like/favorite changes into the list and the open modal. */
  const handleVideoChange = useCallback((updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="library-page">
      <FilterBar
        search={search}
        onSearch={setSearch}
        categories={categories}
        categoryPath={categoryPath}
        onCategoryPath={setCategoryPath}
        sort={sort}
        onSort={setSort}
        total={total}
      />

      {tag && (
        <div className="active-tag-bar">
          Showing videos tagged
          <span className="active-tag-chip">
            #{tag}
            <button onClick={clearTag} aria-label="Clear tag filter">
              ✕
            </button>
          </span>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && videos.length === 0 ? (
        <div className="empty-state">Loading library…</div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          No videos found. Add files to the <code>video-library</code> folder and run a scan
          from the Administration page.
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
