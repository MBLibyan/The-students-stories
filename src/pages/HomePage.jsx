import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Headphones,
  HelpCircle,
  Sparkles,
  GraduationCap,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { listPublicBooks } from '../lib/bookService';
import { isSupabaseConfigured } from '../lib/supabase';

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPublicBooks();
      setBooks(data);
    } catch (err) {
      setError(err.message || 'Unable to load the story library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <main className="page-container container">
      {/* Hero Section */}
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={15} />
            <span>English Department — Interactive Literature</span>
          </div>
          <h1>Interactive English Stories with Realistic Page-Flipping</h1>
          <p>
            Read literary short stories with realistic page turns, listen to synchronized
            audio narration with variable playback speed, and test your comprehension and
            inference skills with an instant Quick Check quiz at the end of each book.
          </p>
          <div className="hero-actions">
            {books[0] && (
              <Link to={`/book/${books[0].id}`} className="btn btn-primary">
                <BookOpen size={18} />
                <span>Read Latest Story</span>
              </Link>
            )}
            <Link to="/admin" className="btn btn-outline">
              <GraduationCap size={18} />
              <span>Teacher Portal</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-book-mockup">
            <div className="mockup-spine" />
            <div className="mockup-cover">
              <span>ENGLISH LITERATURE</span>
              <strong>Storybook Flipbook</strong>
              <small>Read • Listen • Quick Check</small>
            </div>
          </div>
        </div>
      </section>

      {!isSupabaseConfigured && (
        <div className="notice-banner" role="note">
          <div>
            <strong>Demo Mode is currently active</strong>
            <p>
              A full sample story is loaded so you can try page-flipping, audio speed controls,
              and the Quick Check quiz right away. Connect your Supabase database by setting{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* Library Shelf */}
      <section className="library-section">
        <div className="section-header">
          <div>
            <h2>Available Student Stories</h2>
            <p className="muted">Select any book to open and read immediately with no sign-in required.</p>
          </div>
          <span className="count-badge">
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </span>
        </div>

        {loading && (
          <div className="state-panel">
            <Loader2 size={28} className="spin" />
            <p>Loading available stories...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-panel error" role="alert">
            <AlertCircle size={28} />
            <p>{error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadBooks}>
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="state-panel">
            <BookOpen size={32} />
            <p>No stories have been published yet.</p>
            <Link to="/admin" className="btn btn-primary btn-sm">
              Publish Your First Story in Teacher Portal
            </Link>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="books-grid">
            {books.map((book) => {
              const qCount = book.questionCount ?? book.questions?.length ?? 0;
              return (
                <article key={book.id} className="book-card">
                  <Link to={`/book/${book.id}`} className="book-cover-thumb">
                    {book.cover_front_url ? (
                      <img src={book.cover_front_url} alt={book.title} loading="lazy" />
                    ) : (
                      <div className="book-cover-placeholder">
                        <span>STORYBOOK</span>
                        <strong>{book.title}</strong>
                      </div>
                    )}
                  </Link>

                  <div className="book-card-body">
                    <h3>
                      <Link to={`/book/${book.id}`}>{book.title}</Link>
                    </h3>

                    {book.description && (
                      <p className="book-card-desc">{book.description}</p>
                    )}

                    <div className="book-card-meta">
                      {book.audio_url && (
                        <span className="meta-chip">
                          <Headphones size={14} />
                          <span>Audio Included</span>
                        </span>
                      )}
                      <span className="meta-chip">
                        <HelpCircle size={14} />
                        <span>{qCount} {qCount === 1 ? 'Question' : 'Questions'}</span>
                      </span>
                    </div>

                    <Link to={`/book/${book.id}`} className="btn btn-primary btn-block">
                      <BookOpen size={17} />
                      <span>Open Flipbook</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
