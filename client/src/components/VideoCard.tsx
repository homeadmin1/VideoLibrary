import { useRef, useState, type MouseEvent } from 'react';
import { formatDuration, streamUrl, toggleFavorite, toggleLike } from '../api';
import type { Video } from '../types';

interface Props {
  video: Video;
  onSelect: (video: Video) => void;
  onVideoChange: (video: Video) => void;
}

/** True on phones/tablets where hover is not available. */
const isTouchDevice =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

/**
 * Grid card with video preview: mouse-hover on desktop, tap-to-preview on
 * touch devices (first tap previews, second tap opens the player).
 */
export default function VideoCard({ video, onSelect, onVideoChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewing, setPreviewing] = useState(false);

  const startPreview = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => undefined);
  };

  const stopPreview = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0.5;
    } catch {
      /* metadata not loaded yet */
    }
  };

  const handleEnter = () => {
    if (!isTouchDevice) startPreview();
  };

  const handleLeave = () => {
    stopPreview();
    setPreviewing(false);
  };

  const handleClick = () => {
    if (isTouchDevice && !previewing) {
      // First tap on touch screens: start the preview instead of opening.
      setPreviewing(true);
      startPreview();
      return;
    }
    onSelect(video);
  };

  const handleLike = (e: MouseEvent) => {
    e.stopPropagation();
    toggleLike(video.id)
      .then((res) => onVideoChange({ ...video, liked: res.liked }))
      .catch(() => undefined);
  };

  const handleFavorite = (e: MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(video.id)
      .then((res) =>
        onVideoChange({ ...video, favorite: res.favorite, favorited_at: res.favorited_at })
      )
      .catch(() => undefined);
  };

  return (
    <article
      className="video-card"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      title={video.title}
    >
      <div className="thumb">
        <video
          ref={videoRef}
          src={`${streamUrl(video.id)}#t=0.5`}
          preload="metadata"
          muted
          loop
          playsInline
        />
        {video.duration_seconds != null && (
          <span className="duration-badge">{formatDuration(video.duration_seconds)}</span>
        )}
        {previewing && <span className="preview-hint">Tap again to open</span>}
        <div className="card-actions">
          <button
            className={`icon-btn like-btn ${video.liked ? 'active' : ''}`}
            onClick={handleLike}
            aria-label={video.liked ? 'Unlike' : 'Like'}
            title={video.liked ? 'Unlike' : 'Like'}
          >
            {video.liked ? '♥' : '♡'}
          </button>
          <button
            className={`icon-btn fav-btn ${video.favorite ? 'active' : ''}`}
            onClick={handleFavorite}
            aria-label={video.favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={video.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {video.favorite ? '★' : '☆'}
          </button>
        </div>
      </div>
      <div className="card-body">
        <h3 className="card-title">{video.title}</h3>
        <div className="card-meta">
          <span className="category-chip">{video.category_path || 'Uncategorized'}</span>
        </div>
        <div className="card-stats">
          <span>▶ {video.play_count}</span>
          <span>⬇ {video.download_count}</span>
        </div>
      </div>
    </article>
  );
}
