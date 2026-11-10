import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageFlip } from 'page-flip';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { loadPdfDocument, renderPdfPageToUrl } from '../lib/pdfUtils';
import QuizPage from './QuizPage';

const WINDOW_BEFORE = 2;
const WINDOW_AFTER = 4;
const MAX_CACHED_PAGES = 24;
const EVICT_DISTANCE = 14;

export default function FlipbookViewer({ book }) {
  const viewerShellRef = useRef(null);
  const flipHostRef = useRef(null);
  const pageFlipRef = useRef(null);
  const pdfDocRef = useRef(null);
  const pageSlotsRef = useRef(new Map()); // pdfPageNum -> HTMLElement slot
  const renderedUrlsRef = useRef(new Map()); // pdfPageNum -> objectUrl
  const renderQueueRunningRef = useRef(false);
  const renderTokenRef = useRef(0);

  const [pdfStatus, setPdfStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [pdfError, setPdfError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(595 / 842);
  const [currentFlipIndex, setCurrentFlipIndex] = useState(0);
  const [quizPortalTarget, setQuizPortalTarget] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build ordered page layout:
  // Front cover -> (optional flyleaf when PDF page count is even, keeping back cover standalone) -> Story PDF pages -> Quick Check quiz -> Back cover
  const bookPages = useMemo(() => {
    if (numPages <= 0) return [];
    const pages = [{ kind: 'front-cover', label: 'الغلاف الأمامي' }];

    if (numPages % 2 === 0) {
      pages.push({ kind: 'flyleaf', label: 'مقدمة القصة' });
    }

    for (let p = 1; p <= numPages; p += 1) {
      pages.push({ kind: 'pdf', pdfPage: p, label: `صفحة ${p} من ${numPages}` });
    }

    pages.push({ kind: 'quiz', label: 'الاختبار السريع' });
    pages.push({ kind: 'back-cover', label: 'الغلاف الخلفي' });
    return pages;
  }, [numPages]);

  const quizFlipIndex = useMemo(
    () => bookPages.findIndex((p) => p.kind === 'quiz'),
    [bookPages]
  );

  // Helper to update a PDF page's DOM node smoothly without touching React reconciliation
  const paintPdfSlot = (pdfPageNum, objectUrl) => {
    const slot = pageSlotsRef.current.get(pdfPageNum);
    if (!slot) return;

    if (objectUrl) {
      slot.innerHTML = '';
      const img = document.createElement('img');
      img.src = objectUrl;
      img.alt = `Story page ${pdfPageNum}`;
      img.className = 'flip-pdf-image';
      img.draggable = false;

      const footer = document.createElement('span');
      footer.className = 'flip-page-num-pill';
      footer.textContent = String(pdfPageNum);

      slot.appendChild(img);
      slot.appendChild(footer);
    } else {
      slot.innerHTML = `
        <div class="flip-page-skeleton" dir="rtl">
          <div class="skeleton-spinner"></div>
          <span>جاري تجهيز صفحة ${pdfPageNum}...</span>
        </div>
      `;
    }
  };

  // Lazy-render a sliding window of PDF pages around the active flip index
  const scheduleLazyWindow = async (activeFlipIdx, token) => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || bookPages.length === 0 || renderQueueRunningRef.current) return;

    renderQueueRunningRef.current = true;
    try {
      let keepGoing = true;
      while (keepGoing) {
        if (renderTokenRef.current !== token) break;

        const targetStart = Math.max(0, activeFlipIdx - WINDOW_BEFORE);
        const targetEnd = Math.min(bookPages.length - 1, activeFlipIdx + WINDOW_AFTER);

        // Prioritize the currently visible page(s) first, then lookahead, then lookbehind
        const candidates = [];
        for (let idx = activeFlipIdx; idx <= targetEnd; idx += 1) candidates.push(idx);
        for (let idx = activeFlipIdx - 1; idx >= targetStart; idx -= 1) candidates.push(idx);

        const nextPdfNums = [];
        for (const idx of candidates) {
          const entry = bookPages[idx];
          if (entry?.kind === 'pdf' && !renderedUrlsRef.current.has(entry.pdfPage)) {
            nextPdfNums.push(entry.pdfPage);
          }
        }

        if (nextPdfNums.length === 0) {
          keepGoing = false;
          break;
        }

        const pageToRender = nextPdfNums[0];
        try {
          const url = await renderPdfPageToUrl(pdfDoc, pageToRender, 720);
          if (renderTokenRef.current !== token) {
            URL.revokeObjectURL(url);
            break;
          }
          renderedUrlsRef.current.set(pageToRender, url);
          paintPdfSlot(pageToRender, url);

          // Evict distant pages on large PDFs to keep mobile RAM low
          if (numPages > MAX_CACHED_PAGES && renderedUrlsRef.current.size > MAX_CACHED_PAGES) {
            const currentEntry = bookPages[activeFlipIdx];
            const approxPdfPage =
              currentEntry?.kind === 'pdf'
                ? currentEntry.pdfPage
                : activeFlipIdx > quizFlipIndex
                  ? numPages
                  : 1;

            for (const [cachedPage, cachedUrl] of renderedUrlsRef.current.entries()) {
              if (Math.abs(cachedPage - approxPdfPage) > EVICT_DISTANCE) {
                renderedUrlsRef.current.delete(cachedPage);
                URL.revokeObjectURL(cachedUrl);
                paintPdfSlot(cachedPage, null);
              }
            }
          }
        } catch {
          // Leave placeholder error cleanly without crashing whole viewer
          const slot = pageSlotsRef.current.get(pageToRender);
          if (slot) {
            slot.innerHTML = `<div class="flip-page-skeleton" dir="rtl"><span>تعذر عرض الصفحة ${pageToRender}</span></div>`;
          }
          break;
        }
      }
    } finally {
      renderQueueRunningRef.current = false;
    }
  };

  // Load PDF document when book.pdf_url changes
  const loadDocument = async () => {
    renderTokenRef.current += 1;
    const token = renderTokenRef.current;

    setPdfStatus('loading');
    setPdfError('');
    setNumPages(0);
    setCurrentFlipIndex(0);

    for (const url of renderedUrlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    renderedUrlsRef.current.clear();

    if (pdfDocRef.current) {
      try {
        await pdfDocRef.current.destroy();
      } catch {
        // ignore
      }
      pdfDocRef.current = null;
    }

    try {
      const doc = await loadPdfDocument(book.pdf_url);
      if (renderTokenRef.current !== token) {
        await doc.destroy();
        return;
      }

      pdfDocRef.current = doc;
      const firstPage = await doc.getPage(1);
      const vp = firstPage.getViewport({ scale: 1 });
      const ratio = Math.min(0.95, Math.max(0.56, vp.width / vp.height));
      firstPage.cleanup();

      if (renderTokenRef.current !== token) return;

      setAspectRatio(ratio);
      setNumPages(doc.numPages);
      setPdfStatus('ready');
    } catch {
      if (renderTokenRef.current === token) {
        setPdfStatus('error');
        setPdfError('تعذر تحميل ملف القصة PDF. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.');
      }
    }
  };

  useEffect(() => {
    if (!book?.pdf_url) return;
    loadDocument();

    return () => {
      renderTokenRef.current += 1;
      for (const url of renderedUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      renderedUrlsRef.current.clear();
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, [book?.pdf_url]);

  // Mount imperative StPageFlip instance once bookPages are ready
  useEffect(() => {
    if (pdfStatus !== 'ready' || bookPages.length === 0 || !flipHostRef.current) return;

    const host = flipHostRef.current;
    host.innerHTML = '';
    pageSlotsRef.current.clear();

    const inBlock = document.createElement('div');
    inBlock.className = 'flipbook-block-mount';
    host.appendChild(inBlock);

    let quizTarget = null;
    const pageWidth = 460;
    const pageHeight = Math.round(pageWidth / aspectRatio);

    const elements = bookPages.map((entry) => {
      const pageEl = document.createElement('div');
      pageEl.className = `flip-page flip-page-${entry.kind}`;

      if (entry.kind === 'front-cover' || entry.kind === 'back-cover') {
        pageEl.setAttribute('data-density', 'hard');
      }

      if (entry.kind === 'front-cover') {
        if (book.cover_front_url) {
          const img = document.createElement('img');
          img.src = book.cover_front_url;
          img.alt = `${book.title} cover`;
          img.className = 'flip-cover-image';
          img.draggable = false;
          pageEl.appendChild(img);
        } else {
          pageEl.innerHTML = `
            <div class="flip-fallback-cover flip-fallback-front" dir="ltr" lang="en">
              <span class="cover-eyebrow">UNIVERSITY ENGLISH DEPARTMENT</span>
              <h2>${escapeHtml(book.title)}</h2>
              <div class="cover-rule"></div>
              <p>${escapeHtml(book.description || 'Interactive Storybook Flipbook Edition')}</p>
              <span class="cover-footer">STORYBOOK FLIPBOOK</span>
            </div>
          `;
        }
      } else if (entry.kind === 'flyleaf') {
        pageEl.innerHTML = `
          <div class="flip-flyleaf" dir="ltr" lang="en">
            <span class="flyleaf-label">EX LIBRIS • STORY OVERVIEW</span>
            <h3>${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.description || 'Turn the page to begin reading the story.')}</p>
            <div class="flyleaf-hint">Swipe or click Next to begin reading →</div>
          </div>
        `;
      } else if (entry.kind === 'pdf') {
        pageSlotsRef.current.set(entry.pdfPage, pageEl);
        const existingUrl = renderedUrlsRef.current.get(entry.pdfPage);
        paintPdfSlot(entry.pdfPage, existingUrl || null);
      } else if (entry.kind === 'quiz') {
        quizTarget = document.createElement('div');
        quizTarget.className = 'flip-quiz-mount';
        pageEl.appendChild(quizTarget);
      } else if (entry.kind === 'back-cover') {
        if (book.cover_back_url) {
          const img = document.createElement('img');
          img.src = book.cover_back_url;
          img.alt = `${book.title} back cover`;
          img.className = 'flip-cover-image';
          img.draggable = false;
          pageEl.appendChild(img);
        } else {
          pageEl.innerHTML = `
            <div class="flip-fallback-cover flip-fallback-back" dir="ltr" lang="en">
              <span class="cover-eyebrow">THE END</span>
              <h3>${escapeHtml(book.title)}</h3>
              <div class="cover-rule"></div>
              <p>Completed reading and Quick Check? Feel free to flip back and review any chapter or audio passage.</p>
              <span class="cover-footer">STORYBOOK FLIPBOOK EDITION</span>
            </div>
          `;
        }
      }

      return pageEl;
    });

    setQuizPortalTarget(quizTarget);

    const pageFlip = new PageFlip(inBlock, {
      width: pageWidth,
      height: pageHeight,
      size: 'stretch',
      minWidth: 250,
      maxWidth: 620,
      minHeight: 350,
      maxHeight: 880,
      maxShadowOpacity: 0.45,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: true,
      drawShadow: true,
      flippingTime: 650,
      clickEventForward: true,
      showPageCorners: true,
      swipeDistance: 30,
    });

    pageFlip.on('init', (e) => {
      const idx = typeof e?.data?.page === 'number' ? e.data.page : 0;
      setCurrentFlipIndex(idx);
      scheduleLazyWindow(idx, renderTokenRef.current);
    });

    pageFlip.on('flip', (e) => {
      const idx = typeof e?.data === 'number' ? e.data : pageFlip.getCurrentPageIndex();
      setCurrentFlipIndex(idx);
      scheduleLazyWindow(idx, renderTokenRef.current);
    });

    pageFlip.loadFromHTML(elements);
    pageFlipRef.current = pageFlip;

    // Also kick off initial window render immediately
    scheduleLazyWindow(0, renderTokenRef.current);

    return () => {
      setQuizPortalTarget(null);
      pageFlipRef.current = null;
      try {
        pageFlip.destroy();
      } catch {
        // ignore if already detached
      }
      host.innerHTML = '';
      pageSlotsRef.current.clear();
    };
  }, [pdfStatus, bookPages, aspectRatio, book?.cover_front_url, book?.cover_back_url, book?.title, book?.description]);

  // Listen to browser fullscreen change + Escape key for CSS fallback fullscreen
  useEffect(() => {
    const onFsChange = () => {
      const activeEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(Boolean(activeEl));
      setTimeout(() => pageFlipRef.current?.update(), 120);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
        setTimeout(() => pageFlipRef.current?.update(), 120);
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') pageFlipRef.current?.flipNext();
      if (e.key === 'ArrowLeft') pageFlipRef.current?.flipPrev();
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const shell = viewerShellRef.current;
    if (!shell) return;

    try {
      if (!document.fullscreenElement && !isFullscreen) {
        if (shell.requestFullscreen) {
          await shell.requestFullscreen();
          setIsFullscreen(true);
        } else if (shell.webkitRequestFullscreen) {
          shell.webkitRequestFullscreen();
          setIsFullscreen(true);
        } else {
          // iOS Safari / embedded WebView fallback
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }

    setTimeout(() => pageFlipRef.current?.update(), 150);
  };

  const handleFlipPrev = () => {
    pageFlipRef.current?.flipPrev();
  };

  const handleFlipNext = () => {
    pageFlipRef.current?.flipNext();
  };

  const handleJumpToQuiz = () => {
    if (quizFlipIndex >= 0) {
      pageFlipRef.current?.flip(quizFlipIndex);
      scheduleLazyWindow(quizFlipIndex, renderTokenRef.current);
    }
  };

  const handleJumpToStart = () => {
    pageFlipRef.current?.flip(0);
    scheduleLazyWindow(0, renderTokenRef.current);
  };

  const activeLabel = bookPages[currentFlipIndex]?.label || '';

  return (
    <section
      ref={viewerShellRef}
      className={`flipbook-shell ${isFullscreen ? 'is-fullscreen' : ''}`}
      aria-label="عارض القصة التفاعلي"
    >
      {/* Controls Bar */}
      <div className="flipbook-controls-bar">
        <div className="flipbook-nav-group">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleFlipPrev}
            disabled={pdfStatus !== 'ready' || currentFlipIndex <= 0}
          >
            <ChevronRight size={17} />
            <span>السابق</span>
          </button>

          <span className="flipbook-page-status" aria-live="polite">
            {pdfStatus === 'ready' ? activeLabel : 'جاري التحميل...'}
          </span>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleFlipNext}
            disabled={pdfStatus !== 'ready' || currentFlipIndex >= bookPages.length - 1}
          >
            <span>التالي</span>
            <ChevronLeft size={17} />
          </button>
        </div>

        <div className="flipbook-quick-actions">
          {pdfStatus === 'ready' && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleJumpToStart}
                title="العودة إلى الغلاف الأمامي"
              >
                <BookOpen size={16} />
                <span className="hide-xs">الغلاف</span>
              </button>

              {quizFlipIndex >= 0 && (
                <button
                  type="button"
                  className="btn btn-accent btn-sm"
                  onClick={handleJumpToQuiz}
                  title="الانتقال إلى صفحة الاختبار السريع"
                >
                  <Sparkles size={16} />
                  <span>الاختبار السريع</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'إنهاء عرض ملء الشاشة' : 'عرض ملء الشاشة'}
            title={isFullscreen ? 'تصغير' : 'عرض ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'إنهاء ملء الشاشة' : 'عرض ملء الشاشة'}</span>
          </button>
        </div>
      </div>

      {/* Book Stage */}
      <div className="flipbook-stage">
        {pdfStatus === 'loading' && (
          <div className="flipbook-state-box">
            <Loader2 size={34} className="spin" />
            <p>جاري فتح القصة وتجهيز صفحات الكتاب...</p>
          </div>
        )}

        {pdfStatus === 'error' && (
          <div className="flipbook-state-box error" role="alert">
            <AlertCircle size={36} />
            <p>{pdfError}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadDocument}>
              <RotateCcw size={16} />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        <div
          className={`flipbook-ltr-stage ${pdfStatus === 'ready' ? 'visible' : 'hidden'}`}
          dir="ltr"
          lang="en"
        >
          <div ref={flipHostRef} className="flipbook-stage-host" />
        </div>
      </div>

      {pdfStatus === 'ready' && (
        <p className="flipbook-gesture-hint">
          اسحب الصفحة يميناً أو يساراً للتقليب، أو استخدم أزرار التنقل ولوحة المفاتيح.
        </p>
      )}

      {quizPortalTarget &&
        createPortal(
          <QuizPage questions={book.questions || []} bookTitle={book.title} />,
          quizPortalTarget
        )}
    </section>
  );
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
