import { FormEvent, useState } from 'react';
import { updateVideo } from '../api';
import type { Video } from '../types';
import TagInput from './TagInput';

interface Props {
  video: Video;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditVideoModal({ video, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateVideo(video.id, {
        title: title.trim(),
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel edit-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Edit video metadata</h2>
        <p className="cell-sub">{video.file_path}</p>

        <form onSubmit={handleSubmit} className="edit-form">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe this video to improve search results…"
            />
          </label>
          <label>
            Tags <small>(comma separated — type # to autocomplete existing tags)</small>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="tag1, tag2, #type-to-autocomplete…"
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
