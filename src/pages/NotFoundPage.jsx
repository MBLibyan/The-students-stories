import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="page-container container">
      <div className="state-panel">
        <BookOpen size={40} />
        <h1>Page Not Found</h1>
        <p className="muted">The page you are looking for does not exist or may have been moved.</p>
        <Link to="/" className="btn btn-primary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>
      </div>
    </main>
  );
}
