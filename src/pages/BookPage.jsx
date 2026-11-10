import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  Share2,
  Headphones,
  FileDown,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { getBookWithQuestions } from '../lib/bookService';
import { triggerFileDownload } from '../lib/storageService';
import AudioPlayerBar from '../components/AudioPlayerBar';
import FlipbookViewer from '../components/FlipbookViewer';
import ShareModal from '../components/ShareModal';

function makeSafeFilename(title, ext) {
  const clean = String(title || 'storybook')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${clean || 'storybook'}.${ext}`;
}

export default function BookPage({ onNotify }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [downloading, setDownloading] = useState('');

  const loadBook = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBookWithQuestions(id);
      setBook(data);
    } catch (err) {
      setError(err.message || 'تعذر العثور على القصة المطلوبة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBook();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!book?.pdf_url) return;
    setDownloading('pdf');
    try {
      await triggerFileDownload(book.pdf_url, makeSafeFilename(book.title, 'pdf'));
      onNotify?.('بدأ تحميل ملف القصة PDF.', 'success');
    } catch {
      onNotify?.('تعذر تحميل ملف PDF.', 'error');
    } finally {
      setDownloading('');
    }
  };

  const handleDownloadAudio = async () => {
    if (!book?.audio_url) return;
    setDownloading('audio');
    try {
      const extMatch = book.audio_url.match(/\.(mp3|m4a|wav|ogg|aac)(\?|$)/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'mp3';
      await triggerFileDownload(book.audio_url, makeSafeFilename(book.title, ext));
      onNotify?.('بدأ تحميل الملف الصوتي.', 'success');
    } catch {
      onNotify?.('تعذر تحميل الملف الصوتي.', 'error');
    } finally {
      setDownloading('');
    }
  };

  if (loading) {
    return (
      <main className="page-container container">
        <div className="state-panel">
          <Loader2 size={32} className="spin" />
          <p>جاري تحميل القصة وبيانات الاختبار...</p>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="page-container container">
        <div className="state-panel error" role="alert">
          <AlertCircle size={36} />
          <h2>تعذر فتح القصة</h2>
          <p>{error || 'الرابط غير صحيح أو تم حذف هذه القصة.'}</p>
          <div className="state-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={loadBook}>
              <RotateCcw size={16} />
              <span>إعادة المحاولة</span>
            </button>
            <Link to="/" className="btn btn-outline btn-sm">
              <ArrowRight size={16} />
              <span>العودة للمكتبة</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container container book-viewer-page">
      {/* Book Info & Action Bar */}
      <div className="viewer-header-card">
        <div className="viewer-header-info">
          <Link to="/" className="back-link">
            <ArrowRight size={16} />
            <span>العودة إلى المكتبة</span>
          </Link>
          <h1 dir="ltr" lang="en">
            {book.title}
          </h1>
          {book.description && (
            <p className="viewer-desc" dir="ltr" lang="en">
              {book.description}
            </p>
          )}
        </div>

        <div className="viewer-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleDownloadPdf}
            disabled={downloading === 'pdf'}
          >
            {downloading === 'pdf' ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <FileDown size={16} />
            )}
            <span>تحميل القصة (PDF)</span>
          </button>

          {book.audio_url && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDownloadAudio}
              disabled={downloading === 'audio'}
            >
              {downloading === 'audio' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Headphones size={16} />
              )}
              <span>تحميل الصوت</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={16} />
            <span>مشاركة</span>
          </button>
        </div>
      </div>

      {/* Audio Bar */}
      <AudioPlayerBar audioUrl={book.audio_url} title={book.title} />

      {/* Interactive Flipbook */}
      <FlipbookViewer book={book} />

      {shareOpen && (
        <ShareModal
          book={book}
          onClose={() => setShareOpen(false)}
          onNotify={onNotify}
        />
      )}
    </main>
  );
}
