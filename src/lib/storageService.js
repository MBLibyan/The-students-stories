import { supabase, isSupabaseConfigured, translateSupabaseError } from './supabase';

export const BUCKETS = {
  pdfs: 'story-pdfs',
  audio: 'story-audio',
  covers: 'story-covers',
};

function sanitizeFileName(name) {
  const parts = String(name || 'file').split('.');
  const ext = parts.length > 1 ? '.' + parts.pop().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
  const base = parts
    .join('.')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) || 'asset';
  return `${base}${ext}`;
}

export async function uploadBookAsset({ bucket, userId, bookId, file, prefix }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase connection is not configured yet.');
  }

  const cleanName = sanitizeFileName(file.name);
  const objectPath = `${userId}/${bookId}/${prefix}-${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(translateSupabaseError(uploadError));
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error('File uploaded, but failed to retrieve the public URL.');
  }

  return data.publicUrl;
}

export function extractBucketAndPath(publicUrl) {
  if (!publicUrl) return null;
  try {
    const parsed = new URL(publicUrl);
    const marker = '/storage/v1/object/public/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const remainder = parsed.pathname.slice(idx + marker.length);
    const slashIdx = remainder.indexOf('/');
    if (slashIdx === -1) return null;
    return {
      bucket: remainder.slice(0, slashIdx),
      path: decodeURIComponent(remainder.slice(slashIdx + 1)),
    };
  } catch {
    return null;
  }
}

export async function deleteStorageFileByUrl(publicUrl) {
  if (!isSupabaseConfigured || !supabase || !publicUrl) return;
  const parsed = extractBucketAndPath(publicUrl);
  if (!parsed) return;
  await supabase.storage.from(parsed.bucket).remove([parsed.path]);
}

export async function triggerFileDownload(url, fallbackFilename = 'storybook-file') {
  if (!url) return;

  const isAndroidWebView =
    typeof navigator !== 'undefined' && /;\s*wv\)/.test(navigator.userAgent || '');

  if (isAndroidWebView && /^https?:\/\//i.test(url)) {
    const downloadUrl = url.includes('?')
      ? `${url}&download=${encodeURIComponent(fallbackFilename)}`
      : `${url}?download=${encodeURIComponent(fallbackFilename)}`;
    window.location.assign(downloadUrl);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    // Fallback for restricted CORS
    const downloadUrl = url.includes('?')
      ? `${url}&download=${encodeURIComponent(fallbackFilename)}`
      : `${url}?download=${encodeURIComponent(fallbackFilename)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fallbackFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
