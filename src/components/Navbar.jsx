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
        <Link to="/" className="brand-link" aria-label="الرئيسية - Storybook Flipbook">
          <span className="brand-icon">
            <BookOpen size={22} />
          </span>
          <span className="brand-text">
            <strong>Storybook Flipbook</strong>
            <small>مكتبة القصص التفاعلية — قسم اللغة الإنجليزية</small>
          </span>
        </Link>

        <nav className="nav-actions" aria-label="التنقل الرئيسي">
          {!isSupabaseConfigured && (
            <span className="demo-pill" title="يعمل التطبيق حالياً ببيانات تجريبية لعدم ضبط مفاتيح Supabase">
              وضع تجريبي
            </span>
          )}

          {canInstallPwa && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onInstallPwa}
              title="تثبيت التطبيق على الجهاز"
            >
              <Download size={17} />
              <span className="hide-xs">تثبيت التطبيق</span>
            </button>
          )}

          <Link
            to="/"
            className={`btn btn-sm ${!isAdmin ? 'btn-soft' : 'btn-ghost'}`}
          >
            المكتبة
          </Link>

          <Link
            to="/admin"
            className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-outline'}`}
          >
            <GraduationCap size={17} />
            <span>لوحة المعلم</span>
          </Link>

          <button
            type="button"
            className="btn-icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
