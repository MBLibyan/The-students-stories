export function getBookShareUrl(bookId) {
  if (typeof window === 'undefined') return `/book/${bookId}`;
  return `${window.location.origin}/book/${bookId}`;
}

export function getWhatsAppShareUrl({ title, url }) {
  const message = `Read and listen to "${title}" with the Quick Check quiz on Storybook Flipbook:\n${url}`;
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
  if (!ok) throw new Error('Could not copy the link automatically.');
  return true;
}

export async function shareBookNative({ title, description, url }) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  await navigator.share({
    title: title || 'Storybook Flipbook',
    text: description || `Read "${title}" on Storybook Flipbook`,
    url,
  });
  return true;
}
