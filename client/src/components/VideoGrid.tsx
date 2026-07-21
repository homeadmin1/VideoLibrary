import type { Video } from '../types';
import VideoCard from './VideoCard';

interface Props {
  videos: Video[];
  onSelect: (video: Video) => void;
  onVideoChange: (video: Video) => void;
}

export default function VideoGrid({ videos, onSelect, onVideoChange }: Props) {
  return (
    <div className="video-grid">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} onSelect={onSelect} onVideoChange={onVideoChange} />
      ))}
    </div>
  );
}
