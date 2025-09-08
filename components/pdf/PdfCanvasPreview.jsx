import { useEffect, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
// Legacy v3 build (asm.js, no WASM)
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";

const PDF_OPTS = { disableWorker: true };

export default function PdfCanvasPreview({ doc, title }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [index, setIndex] = useState(0);
  const [err, setErr] = useState(null);
  const renderIdRef = useRef(0);

  async function render() {
    const rid = ++renderIdRef.current;
    setErr(null);
    if (!wrapperRef.current || !canvasRef.current || !doc) return;

    try {
      const blob = await pdf(doc).toBlob();
      const data = await blob.arrayBuffer();
      if (rid !== renderIdRef.current) return;

      const pdfDoc = await pdfjs.getDocument({ data, ...PDF_OPTS }).promise;
      if (rid !== renderIdRef.current) return;

      setPageCount(pdfDoc.numPages);
      const page = await pdfDoc.getPage(Math.min(index + 1, pdfDoc.numPages));

      const containerWidth = wrapperRef.current.clientWidth || 794;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaled = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(scaled.width);
      canvas.height = Math.floor(scaled.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: scaled }).promise;
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => { render(); /* eslint-disable-next-line */ }, [doc, index]);
  useEffect(() => {
    const ro = new ResizeObserver(() => render());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line
  }, []);

  const canPrev = index > 0, canNext = index < pageCount - 1;

  return (
    <div className="p-0 bg-transparent">
      <div className="relative" ref={wrapperRef} style={{ minHeight: 200 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-auto"
          style={{ background: "#fff" }}
          aria-label={title || "PDF preview"}
        />
        {err && (
          <div className="absolute inset-0 grid place-items-center text-xs text-red-600 bg-white/90">
            Preview failed. Try downloading the PDF.
          </div>
        )}
        {pageCount > 1 && !err && (
          <>
            {canPrev && (
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border rounded px-2 py-1 shadow"
                onClick={() => setIndex(i => Math.max(0, i - 1))}
                aria-label="Previous page"
              >←</button>
            )}
            {canNext && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border rounded px-2 py-1 shadow"
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
