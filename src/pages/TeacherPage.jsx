import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Music,
  Image as ImageIcon,
  PlusCircle,
  Save,
  LogOut,
  Eye,
  Download,
  Share2,
  Pencil,
  Trash2,
  Loader2,
  Lock,
  BookPlus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listTeacherBooks,
  saveBookWithQuestions,
  deleteTeacherBook,
} from '../lib/bookService';
import { triggerFileDownload } from '../lib/storageService';
import { inspectPdfFile } from '../lib/pdfUtils';
import {
  validatePdfFile,
  validateAudioFile,
  validateImageFile,
  validateQuestion,
} from '../lib/validation';
import {
  formatUserDisplayName,
  getAdminUsernameDomain,
  resolveAuthEmail,
} from '../lib/authUtils';
import QuestionBuilder from '../components/QuestionBuilder';
import ShareModal from '../components/ShareModal';

export default function TeacherPage({ onNotify }) {
  const { user, loading: authLoading, isDemoMode, signIn, signOut } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const usernameDomain = getAdminUsernameDomain();

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [shareBook, setShareBook] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  const formTopRef = useRef(null);
  const pdfInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const frontCoverInputRef = useRef(null);
  const backCoverInputRef = useRef(null);

  const [editingBook, setEditingBook] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);

  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [removeExistingAudio, setRemoveExistingAudio] = useState(false);

  const [frontCoverFile, setFrontCoverFile] = useState(null);
  const [frontCoverPreview, setFrontCoverPreview] = useState('');
  const [removeExistingFrontCover, setRemoveExistingFrontCover] = useState(false);

  const [backCoverFile, setBackCoverFile] = useState(null);
  const [backCoverPreview, setBackCoverPreview] = useState('');
  const [removeExistingBackCover, setRemoveExistingBackCover] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [lastCreatedBook, setLastCreatedBook] = useState(null);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(audioPreviewUrl);
      if (frontCoverPreview && frontCoverPreview.startsWith('blob:')) URL.revokeObjectURL(frontCoverPreview);
      if (backCoverPreview && backCoverPreview.startsWith('blob:')) URL.revokeObjectURL(backCoverPreview);
    };
  }, [audioPreviewUrl, frontCoverPreview, backCoverPreview]);

  const fetchBooks = async () => {
    if (!user) return;
    setBooksLoading(true);
    try {
      const data = await listTeacherBooks(user.id);
      setBooks(data);
    } catch (err) {
      onNotify?.(err.message || 'Failed to load your books.', 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setBooks([]);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!isDemoMode) {
      if (!username.trim() || !password) {
        setAuthError('Please enter your username and password.');
        return;
      }
      const resolved = resolveAuthEmail(username);
      if (!resolved.valid) {
        setAuthError(resolved.error);
        return;
      }
    }

    setAuthSubmitting(true);
    try {
      await signIn(username, password);
      onNotify?.('Signed in successfully!', 'success');
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      resetForm();
      onNotify?.('Signed out.', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Unable to sign out.', 'error');
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setTitle('');
    setDescription('');
    setPdfFile(null);
    setPdfInfo(null);
    setAudioFile(null);
    setAudioPreviewUrl('');
    setRemoveExistingAudio(false);
    setFrontCoverFile(null);
    setFrontCoverPreview('');
    setRemoveExistingFrontCover(false);
    setBackCoverFile(null);
    setBackCoverPreview('');
    setRemoveExistingBackCover(false);
    setQuestions([]);
    setFormError('');
    setProgressText('');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (frontCoverInputRef.current) frontCoverInputRef.current.value = '';
    if (backCoverInputRef.current) backCoverInputRef.current.value = '';
  };

  const handleSelectPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');

    const check = validatePdfFile(file);
    if (!check.valid) {
      setFormError(check.error);
      e.target.value = '';
      return;
    }

    try {
      setProgressText('Inspecting PDF pages...');
      const info = await inspectPdfFile(file);
      setPdfFile(file);
      setPdfInfo(info);
      setProgressText('');
    } catch {
      setFormError('Could not read the PDF file. Make sure it is not password-protected or corrupted.');
      setProgressText('');
      e.target.value = '';
    }
  };

  const handleSelectAudio = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');

    const check = validateAudioFile(file);
    if (!check.valid) {
      setFormError(check.error);
      e.target.value = '';
      return;
    }

    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setRemoveExistingAudio(false);
  };

  const handleSelectCover = (kind, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');

    const label = kind === 'front' ? 'Front Cover' : 'Back Cover';
    const check = validateImageFile(file, label);
    if (!check.valid) {
      setFormError(check.error);
      e.target.value = '';
      return;
    }

    const preview = URL.createObjectURL(file);
    if (kind === 'front') {
      setFrontCoverFile(file);
      setFrontCoverPreview(preview);
      setRemoveExistingFrontCover(false);
    } else {
      setBackCoverFile(file);
      setBackCoverPreview(preview);
      setRemoveExistingBackCover(false);
    }
  };

  const handleStartEdit = (book) => {
    resetForm();
    setEditingBook(book);
    setTitle(book.title || '');
    setDescription(book.description || '');
    setAudioPreviewUrl(book.audio_url || '');
    setFrontCoverPreview(book.cover_front_url || '');
    setBackCoverPreview(book.cover_back_url || '');
    setQuestions(
      (book.questions || []).map((q, idx) => ({
        id: q.id,
        type: q.type || 'multiple_choice',
        question: q.question || '',
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correct_index: Number(q.correct_index) || 0,
        explanation: q.explanation || '',
        position: idx,
      }))
    );
    setLastCreatedBook(null);
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}" and all its quiz questions? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(book.id);
    try {
      await deleteTeacherBook(book);
      if (editingBook?.id === book.id) resetForm();
      if (lastCreatedBook?.id === book.id) setLastCreatedBook(null);
      await fetchBooks();
      onNotify?.('Book deleted successfully.', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Unable to delete the book.', 'error');
    } finally {
      setDeletingId('');
    }
  };

  const handleSubmitBook = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a story title.');
      return;
    }
    if (!editingBook && !pdfFile) {
      setFormError('Please upload a story PDF file first.');
      return;
    }
    for (let i = 0; i < questions.length; i += 1) {
      const qCheck = validateQuestion(questions[i], i);
      if (!qCheck.valid) {
        setFormError(qCheck.error);
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await saveBookWithQuestions({
        editingBook,
        ownerId: user.id,
        title,
        description,
        pdfFile,
        audioFile,
        removeAudio: removeExistingAudio,
        frontCoverFile,
        removeFrontCover: removeExistingFrontCover,
        backCoverFile,
        removeBackCover: removeExistingBackCover,
        questions,
        onProgress: setProgressText,
      });

      setLastCreatedBook(saved);
      resetForm();
      await fetchBooks();
      onNotify?.(
        editingBook ? 'Interactive book updated successfully!' : 'Interactive book created and published!',
        'success'
      );
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the book.');
    } finally {
      setSaving(false);
      setProgressText('');
    }
  };

  if (authLoading) {
    return (
      <main className="page-container container">
        <div className="state-panel">
          <Loader2 size={30} className="spin" />
          <p>Checking teacher session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-container container auth-page">
        <section className="auth-card">
          <div className="auth-icon">
            <Lock size={26} />
          </div>
          <h1>Teacher Portal (Admin)</h1>
          <p className="muted">
            Sign in with your instructor account to upload story PDFs, narration audio, cover images, and Quick Check quiz questions.
          </p>

          <form onSubmit={handleLogin} className="auth-form">
            {!isDemoMode ? (
              <>
                <div className="field">
                  <label htmlFor="teacher-username">Username</label>
                  <input
                    id="teacher-username"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <small className="field-hint">
                    Enter your admin username (for example, <code>admin</code>).
                  </small>
                </div>

                <div className="field">
                  <label htmlFor="teacher-password">Password</label>
                  <input
                    id="teacher-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="notice-banner" role="note">
                <p>
                  The app is currently running in <strong>Demo Mode</strong> because Supabase keys are not set yet.
                  Click below to explore the Teacher Dashboard locally.
                </p>
              </div>
            )}

            {authError && (
              <div className="inline-alert error" role="alert">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={authSubmitting}
            >
              {authSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>
                  {isDemoMode ? 'Enter Demo Teacher Dashboard' : 'Sign In'}
                </span>
              )}
            </button>
          </form>

          {!isDemoMode && (
            <p className="auth-footnote">
              Teacher accounts are managed in Supabase Dashboard (Authentication → Users) as{' '}
              <code>&lt;username&gt;@{usernameDomain}</code>.
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="page-container container teacher-page">
      <div className="teacher-topbar">
        <div>
          <h1>Teacher Dashboard — Manage Interactive Stories</h1>
          <p className="muted">
            Signed in as: <span>{formatUserDisplayName(user)}</span>
          </p>
        </div>

        <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {lastCreatedBook && (
        <div className="success-callout" role="status">
          <div className="success-callout-info">
            <CheckCircle2 size={20} />
            <div>
              <strong>Book Ready: {lastCreatedBook.title}</strong>
              <p>PDF pages have been converted to an interactive flipbook and quiz questions are saved.</p>
            </div>
          </div>
          <div className="success-callout-actions">
            <Link to={`/book/${lastCreatedBook.id}`} className="btn btn-primary btn-sm">
              <Eye size={16} />
              <span>View Flipbook</span>
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShareBook(lastCreatedBook)}
            >
              <Share2 size={16} />
              <span>Share with Students</span>
            </button>
          </div>
        </div>
      )}

      <section ref={formTopRef} className="editor-card">
        <div className="editor-card-header">
          <h2>
            <BookPlus size={20} />
            <span>
              {editingBook ? `Edit Book: ${editingBook.title}` : 'Create New Interactive Book'}
            </span>
          </h2>
          {editingBook && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
              <X size={16} />
              <span>Cancel Edit & Create New</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitBook} className="teacher-form">
          <div className="form-two-cols">
            <div className="field">
              <label htmlFor="book-title">Story Title *</label>
              <input
                id="book-title"
                type="text"
                required
                placeholder="e.g., The Lantern on the Harbour Wall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="book-desc">Short Description</label>
              <input
                id="book-desc"
                type="text"
                placeholder="Short literary overview for English-department students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="uploads-grid">
            {/* 1. PDF Upload */}
            <div className="upload-box">
              <div className="upload-box-head">
                <FileText size={20} />
                <div>
                  <strong>Story PDF File {!editingBook && '*'}</strong>
                  <small>Max 50 MB — pages render lazily inside the flipbook</small>
                </div>
              </div>

              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                id="upload-pdf-input"
                onChange={handleSelectPdf}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => pdfInputRef.current?.click()}
              >
                <PlusCircle size={16} />
                <span>{pdfFile || editingBook?.pdf_url ? 'Change PDF' : 'Add PDF'}</span>
              </button>

              {pdfFile && (
                <div className="upload-meta">
                  <span>{pdfFile.name}</span>
                  {pdfInfo && (
                    <span className="meta-chip">
                      {pdfInfo.pageCount} {pdfInfo.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  )}
                </div>
              )}
              {!pdfFile && editingBook?.pdf_url && (
                <div className="upload-meta">
                  <span>Current PDF file is saved and ready.</span>
                </div>
              )}
            </div>

            {/* 2. Audio Upload */}
            <div className="upload-box">
              <div className="upload-box-head">
                <Music size={20} />
                <div>
                  <strong>Audio Narration (MP3 / M4A)</strong>
                  <small>Optional — enables the student audio player</small>
                </div>
              </div>

              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.m4a,.wav,.ogg,.aac,audio/*"
                className="sr-only"
                id="upload-audio-input"
                onChange={handleSelectAudio}
              />

              <div className="upload-btn-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Music size={16} />
                  <span>{audioFile || audioPreviewUrl ? 'Change Audio' : 'Upload Audio'}</span>
                </button>

                {(audioFile || audioPreviewUrl) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger-text"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioPreviewUrl('');
                      setRemoveExistingAudio(true);
                      if (audioInputRef.current) audioInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {audioFile && <div className="upload-meta">{audioFile.name}</div>}
              {audioPreviewUrl && (
                <audio controls src={audioPreviewUrl} className="upload-audio-preview" />
              )}
            </div>

            {/* 3. Front Cover */}
            <div className="upload-box">
              <div className="upload-box-head">
                <ImageIcon size={20} />
                <div>
                  <strong>Front Cover Image</strong>
                  <small>Optional — PNG or JPG</small>
                </div>
              </div>

              <input
                ref={frontCoverInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="upload-front-cover"
                onChange={(e) => handleSelectCover('front', e)}
              />

              <div className="upload-btn-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => frontCoverInputRef.current?.click()}
                >
                  <ImageIcon size={16} />
                  <span>{frontCoverPreview ? 'Change Front Cover' : 'Upload Front Cover'}</span>
                </button>

                {frontCoverPreview && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger-text"
                    onClick={() => {
                      setFrontCoverFile(null);
                      setFrontCoverPreview('');
                      setRemoveExistingFrontCover(true);
                      if (frontCoverInputRef.current) frontCoverInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {frontCoverPreview && (
                <img
                  src={frontCoverPreview}
                  alt="Front cover preview"
                  className="cover-preview-thumb"
                />
              )}
            </div>

            {/* 4. Back Cover */}
            <div className="upload-box">
              <div className="upload-box-head">
                <ImageIcon size={20} />
                <div>
                  <strong>Back Cover Image</strong>
                  <small>Optional — PNG or JPG</small>
                </div>
              </div>

              <input
                ref={backCoverInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="upload-back-cover"
                onChange={(e) => handleSelectCover('back', e)}
              />

              <div className="upload-btn-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => backCoverInputRef.current?.click()}
                >
                  <ImageIcon size={16} />
                  <span>{backCoverPreview ? 'Change Back Cover' : 'Upload Back Cover'}</span>
                </button>

                {backCoverPreview && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger-text"
                    onClick={() => {
                      setBackCoverFile(null);
                      setBackCoverPreview('');
                      setRemoveExistingBackCover(true);
                      if (backCoverInputRef.current) backCoverInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {backCoverPreview && (
                <img
                  src={backCoverPreview}
                  alt="Back cover preview"
                  className="cover-preview-thumb"
                />
              )}
            </div>
          </div>

          <QuestionBuilder questions={questions} onChange={setQuestions} />

          {formError && (
            <div className="inline-alert error" role="alert">
              {formError}
            </div>
          )}

          {progressText && (
            <div className="inline-alert info" role="status">
              <Loader2 size={16} className="spin" />
              <span>{progressText}</span>
            </div>
          )}

          <div className="form-submit-row">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Saving & Uploading...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{editingBook ? 'Save Book Changes' : 'Create Book'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="teacher-books-section">
        <div className="section-header">
          <div>
            <h2>My Published Books</h2>
            <p className="muted">Manage your stories: view, download, share, edit, or delete.</p>
          </div>
          <span className="count-badge">
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </span>
        </div>

        {booksLoading ? (
          <div className="state-panel">
            <Loader2 size={28} className="spin" />
            <p>Loading your books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="state-panel">
            <p>You haven't created any books yet. Use the form above to publish your first interactive story.</p>
          </div>
        ) : (
          <div className="teacher-books-list">
            {books.map((book) => {
              const qCount = book.questions?.length ?? book.questionCount ?? 0;
              return (
                <article key={book.id} className="teacher-book-row">
                  <div className="teacher-book-thumb">
                    {book.cover_front_url ? (
                      <img src={book.cover_front_url} alt={book.title} />
                    ) : (
                      <div className="thumb-fallback">PDF</div>
                    )}
                  </div>

                  <div className="teacher-book-info">
                    <h3>{book.title}</h3>
                    {book.description && <p className="muted">{book.description}</p>}
                    <div className="book-card-meta">
                      <span className="meta-chip">
                        {qCount} {qCount === 1 ? 'Question' : 'Questions'}
                      </span>
                      {book.audio_url && <span className="meta-chip">Audio Included</span>}
                    </div>
                  </div>

                  <div className="teacher-book-actions">
                    <Link to={`/book/${book.id}`} className="btn btn-primary btn-sm">
                      <Eye size={15} />
                      <span>View</span>
                    </Link>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        triggerFileDownload(book.pdf_url, `${book.title || 'story'}.pdf`)
                      }
                    >
                      <Download size={15} />
                      <span>Download PDF</span>
                    </button>

                    {book.audio_url && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          triggerFileDownload(book.audio_url, `${book.title || 'audio'}.mp3`)
                        }
                      >
                        <Music size={15} />
                        <span>Download Audio</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShareBook(book)}
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      onClick={() => handleStartEdit(book)}
                    >
                      <Pencil size={15} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={deletingId === book.id}
                      onClick={() => handleDeleteBook(book)}
                    >
                      {deletingId === book.id ? (
                        <Loader2 size={15} className="spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {shareBook && (
        <ShareModal
          book={shareBook}
          onClose={() => setShareBook(null)}
          onNotify={onNotify}
        />
      )}
    </main>
  );
}
