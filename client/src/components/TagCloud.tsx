import { useEffect, useState } from 'react';
import { fetchTags } from '../api';
import type { TagCount } from '../types';

interface Props {
  selectedTag: string;
  onSelect: (tag: string) => void;
}

const MAX_TAGS = 40;
const MIN_SIZE = 0.75; // rem
const MAX_SIZE = 1.3; // rem

/** Word cloud of existing tags; font size scales with usage count. */
export default function TagCloud({ selectedTag, onSelect }: Props) {
  const [tags, setTags] = useState<TagCount[]>([]);

  useEffect(() => {
    fetchTags().then(setTags).catch(() => setTags([]));
  }, []);

  if (tags.length === 0) {
    return <p className="tag-cloud-empty">No tags yet.</p>;
  }

  const shown = tags.slice(0, MAX_TAGS);
  const counts = shown.map((t) => t.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  const sizeFor = (count: number): string => {
    const ratio = max === min ? 0.5 : (count - min) / (max - min);
    return `${(MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE)).toFixed(2)}rem`;
  };

  // Alphabetical order reads better in a cloud.
  const sorted = [...shown].sort((a, b) => a.tag.localeCompare(b.tag));

  return (
    <div className="tag-cloud">
      {sorted.map((t) => (
        <button
          key={t.tag}
          className={`cloud-tag ${selectedTag === t.tag ? 'active' : ''}`}
          style={{ fontSize: sizeFor(t.count) }}
          title={`${t.count} video${t.count === 1 ? '' : 's'}`}
          onClick={() => onSelect(selectedTag === t.tag ? '' : t.tag)}
        >
          {t.tag}
        </button>
      ))}
    </div>
  );
}
