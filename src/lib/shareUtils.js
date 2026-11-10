export function getBookShareUrl(bookId) {
  if (typeof window === 'undefined') return `/book/${bookId}`;
  return `${window.location.origin}/book/${bookId}`;
}

export function getWhatsAppShareUrl({ title, url }) {
  const message = `اقرأ واستمع إلى قصة "${title}" التفاعلية مع اختبار الفهم على Storybook Flipbook:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('تعذر نسخ الرابط تلقائياً.');
  return true;
}

export async function shareBookNative({ title, description, url }) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  await navigator.share({
    title: title || 'Storybook Flipbook',
    text: description || `اقرأ قصة "${title}" على Storybook Flipbook`,
    url,
  });
  return true;
}
