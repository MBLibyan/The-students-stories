import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react';
import {
  getBookShareUrl,
  getWhatsAppShareUrl,
  copyToClipboard,
  shareBookNative,
} from '../lib/shareUtils';

export default function ShareModal({ book, onClose, onNotify }) {
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const shareUrl = getBookShareUrl(book.id);
  const whatsappUrl = getWhatsAppShareUrl({ title: book.title, url: shareUrl });
  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);
      setCopied(true);
      onNotify?.('تم نسخ رابط القصة بنجاح!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      onNotify?.(err.message || 'تعذر نسخ الرابط.', 'error');
    }
  };

  const handleNativeShare = async () => {
    try {
      await shareBookNative({
        title: book.title,
        description: book.description,
        url: shareUrl,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        onNotify?.('تعذر فتح نافذة المشاركة الأصلية، يمكنك نسخ الرابط مباشرة.', 'error');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="share-modal-title">مشاركة القصة مع الطلبة</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          يمكن للطلبة فتح الرابط مباشرة وقراءة القصة وحل الاختبار دون تسجيل دخول:
        </p>

        <div className="share-book-title" dir="ltr" lang="en">
          {book.title}
        </div>

        <div className="share-url-row">
          <input
            type="text"
            readOnly
            value={shareUrl}
            dir="ltr"
            aria-label="رابط القصة"
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>

        <div className="share-actions-grid">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            <MessageCircle size={18} />
            <span>مشاركة عبر واتساب</span>
          </a>

          {supportsNativeShare && (
            <button type="button" className="btn btn-outline" onClick={handleNativeShare}>
              <Share2 size={18} />
              <span>مشاركة عبر التطبيقات</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
