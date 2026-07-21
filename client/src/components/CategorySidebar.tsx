import { useState } from 'react';
import type { CategoryNode } from '../types';

interface Props {
  categories: CategoryNode | null;
  selectedPath: string; // e.g. "long-videos/Category A"
  onSelect: (path: string) => void;
  totalVideos: number;
}

/** Vertical collapsible category tree used in the app sidebar. */
export default function CategorySidebar({
  categories,
  selectedPath,
  onSelect,
  totalVideos
}: Props) {
  return (
    <ul className="tree-root" role="tree">
      <li>
        <button
          className={`tree-item root ${selectedPath === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          <span className="tree-icon">🗂</span>
          <span className="tree-label">All videos</span>
          <span className="tree-count">{totalVideos}</span>
        </button>
      </li>
      {categories?.children.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </ul>
  );
}

interface NodeProps {
  node: CategoryNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  depth: number;
}

function TreeNode({ node, selectedPath, onSelect, depth }: NodeProps) {
  const isSelected = selectedPath === node.path;
  const isOnSelectedPath = selectedPath.startsWith(node.path + '/');
  const [expanded, setExpanded] = useState(isOnSelectedPath || depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div className={`tree-item ${isSelected ? 'active' : ''}`}>
        {hasChildren ? (
          <button
            className={`tree-toggle ${expanded ? 'open' : ''}`}
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            ▸
          </button>
        ) : (
          <span className="tree-toggle placeholder" />
        )}
        <button className="tree-select" onClick={() => onSelect(isSelected ? '' : node.path)}>
          <span className="tree-icon">{hasChildren ? (expanded ? '📂' : '📁') : '🎬'}</span>
          <span className="tree-label">{node.name}</span>
          <span className="tree-count">{node.count}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="tree-children" role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
