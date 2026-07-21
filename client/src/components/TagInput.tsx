import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { fetchTags } from '../api';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MAX_SUGGESTIONS = 8;

/**
 * Comma-separated tag input. Typing '#' starts autocompletion against the
 * existing tags in the library (e.g. "#tra" suggests "travel"), minimizing
 * typos when tagging videos.
 */
export default function TagInput({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    fetchTags()
      .then((tags) => setExistingTags(tags.map((t) => t.tag)))
      .catch(() => setExistingTags([]));
  }, []);

  /** The comma-separated token the caret is currently inside. */
  const token = useMemo(() => {
    const before = value.slice(0, caret);
    const start = before.lastIndexOf(',') + 1;
    return { text: before.slice(start), start };
  }, [value, caret]);

  const query = token.text.trimStart();
  const isHashQuery = query.startsWith('#');

  const suggestions = useMemo(() => {
    if (!isHashQuery) return [];
    const q = query.slice(1).toLowerCase();
    const current = value
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return existingTags
      .filter(
        (t) => t.toLowerCase().startsWith(q) && !current.includes(t.toLowerCase())
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [isHashQuery, query, value, existingTags]);

  useEffect(() => {
    setOpen(isHashQuery && suggestions.length > 0);
    setHighlight(0);
  }, [isHashQuery, suggestions.length]);

  const syncCaret = () => {
    setCaret(inputRef.current?.selectionStart ?? value.length);
  };

  const pick = (tag: string) => {
    // Replace the '#query' token (preserving leading whitespace) with the tag.
    const leading = token.text.match(/^\s*/)?.[0] ?? '';
    const before = value.slice(0, token.start) + leading + tag;
    const after = value.slice(caret);
    onChange(before + after);
    setOpen(false);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.setSelectionRange(before.length, before.length);
        setCaret(before.length);
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="tag-input">
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <ul className="tag-suggestions" role="listbox">
          {suggestions.map((tag, i) => (
            <li key={tag}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'highlighted' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(tag);
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                #{tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
