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
      onNotify?.('Story link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      onNotify?.(err.message || 'Could not copy the link.', 'error');
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
        onNotify?.('Native share dialog could not open. You can copy the link instead.', 'error');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="share-modal-title">Share Story with Students</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          Students can open this link directly to read, listen, and complete the Quick Check quiz with no login required:
        </p>

        <div className="share-book-title">
          {book.title}
        </div>

        <div className="share-url-row">
          <input
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Story link"
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
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
            <span>Share on WhatsApp</span>
          </a>

          {supportsNativeShare && (
            <button type="button" className="btn btn-outline" onClick={handleNativeShare}>
              <Share2 size={18} />
              <span>Share via Apps</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
