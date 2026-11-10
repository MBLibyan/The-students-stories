import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Moon, Sun, GraduationCap, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Navbar({ canInstallPwa, onInstallPwa }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/teacher');

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="brand-link" aria-label="Home - Storybook Flipbook">
          <span className="brand-icon">
            <BookOpen size={22} />
          </span>
          <span className="brand-text">
            <strong>Storybook Flipbook</strong>
            <small>Interactive Reading Library — English Department</small>
          </span>
        </Link>

        <nav className="nav-actions" aria-label="Main navigation">
          {!isSupabaseConfigured && (
            <span
              className="demo-pill"
              title="Running with sample demo data because Supabase keys are not configured yet"
            >
              Demo Mode
            </span>
          )}

          {canInstallPwa && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onInstallPwa}
              title="Install app on your device"
            >
              <Download size={17} />
              <span className="hide-xs">Install App</span>
            </button>
          )}

          <Link
            to="/"
            className={`btn btn-sm ${!isAdmin ? 'btn-soft' : 'btn-ghost'}`}
          >
            Library
          </Link>

          <Link
            to="/admin"
            className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-outline'}`}
          >
            <GraduationCap size={17} />
            <span>Teacher Portal</span>
          </Link>

          <button
            type="button"
            className="btn-icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
