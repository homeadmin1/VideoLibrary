import { useEffect, useState } from 'react';
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams
} from 'react-router-dom';
import { fetchCategories } from './api';
import type { CategoryNode } from './types';
import CategorySidebar from './components/CategorySidebar';
import TagCloud from './components/TagCloud';
import LibraryPage from './pages/LibraryPage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';
import InsightsPage from './pages/InsightsPage';

export default function App() {
  const [categories, setCategories] = useState<CategoryNode | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedTag = searchParams.get('tag') ?? '';

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories(null));
  }, []);

  const handleCategorySelect = (path: string) => {
    navigate(path ? `/?category=${encodeURIComponent(path)}` : '/');
  };

  const handleTagSelect = (tag: string) => {
    navigate(tag ? `/?tag=${encodeURIComponent(tag)}` : '/');
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <aside className="app-sidebar">
          <div className="brand">
            <span className="brand-icon">▶</span>
            <div className="brand-text">
              <span className="brand-name">Video Library</span>
              <span className="brand-sub">My collection</span>
            </div>
          </div>

          <nav className="side-section">
            <h3 className="side-title">Library</h3>
            <NavLink to="/" end className="side-link">
              <span className="side-icon">🎞</span> Videos
            </NavLink>
            <NavLink to="/favorites" className="side-link">
              <span className="side-icon">♡</span> Favorites
            </NavLink>
          </nav>

          <div className="side-section">
            <h3 className="side-title">Folders</h3>
            <CategorySidebar
              categories={categories}
              selectedPath={selectedCategory}
              onSelect={handleCategorySelect}
              totalVideos={categories?.count ?? 0}
            />
          </div>

          <nav className="side-section">
            <h3 className="side-title">Manage</h3>
            <NavLink to="/admin" end className="side-link">
              <span className="side-icon">⚙</span> Administration
            </NavLink>
            <NavLink to="/admin/insights" className="side-link">
              <span className="side-icon">📊</span> Insights
            </NavLink>
          </nav>

          <div className="side-section">
            <h3 className="side-title">Tags</h3>
            <TagCloud selectedTag={selectedTag} onSelect={handleTagSelect} />
          </div>
        </aside>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/insights" element={<InsightsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
