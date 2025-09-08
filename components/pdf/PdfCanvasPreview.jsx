import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
// Use PDF.js without worker (simpler bundling); fine for short docs
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

export default function PdfCanvasPreview({ doc, title }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [index, setIndex] = useState(0);

  async function render() {
    if (!wrapperRef.current || !canvasRef.current) return;
    const blob = await pdf(doc).toBlob();
    const data = await blob.arrayBuffer();

    const pdfDoc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
    setPageCount(pdfDoc.numPages);
    const page = await pdfDoc.getPage(index + 1);

    const vw = wrapperRef.current.clientWidth;          // fit width of column
    const viewport = page.getViewport({ scale: 1 });
    const scale = vw / viewport.width;
    const scaled = page.getViewport({ scale });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = Math.floor(scaled.width);
    canvas.height = Math.floor(scaled.height);

    // white background, no dark borders
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  }

  useEffect(() => { render(); /* eslint-disable-next-line */ }, [doc, index]);
  useEffect(() => {
    const ro = new ResizeObserver(() => render());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
    /* eslint-disable-next-line */
  }, []);

  const canPrev = index > 0, canNext = index < pageCount - 1;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3">
      <div className="relative" ref={wrapperRef} style={{ minHeight: 200 }}>
        <canvas ref={canvasRef} className="block w-full h-auto" />
        {/* Minimal pager; hidden when only 1 page */}
        {pageCount > 1 && (
          <>
            {canPrev && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border rounded px-2 py-1"
                onClick={() => setIndex(i => Math.max(0, i - 1))}
                aria-label="Previous page"
              >←</button>
            )}
            {canNext && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border rounded px-2 py-1"
                onClick={() => setIndex(i => Math.min(pageCount - 1, i + 1))}
                aria-label="Next page"
              >→</button>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
              {index + 1} / {pageCount}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
