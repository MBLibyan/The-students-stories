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
import QuestionBuilder from '../components/QuestionBuilder';
import ShareModal from '../components/ShareModal';

export default function TeacherPage({ onNotify }) {
  const { user, loading: authLoading, isDemoMode, signIn, signOut } = useAuth();

  // Auth Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Teacher's Books List
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [shareBook, setShareBook] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  // Editor Form State
  const formTopRef = useRef(null);
  const pdfInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const frontCoverInputRef = useRef(null);
  const backCoverInputRef = useRef(null);

  const [editingBook, setEditingBook] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null); // { pageCount }

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

  // Clean up object URLs on change/unmount
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
      onNotify?.(err.message || 'تعذر تحميل قائمة كتبك.', 'error');
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
    if (!isDemoMode && (!email.trim() || !password)) {
      setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setAuthSubmitting(true);
    try {
      await signIn(email, password);
      onNotify?.('تم تسجيل الدخول بنجاح!', 'success');
    } catch (err) {
      setAuthError(err.message || 'تعذر تسجيل الدخول.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      resetForm();
      onNotify?.('تم تسجيل الخروج.', 'success');
    } catch (err) {
      onNotify?.(err.message || 'تعذر تسجيل الخروج.', 'error');
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
      setProgressText('جاري فحص صفحات ملف PDF...');
      const info = await inspectPdfFile(file);
      setPdfFile(file);
      setPdfInfo(info);
      setProgressText('');
    } catch {
      setFormError('تعذر قراءة ملف PDF. تأكد من أن الملف غير محمي بكلمة مرور وغير تالف.');
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

    const label = kind === 'front' ? 'الغلاف الأمامي' : 'الغلاف الخلفي';
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
      `هل أنت متأكد من حذف قصة "${book.title}" وجميع أسئلتها؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    setDeletingId(book.id);
    try {
      await deleteTeacherBook(book);
      if (editingBook?.id === book.id) resetForm();
      if (lastCreatedBook?.id === book.id) setLastCreatedBook(null);
      await fetchBooks();
      onNotify?.('تم حذف القصة بنجاح.', 'success');
    } catch (err) {
      onNotify?.(err.message || 'تعذر حذف القصة.', 'error');
    } finally {
      setDeletingId('');
    }
  };

  const handleSubmitBook = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('يرجى إدخال عنوان القصة.');
      return;
    }
    if (!editingBook && !pdfFile) {
      setFormError('يرجى رفع ملف PDF للقصة أولاً.');
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
        editingBook ? 'تم تحديث الكتاب التفاعلي بنجاح!' : 'تم إنشاء الكتاب التفاعلي ونشره بنجاح!',
        'success'
      );
    } catch (err) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الكتاب.');
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
          <p>جاري التحقق من جلسة المعلم...</p>
        </div>
      </main>
    );
  }

  // Login Screen
  if (!user) {
    return (
      <main className="page-container container auth-page">
        <section className="auth-card">
          <div className="auth-icon">
            <Lock size={26} />
          </div>
          <h1>بوابة المعلم (لوحة التحكم)</h1>
          <p className="muted">
            سجّل الدخول بحساب المعلم لإضافة قصص PDF، رفع الملفات الصوتية، وإعداد أسئلة الفهم والاستنتاج.
          </p>

          <form onSubmit={handleLogin} className="auth-form">
            {!isDemoMode ? (
              <>
                <div className="field">
                  <label htmlFor="teacher-email">البريد الإلكتروني</label>
                  <input
                    id="teacher-email"
                    type="email"
                    dir="ltr"
                    required
                    autoComplete="email"
                    placeholder="teacher@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="teacher-password">كلمة المرور</label>
                  <input
                    id="teacher-password"
                    type="password"
                    dir="ltr"
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
                  التطبيق يعمل حالياً في <strong>الوضع التجريبي</strong> لعدم ضبط متغيرات Supabase.
                  اضغط بالأسفل لتجربة لوحة المعلم وإنشاء كتاب تفاعلي محلياً.
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
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <span>
                  {isDemoMode ? 'الدخول إلى لوحة المعلم التجريبية' : 'تسجيل الدخول'}
                </span>
              )}
            </button>
          </form>

          {!isDemoMode && (
            <p className="auth-footnote">
              تُنشأ حسابات المعلمين من لوحة تحكم Supabase (Authentication → Users).
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="page-container container teacher-page">
      {/* Teacher Header */}
      <div className="teacher-topbar">
        <div>
          <h1>لوحة المعلم — إدارة القصص التفاعلية</h1>
          <p className="muted">
            مرحباً بك: <span dir="ltr">{user.email}</span>
          </p>
        </div>

        <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {lastCreatedBook && (
        <div className="success-callout" role="status">
          <div className="success-callout-info">
            <CheckCircle2 size={20} />
            <div>
              <strong>تم تجهيز الكتاب بنجاح: {lastCreatedBook.title}</strong>
              <p>تم تحويل صفحات PDF إلى كتاب تفاعلي وحفظ الأسئلة.</p>
            </div>
          </div>
          <div className="success-callout-actions">
            <Link to={`/book/${lastCreatedBook.id}`} className="btn btn-primary btn-sm">
              <Eye size={16} />
              <span>عرض الكتاب الآن</span>
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShareBook(lastCreatedBook)}
            >
              <Share2 size={16} />
              <span>مشاركة مع الطلبة</span>
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Book Form */}
      <section ref={formTopRef} className="editor-card">
        <div className="editor-card-header">
          <h2>
            <BookPlus size={20} />
            <span>
              {editingBook ? `تعديل الكتاب: ${editingBook.title}` : 'إنشاء كتاب تفاعلي جديد'}
            </span>
          </h2>
          {editingBook && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
              <X size={16} />
              <span>إلغاء التعديل وإنشاء كتاب جديد</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitBook} className="teacher-form">
          {/* Metadata */}
          <div className="form-two-cols">
            <div className="field">
              <label htmlFor="book-title">عنوان القصة *</label>
              <input
                id="book-title"
                type="text"
                dir="ltr"
                lang="en"
                required
                placeholder="e.g., The Lantern on the Harbour Wall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="book-desc">وصف قصير للقصة</label>
              <input
                id="book-desc"
                type="text"
                dir="ltr"
                lang="en"
                placeholder="Short literary overview for English-department students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="uploads-grid">
            {/* 1. PDF Upload */}
            <div className="upload-box">
              <div className="upload-box-head">
                <FileText size={20} />
                <div>
                  <strong>ملف القصة (PDF) {!editingBook && '*'}</strong>
                  <small>الحد الأقصى 50 ميجابايت — تُعرض الصفحات تلقائياً</small>
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
                <span>{pdfFile || editingBook?.pdf_url ? 'تغيير ملف PDF' : 'إضافة ملف PDF'}</span>
              </button>

              {pdfFile && (
                <div className="upload-meta">
                  <span dir="ltr">{pdfFile.name}</span>
                  {pdfInfo && <span className="meta-chip">{pdfInfo.pageCount} صفحة</span>}
                </div>
              )}
              {!pdfFile && editingBook?.pdf_url && (
                <div className="upload-meta">
                  <span>ملف PDF الحالي محفوظ وجاهز.</span>
                </div>
              )}
            </div>

            {/* 2. Audio Upload */}
            <div className="upload-box">
              <div className="upload-box-head">
                <Music size={20} />
                <div>
                  <strong>الملف الصوتي للقصة (MP3 / M4A)</strong>
                  <small>اختياري — يُمكّن الطالب من الاستماع أثناء القراءة</small>
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
                  <span>{audioFile || audioPreviewUrl ? 'تغيير الصوت' : 'رفع ملف صوتي'}</span>
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
                    إزالة
                  </button>
                )}
              </div>

              {audioFile && <div className="upload-meta" dir="ltr">{audioFile.name}</div>}
              {audioPreviewUrl && (
                <audio controls src={audioPreviewUrl} className="upload-audio-preview" />
              )}
            </div>

            {/* 3. Front Cover */}
            <div className="upload-box">
              <div className="upload-box-head">
                <ImageIcon size={20} />
                <div>
                  <strong>صورة الغلاف الأمامي</strong>
                  <small>اختياري — PNG أو JPG</small>
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
                  <span>{frontCoverPreview ? 'تغيير الغلاف الأمامي' : 'رفع الغلاف الأمامي'}</span>
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
                    إزالة
                  </button>
                )}
              </div>

              {frontCoverPreview && (
                <img
                  src={frontCoverPreview}
                  alt="معاينة الغلاف الأمامي"
                  className="cover-preview-thumb"
                />
              )}
            </div>

            {/* 4. Back Cover */}
            <div className="upload-box">
              <div className="upload-box-head">
                <ImageIcon size={20} />
                <div>
                  <strong>صورة الغلاف الخلفي</strong>
                  <small>اختياري — PNG أو JPG</small>
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
                  <span>{backCoverPreview ? 'تغيير الغلاف الخلفي' : 'رفع الغلاف الخلفي'}</span>
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
                    إزالة
                  </button>
                )}
              </div>

              {backCoverPreview && (
                <img
                  src={backCoverPreview}
                  alt="معاينة الغلاف الخلفي"
                  className="cover-preview-thumb"
                />
              )}
            </div>
          </div>

          {/* 5. Quiz Question Builder */}
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
                  <span>جاري الحفظ والرفع...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{editingBook ? 'حفظ التعديلات على الكتاب' : 'إنشاء الكتاب'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Teacher's Books List */}
      <section className="teacher-books-section">
        <div className="section-header">
          <div>
            <h2>قصصي المنشورة</h2>
            <p className="muted">إدارة كتبك: عرض، تحميل، مشاركة، تعديل، أو حذف.</p>
          </div>
          <span className="count-badge">{books.length} كتاب</span>
        </div>

        {booksLoading ? (
          <div className="state-panel">
            <Loader2 size={28} className="spin" />
            <p>جاري تحميل قائمة كتبك...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="state-panel">
            <p>لم تقم بإنشاء أي كتب بعد. استخدم النموذج أعلاه لإضافة أول قصة تفاعلية.</p>
          </div>
        ) : (
          <div className="teacher-books-list">
            {books.map((book) => (
              <article key={book.id} className="teacher-book-row">
                <div className="teacher-book-thumb">
                  {book.cover_front_url ? (
                    <img src={book.cover_front_url} alt={book.title} />
                  ) : (
                    <div className="thumb-fallback" dir="ltr">
                      PDF
                    </div>
                  )}
                </div>

                <div className="teacher-book-info">
                  <h3 dir="ltr" lang="en">
                    {book.title}
                  </h3>
                  {book.description && (
                    <p dir="ltr" lang="en" className="muted">
                      {book.description}
                    </p>
                  )}
                  <div className="book-card-meta">
                    <span className="meta-chip">
                      {(book.questions?.length ?? book.questionCount ?? 0)} سؤال
                    </span>
                    {book.audio_url && <span className="meta-chip">يحتوي على صوت</span>}
                  </div>
                </div>

                <div className="teacher-book-actions">
                  <Link to={`/book/${book.id}`} className="btn btn-primary btn-sm">
                    <Eye size={15} />
                    <span>عرض</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      triggerFileDownload(book.pdf_url, `${book.title || 'story'}.pdf`)
                    }
                  >
                    <Download size={15} />
                    <span>تحميل PDF</span>
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
                      <span>تحميل الصوت</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShareBook(book)}
                  >
                    <Share2 size={15} />
                    <span>مشاركة</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => handleStartEdit(book)}
                  >
                    <Pencil size={15} />
                    <span>تعديل</span>
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
                    <span>حذف</span>
                  </button>
                </div>
              </article>
            ))}
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
