import { useEffect, useRef } from 'react';
import {
  downloadUrl,
  formatBytes,
  formatDuration,
  registerPlay,
  streamUrl,
  toggleFavorite,
  toggleLike
} from '../api';
import type { Video } from '../types';

interface Props {
  video: Video;
  onClose: () => void;
  onVideoChange: (video: Video) => void;
}

/** Full player modal with metadata, full-screen and download actions. */
export default function VideoModal({ video, onClose, onVideoChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRegistered = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handlePlay = () => {
    if (playRegistered.current) return;
    playRegistered.current = true;
    registerPlay(video.id).catch(() => undefined);
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen().catch(() => undefined);
  };

  const handleLike = () => {
    toggleLike(video.id)
      .then((res) => onVideoChange({ ...video, liked: res.liked }))
      .catch(() => undefined);
  };

  const handleFavorite = () => {
    toggleFavorite(video.id)
      .then((res) =>
        onVideoChange({ ...video, favorite: res.favorite, favorited_at: res.favorited_at })
      )
      .catch(() => undefined);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <video
          ref={videoRef}
          className="modal-player"
          src={streamUrl(video.id)}
          controls
          autoPlay
          onPlay={handlePlay}
        />

        <div className="modal-info">
          <h2>{video.title}</h2>
          {video.description && <p className="description">{video.description}</p>}

          <div className="metadata-grid">
            <div>
              <label>Category</label>
              <span>{video.category_path || 'Uncategorized'}</span>
            </div>
            <div>
              <label>Duration</label>
              <span>{formatDuration(video.duration_seconds)}</span>
            </div>
            <div>
              <label>Size</label>
              <span>{formatBytes(Number(video.size_bytes))}</span>
            </div>
            <div>
              <label>Resolution</label>
              <span>{video.width && video.height ? `${video.width}×${video.height}` : '—'}</span>
            </div>
            <div>
              <label>Plays</label>
              <span>{video.play_count}</span>
            </div>
            <div>
              <label>File</label>
              <span className="file-path">{video.file_path}</span>
            </div>
          </div>

          {video.tags.length > 0 && (
            <div className="tag-list">
              {video.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn primary" onClick={handleFullscreen}>
              ⛶ Full screen
            </button>
            <a className="btn" href={downloadUrl(video.id)} download>
              ⬇ Download
            </a>
            <button className={`btn like ${video.liked ? 'active' : ''}`} onClick={handleLike}>
              {video.liked ? '♥ Liked' : '♡ Like'}
            </button>
            <button
              className={`btn fav ${video.favorite ? 'active' : ''}`}
              onClick={handleFavorite}
            >
              {video.favorite ? '★ In favorites' : '☆ Add to favorites'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
