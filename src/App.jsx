import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import TeacherPage from './pages/TeacherPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [toast, setToast] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      notify('تم تثبيت تطبيق Storybook Flipbook على جهازك!', 'success');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const notify = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar
              canInstallPwa={Boolean(deferredPrompt)}
              onInstallPwa={handleInstallPwa}
            />

            <PwaInstallPrompt
              deferredPrompt={deferredPrompt}
              onInstall={handleInstallPwa}
              onDismiss={() => setDeferredPrompt(null)}
            />

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/book/:id" element={<BookPage onNotify={notify} />} />
              <Route path="/admin" element={<TeacherPage onNotify={notify} />} />
              <Route path="/teacher" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <footer className="app-footer">
              <div className="container footer-inner">
                <span>Storybook Flipbook — منصة القصص التفاعلية لقسم اللغة الإنجليزية</span>
                <span className="muted">يعمل كتطبيق ويب تقدمي (PWA) ويدعم القراءة بدون تسجيل</span>
              </div>
            </footer>

            <Toast toast={toast} onDismiss={() => setToast(null)} />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
