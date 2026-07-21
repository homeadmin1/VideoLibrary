import { useCallback, useEffect, useState } from 'react';
import { fetchVideos, rescanLibrary } from '../api';
import type { ScanResult, Video } from '../types';
import EditVideoModal from '../components/EditVideoModal';
import { formatBytes, formatDuration } from '../api';

const PAGE_SIZE = 20;

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Video | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    fetchVideos({ search: debounced, sort: 'title', page, pageSize: PAGE_SIZE })
      .then((res) => {
        setVideos(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message));
  }, [debounced, page]);

  useEffect(load, [load]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setScanResult(null);
    try {
      const result = await rescanLibrary();
      setScanResult(result);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Video Administration</h1>
        <button className="btn primary" onClick={handleScan} disabled={scanning}>
          {scanning ? 'Scanning…' : '⟳ Rescan library'}
        </button>
      </div>

      {scanResult && (
        <div className="info-banner">
          Scan complete: {scanResult.scanned} files found — {scanResult.added} added,{' '}
          {scanResult.updated} updated, {scanResult.removed} removed (
          {(scanResult.durationMs / 1000).toFixed(1)}s)
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Search videos to manage…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Duration</th>
            <th>Size</th>
            <th>Plays</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.id}>
              <td>
                <div className="cell-title">{v.title}</div>
                <div className="cell-sub">{v.file_path}</div>
              </td>
              <td>{v.category_path || '—'}</td>
              <td>
                <div className="tag-list compact">
                  {v.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td>{formatDuration(v.duration_seconds)}</td>
              <td>{formatBytes(Number(v.size_bytes))}</td>
              <td>{v.play_count}</td>
              <td>
                <button className="btn small" onClick={() => setEditing(v)}>
                  ✎ Edit
                </button>
              </td>
            </tr>
          ))}
          {videos.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-cell">
                No videos found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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

      {editing && (
        <EditVideoModal
          video={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
