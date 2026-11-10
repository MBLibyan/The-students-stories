import { supabase, isSupabaseConfigured, translateSupabaseError } from './supabase';
import { DEMO_BOOKS } from './demoData';
import { BUCKETS, uploadBookAsset, deleteStorageFileByUrl } from './storageService';
import { normalizeQuestionPositions } from './validation';

const DEMO_STORAGE_KEY = 'storybook-demo-books-v1';

function readDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return DEMO_BOOKS;
}

function writeDemoStore(books) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(books));
  } catch {
    // ignore quota errors if user adds large files in demo mode
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read the local file.'));
    reader.readAsDataURL(file);
  });
}

export async function listPublicBooks() {
  if (!isSupabaseConfigured || !supabase) {
    return readDemoStore();
  }

  const { data, error } = await supabase
    .from('books')
    .select('*, questions(id)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  return (data || []).map((b) => ({
    ...b,
    questionCount: Array.isArray(b.questions) ? b.questions.length : 0,
  }));
}

export async function listTeacherBooks(ownerId) {
  if (!isSupabaseConfigured || !supabase) {
    return readDemoStore().map((b) => ({
      ...b,
      questionCount: Array.isArray(b.questions) ? b.questions.length : 0,
    }));
  }

  const { data, error } = await supabase
    .from('books')
    .select('*, questions(*)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  return (data || []).map((book) => ({
    ...book,
    questions: Array.isArray(book.questions)
      ? [...book.questions].sort((a, b) => a.position - b.position)
      : [],
  }));
}

export async function getBookWithQuestions(bookId) {
  if (!isSupabaseConfigured || !supabase) {
    const found = readDemoStore().find((b) => b.id === bookId);
    if (!found) {
      throw new Error('This story could not be found.');
    }
    return {
      ...found,
      questions: [...(found.questions || [])].sort((a, b) => a.position - b.position),
    };
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    throw new Error(bookError ? translateSupabaseError(bookError) : 'This story could not be found.');
  }

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('*')
    .eq('book_id', bookId)
    .order('position', { ascending: true });

  if (qError) {
    throw new Error(translateSupabaseError(qError));
  }

  return {
    ...book,
    questions: questions || [],
  };
}

export async function saveBookWithQuestions({
  editingBook = null,
  ownerId,
  title,
  description,
  pdfFile,
  audioFile,
  removeAudio = false,
  frontCoverFile,
  removeFrontCover = false,
  backCoverFile,
  removeBackCover = false,
  questions,
  onProgress,
}) {
  const orderedQuestions = normalizeQuestionPositions(questions);

  // Demo Mode local fallback
  if (!isSupabaseConfigured || !supabase) {
    onProgress?.('Preparing book in Demo Mode...');
    const id = editingBook?.id || `demo-${Date.now()}`;
    const pdfUrl = pdfFile ? await fileToDataUrl(pdfFile) : editingBook?.pdf_url;
    const audioUrl = removeAudio
      ? null
      : audioFile
      ? await fileToDataUrl(audioFile)
      : editingBook?.audio_url || null;
    const frontUrl = removeFrontCover
      ? null
      : frontCoverFile
      ? await fileToDataUrl(frontCoverFile)
      : editingBook?.cover_front_url || null;
    const backUrl = removeBackCover
      ? null
      : backCoverFile
      ? await fileToDataUrl(backCoverFile)
      : editingBook?.cover_back_url || null;

    const saved = {
      id,
      owner_id: ownerId || 'demo-teacher',
      title: title.trim(),
      description: description.trim(),
      pdf_url: pdfUrl,
      audio_url: audioUrl,
      cover_front_url: frontUrl,
      cover_back_url: backUrl,
      created_at: editingBook?.created_at || new Date().toISOString(),
      questions: orderedQuestions.map((q, idx) => ({
        id: q.id || `${id}-q-${idx}-${Date.now()}`,
        book_id: id,
        type: q.type,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correct_index: Number(q.correct_index),
        explanation: (q.explanation || '').trim(),
        position: idx,
      })),
    };

    const existing = readDemoStore();
    const updated = editingBook
      ? existing.map((b) => (b.id === id ? saved : b))
      : [saved, ...existing];
    writeDemoStore(updated);
    return saved;
  }

  const bookId = editingBook?.id || crypto.randomUUID();
  let pdfUrl = editingBook?.pdf_url || '';
  let audioUrl = removeAudio ? null : editingBook?.audio_url || null;
  let frontCoverUrl = removeFrontCover ? null : editingBook?.cover_front_url || null;
  let backCoverUrl = removeBackCover ? null : editingBook?.cover_back_url || null;

  // Upload assets cleanly to Supabase Storage
  if (pdfFile) {
    onProgress?.('Uploading story PDF to storage...');
    const newPdfUrl = await uploadBookAsset({
      bucket: BUCKETS.pdfs,
      userId: ownerId,
      bookId,
      file: pdfFile,
      prefix: 'story',
    });
    if (editingBook?.pdf_url) await deleteStorageFileByUrl(editingBook.pdf_url);
    pdfUrl = newPdfUrl;
  }

  if (audioFile) {
    onProgress?.('Uploading audio narration...');
    const newAudioUrl = await uploadBookAsset({
      bucket: BUCKETS.audio,
      userId: ownerId,
      bookId,
      file: audioFile,
      prefix: 'audio',
    });
    if (editingBook?.audio_url) await deleteStorageFileByUrl(editingBook.audio_url);
    audioUrl = newAudioUrl;
  } else if (removeAudio && editingBook?.audio_url) {
    await deleteStorageFileByUrl(editingBook.audio_url);
  }

  if (frontCoverFile) {
    onProgress?.('Uploading front cover image...');
    const newFrontUrl = await uploadBookAsset({
      bucket: BUCKETS.covers,
      userId: ownerId,
      bookId,
      file: frontCoverFile,
      prefix: 'front',
    });
    if (editingBook?.cover_front_url) await deleteStorageFileByUrl(editingBook.cover_front_url);
    frontCoverUrl = newFrontUrl;
  } else if (removeFrontCover && editingBook?.cover_front_url) {
    await deleteStorageFileByUrl(editingBook.cover_front_url);
  }

  if (backCoverFile) {
    onProgress?.('Uploading back cover image...');
    const newBackUrl = await uploadBookAsset({
      bucket: BUCKETS.covers,
      userId: ownerId,
      bookId,
      file: backCoverFile,
      prefix: 'back',
    });
    if (editingBook?.cover_back_url) await deleteStorageFileByUrl(editingBook.cover_back_url);
    backCoverUrl = newBackUrl;
  } else if (removeBackCover && editingBook?.cover_back_url) {
    await deleteStorageFileByUrl(editingBook.cover_back_url);
  }

  onProgress?.('Saving book metadata to database...');

  const bookPayload = {
    id: bookId,
    owner_id: ownerId,
    title: title.trim(),
    description: description.trim(),
    pdf_url: pdfUrl,
    audio_url: audioUrl,
    cover_front_url: frontCoverUrl,
    cover_back_url: backCoverUrl,
  };

  let savedBook;
  if (editingBook) {
    const { data, error } = await supabase
      .from('books')
      .update({
        title: bookPayload.title,
        description: bookPayload.description,
        pdf_url: bookPayload.pdf_url,
        audio_url: bookPayload.audio_url,
        cover_front_url: bookPayload.cover_front_url,
        cover_back_url: bookPayload.cover_back_url,
      })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw new Error(translateSupabaseError(error));
    savedBook = data;

    // Replace existing questions cleanly to keep ordering deterministic
    const { error: deleteQErr } = await supabase
      .from('questions')
      .delete()
      .eq('book_id', bookId);

    if (deleteQErr) throw new Error(translateSupabaseError(deleteQErr));
  } else {
    const { data, error } = await supabase
      .from('books')
      .insert(bookPayload)
      .select()
      .single();

    if (error) throw new Error(translateSupabaseError(error));
    savedBook = data;
  }

  onProgress?.('Saving quiz questions...');

  let savedQuestions = [];
  if (orderedQuestions.length > 0) {
    const rows = orderedQuestions.map((q, idx) => ({
      book_id: bookId,
      type: q.type,
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correct_index: Number(q.correct_index),
      explanation: (q.explanation || '').trim(),
      position: idx,
    }));

    const { data: qData, error: qError } = await supabase
      .from('questions')
      .insert(rows)
      .select();

    if (qError) throw new Error(translateSupabaseError(qError));
    savedQuestions = (qData || []).sort((a, b) => a.position - b.position);
  }

  return {
    ...savedBook,
    questions: savedQuestions,
  };
}

export async function deleteTeacherBook(book) {
  if (!isSupabaseConfigured || !supabase) {
    const filtered = readDemoStore().filter((b) => b.id !== book.id);
    writeDemoStore(filtered);
    return;
  }

  const { error } = await supabase.from('books').delete().eq('id', book.id);
  if (error) throw new Error(translateSupabaseError(error));

  // Best-effort cleanup of stored media files
  await Promise.allSettled([
    deleteStorageFileByUrl(book.pdf_url),
    deleteStorageFileByUrl(book.audio_url),
    deleteStorageFileByUrl(book.cover_front_url),
    deleteStorageFileByUrl(book.cover_back_url),
  ]);
}
