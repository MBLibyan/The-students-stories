import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Inspect a locally selected PDF File to validate it and get its page count & aspect ratio.
 */
export async function inspectPdfFile(file) {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  try {
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    return {
      pageCount: pdf.numPages,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
    };
  } finally {
    await pdf.destroy();
  }
}

/**
 * Open a remote or local PDF document using streaming / chunked loading for large PDFs.
 */
export async function loadPdfDocument(url) {
  const loadingTask = pdfjsLib.getDocument({
    url,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 65536,
  });
  return loadingTask.promise;
}

/**
 * Render one PDF page onto an offscreen canvas and convert to an Object URL (WebP/PNG)
 * so StPageFlip portrait cloning (cloneNode) preserves the full page image without blank flashes.
 */
export async function renderPdfPageToUrl(pdfDoc, pageNumber, targetWidth = 720) {
  const page = await pdfDoc.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const scale = Math.max(0.75, (targetWidth * dpr) / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Release pdf.js page-level memory promptly
  page.cleanup();

  return new Promise((resolve, reject) => {
    const finish = (blob) => {
      // Clear canvas backing store to keep mobile memory low
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) {
        reject(new Error('Failed to encode rendered PDF page'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    };

    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob) {
          finish(webpBlob);
        } else {
          canvas.toBlob(finish, 'image/jpeg', 0.9);
        }
      },
      'image/webp',
      0.92
    );
  });
}
