import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  fetchCategories,
  fetchPlaysOverTime,
  fetchRecent,
  fetchSummary,
  fetchTopPlayed,
  formatBytes,
  formatDuration
} from '../api';
import type {
  CategoryNode,
  PlaysOverTime,
  RecentVideo,
  StatsSummary,
  TopPlayed
} from '../types';

function CategoryTree({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  return (
    <ul className={depth === 0 ? 'category-tree' : 'category-tree nested'}>
      {node.children.map((child) => (
        <li key={child.path}>
          <span className="tree-node">
            {child.children.length > 0 ? '📁' : '📂'} {child.name}
            <span className="tree-count">{child.count}</span>
          </span>
          {child.children.length > 0 && <CategoryTree node={child} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default function InsightsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [topPlayed, setTopPlayed] = useState<TopPlayed[]>([]);
  const [recent, setRecent] = useState<RecentVideo[]>([]);
  const [plays, setPlays] = useState<PlaysOverTime[]>([]);
  const [categories, setCategories] = useState<CategoryNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchSummary(),
      fetchTopPlayed(10),
      fetchRecent(8),
      fetchPlaysOverTime(30),
      fetchCategories()
    ])
      .then(([s, t, r, p, c]) => {
        setSummary(s);
        setTopPlayed(t);
        setRecent(r);
        setPlays(p);
        setCategories(c);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!summary) return <div className="empty-state">Loading insights…</div>;

  return (
    <div className="insights-page">
      <h1>Library Insights</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">{summary.total_videos}</span>
          <span className="stat-label">Videos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.total_categories}</span>
          <span className="stat-label">Categories</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatBytes(Number(summary.total_size_bytes))}</span>
          <span className="stat-label">Total size</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatDuration(summary.total_duration_seconds)}</span>
          <span className="stat-label">Total duration</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.total_plays}</span>
          <span className="stat-label">Plays</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.total_downloads}</span>
          <span className="stat-label">Downloads</span>
        </div>
      </div>

      <div className="insights-grid">
        <section className="panel">
          <h2>Most played</h2>
          {topPlayed.length === 0 ? (
            <div className="empty-state small">No plays registered yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topPlayed} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                <XAxis type="number" allowDecimals={false} stroke="#8b93a7" />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={160}
                  stroke="#8b93a7"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1f2a', border: '1px solid #2a2f3a' }}
                />
                <Bar dataKey="play_count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel">
          <h2>Plays — last 30 days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={plays} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="day" stroke="#8b93a7" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#8b93a7" />
              <Tooltip contentStyle={{ background: '#1a1f2a', border: '1px solid #2a2f3a' }} />
              <Line type="monotone" dataKey="plays" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Category tree</h2>
          {categories && categories.children.length > 0 ? (
            <CategoryTree node={categories} />
          ) : (
            <div className="empty-state small">No categories yet.</div>
          )}
        </section>

        <section className="panel">
          <h2>Recently added</h2>
          <ul className="recent-list">
            {recent.map((v) => (
              <li key={v.id}>
                <span className="recent-title">{v.title}</span>
                <span className="recent-meta">
                  {v.category_path || 'Uncategorized'} · {formatBytes(Number(v.size_bytes))} ·{' '}
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {recent.length === 0 && <li className="empty-state small">Library is empty.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
