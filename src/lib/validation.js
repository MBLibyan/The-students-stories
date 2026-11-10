const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validatePdfFile(file) {
  if (!file) return { valid: false, error: 'Please choose a PDF file for the story.' };
  const name = (file.name || '').toLowerCase();
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExt = name.endsWith('.pdf');
  if (!isPdfMime && !isPdfExt) {
    return { valid: false, error: 'The selected file must be a valid PDF.' };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { valid: false, error: 'PDF file size exceeds the 50 MB limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected PDF file is empty or corrupted.' };
  }
  return { valid: true, error: null };
}

export function validateAudioFile(file) {
  if (!file) return { valid: true, error: null }; // optional
  const name = (file.name || '').toLowerCase();
  const validExt = /\.(mp3|m4a|wav|ogg|aac|mp4|webm)$/.test(name);
  const validMime = (file.type || '').startsWith('audio/') || file.type === 'video/mp4';
  if (!validExt && !validMime) {
    return { valid: false, error: 'Please select a valid audio file (MP3, M4A, or WAV).' };
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { valid: false, error: 'Audio file size exceeds the 50 MB limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected audio file is empty.' };
  }
  return { valid: true, error: null };
}

export function validateImageFile(file, label = 'Image') {
  if (!file) return { valid: true, error: null }; // optional
  const name = (file.name || '').toLowerCase();
  const validExt = /\.(jpg|jpeg|png|webp|gif)$/.test(name);
  const validMime = (file.type || '').startsWith('image/');
  if (!validExt && !validMime) {
    return { valid: false, error: `${label} must be a valid image file (PNG, JPG, or WebP).` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: `${label} size exceeds the 10 MB limit.` };
  }
  return { valid: true, error: null };
}

export function validateQuestion(q, index = 0) {
  const num = index + 1;
  if (!q || typeof q !== 'object') {
    return { valid: false, error: `Question ${num} data is invalid.` };
  }
  if (!['multiple_choice', 'inference'].includes(q.type)) {
    return { valid: false, error: `Question ${num} type is invalid.` };
  }
  if (!q.question || !q.question.trim()) {
    return { valid: false, error: `Please enter the text for question ${num}.` };
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { valid: false, error: `Question ${num} must have exactly 4 options.` };
  }
  const emptyIdx = q.options.findIndex((opt) => !opt || !String(opt).trim());
  if (emptyIdx !== -1) {
    return {
      valid: false,
      error: `Please fill in option ${emptyIdx + 1} for question ${num}.`,
    };
  }
  const correctIdx = Number(q.correct_index);
  if (!Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx > 3) {
    return { valid: false, error: `Please select the correct answer for question ${num}.` };
  }
  return { valid: true, error: null };
}

export function normalizeQuestionPositions(questions) {
  return questions.map((q, idx) => ({
    ...q,
    position: idx,
  }));
}

export function moveQuestion(questions, index, direction) {
  const target = index + direction;
  if (index < 0 || index >= questions.length || target < 0 || target >= questions.length) {
    return questions;
  }
  const next = [...questions];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return normalizeQuestionPositions(next);
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
