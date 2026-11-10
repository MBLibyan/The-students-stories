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
      setError(err.message || 'تعذر تحميل قائمة القصص.');
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
            <span>قسم اللغة الإنجليزية — القراءة التفاعلية</span>
          </div>
          <h1>قصص إنجليزية تفاعلية بتجربة كتاب حقيقي</h1>
          <p>
            اقرأ القصص الأدبية بتقليب صفحات واقعي، استمع إلى التسجيل الصوتي مع التحكم بالسرعة،
            واختبر فهمك واستنتاجك عبر أسئلة سريعة فورية التصحيح في نهاية كل قصة.
          </p>
          <div className="hero-actions">
            {books[0] && (
              <Link to={`/book/${books[0].id}`} className="btn btn-primary">
                <BookOpen size={18} />
                <span>ابدأ قراءة أحدث قصة</span>
              </Link>
            )}
            <Link to="/admin" className="btn btn-outline">
              <GraduationCap size={18} />
              <span>دخول المعلم وإدارة القصص</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-book-mockup">
            <div className="mockup-spine" />
            <div className="mockup-cover" dir="ltr" lang="en">
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
            <strong>وضع المعاينة التجريبية نشط حالياً</strong>
            <p>
              يتم عرض قصة تجريبية كاملة لتجربة تقليب الصفحات والصوت والاختبار مباشرة.
              لربط قاعدة بياناتك الفعلية، أضف متغيرات <code>VITE_SUPABASE_URL</code> و
              <code>VITE_SUPABASE_ANON_KEY</code> في إعدادات البيئة.
            </p>
          </div>
        </div>
      )}

      {/* Library Shelf */}
      <section className="library-section">
        <div className="section-header">
          <div>
            <h2>القصص المتاحة للطلبة</h2>
            <p className="muted">اختر أي قصة لفتحها مباشرة دون الحاجة لتسجيل الدخول.</p>
          </div>
          <span className="count-badge">{books.length} قصة</span>
        </div>

        {loading && (
          <div className="state-panel">
            <Loader2 size={28} className="spin" />
            <p>جاري تحميل القصص المتاحة...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-panel error" role="alert">
            <AlertCircle size={28} />
            <p>{error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadBooks}>
              <RotateCcw size={16} />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="state-panel">
            <BookOpen size={32} />
            <p>لا توجد قصص منشورة بعد.</p>
            <Link to="/admin" className="btn btn-primary btn-sm">
              إضافة أول قصة من لوحة المعلم
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
                      <div className="book-cover-placeholder" dir="ltr" lang="en">
                        <span>STORYBOOK</span>
                        <strong>{book.title}</strong>
                      </div>
                    )}
                  </Link>

                  <div className="book-card-body">
                    <h3 dir="ltr" lang="en">
                      <Link to={`/book/${book.id}`}>{book.title}</Link>
                    </h3>

                    {book.description && (
                      <p className="book-card-desc" dir="ltr" lang="en">
                        {book.description}
                      </p>
                    )}

                    <div className="book-card-meta">
                      {book.audio_url && (
                        <span className="meta-chip">
                          <Headphones size={14} />
                          <span>ملف صوتي</span>
                        </span>
                      )}
                      <span className="meta-chip">
                        <HelpCircle size={14} />
                        <span>{qCount} سؤال تفاعلي</span>
                      </span>
                    </div>

                    <Link to={`/book/${book.id}`} className="btn btn-primary btn-block">
                      <BookOpen size={17} />
                      <span>فتح الكتاب التفاعلي</span>
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
