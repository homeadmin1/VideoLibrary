import type { CategoryNode } from '../types';

interface Props {
  search: string;
  onSearch: (value: string) => void;
  categories: CategoryNode | null;
  categoryPath: string[];
  onCategoryPath: (path: string[]) => void;
  sort: string;
  onSort: (value: string) => void;
  total: number;
}

/** Search box + cascading category combos (one per folder level) + sort. */
export default function FilterBar({
  search,
  onSearch,
  categories,
  categoryPath,
  onCategoryPath,
  sort,
  onSort,
  total
}: Props) {
  // Build the list of select levels to render based on the current selection.
  const levels: { options: CategoryNode[]; value: string }[] = [];
  let node: CategoryNode | null = categories;
  for (let depth = 0; node && node.children.length > 0; depth++) {
    const value = categoryPath[depth] ?? '';
    levels.push({ options: node.children, value });
    node = node.children.find((c) => c.name === value) ?? null;
  }

  const handleLevelChange = (depth: number, value: string) => {
    const next = categoryPath.slice(0, depth);
    if (value) next.push(value);
    onCategoryPath(next);
  };

  return (
    <div className="filter-bar">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Search by title, description, tags or file name…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search videos"
        />
      </div>

      <div className="filter-controls">
        {levels.map((level, depth) => (
          <select
            key={depth}
            value={level.value}
            onChange={(e) => handleLevelChange(depth, e.target.value)}
            aria-label={depth === 0 ? 'Category' : `Subcategory level ${depth}`}
          >
            <option value="">{depth === 0 ? 'All categories' : 'All subcategories'}</option>
            {level.options.map((c) => (
              <option key={c.path} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        ))}

        <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort by">
          <option value="recent">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="plays">Most played</option>
          <option value="duration">Longest</option>
          <option value="size">Largest file</option>
        </select>

        {categoryPath.length > 0 && (
          <button className="clear-btn" onClick={() => onCategoryPath([])}>
            ✕ Clear filters
          </button>
        )}
      </div>

      <div className="result-count">
        {total} video{total === 1 ? '' : 's'}
      </div>
    </div>
  );
}
