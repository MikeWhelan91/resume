import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";

/**
 * PageViewport
 * - Displays preview content scaled to fit the container width.
 * - Ensures the full A4 page height is visible without internal scrolling.
 *
 * Usage:
 *   <PageViewport ariaLabel="CV preview"><TemplateComp data={...} /></PageViewport>
 */
import Icon from './Icon';

export default function PageViewport({ children, ariaLabel = "Preview", page = 0, pageCount = 1, onPageChange }) {
  const wrapperRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  const renderContent = () =>
    isValidElement(children) ? cloneElement(children) : children;

  // Measure & scale to fit width and viewport height
  const recompute = () => {
    const el = wrapperRef.current;
    if (!el) return;

    const paper = el.querySelector(".paper");
    if (paper) {
      paper.style.setProperty("--pv-scale", "1");
      const rect = paper.getBoundingClientRect();
      const paperW = paper.scrollWidth || rect.width;
      const paperH = paper.scrollHeight || rect.height;
      const pad = 16; // safety padding
      const targetW = el.clientWidth - pad;
      const sW = paperW ? Math.min(1, targetW / paperW) : 1;
      const viewportH = window.innerHeight ? window.innerHeight - 120 : Infinity;
      const sH = paperH ? Math.min(1, viewportH / paperH) : 1;
      const s = Math.min(sW, sH);
      paper.style.setProperty("--pv-scale", String(s));
      // Adjust wrapper height to scaled paper height
      el.style.height = `${paperH * s}px`;
    }
  };

  useLayoutEffect(recompute, []);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    const paper = el.querySelector(".paper");
    if (paper) ro.observe(paper);
    window.addEventListener("resize", recompute);
    const key = (e) => {
      if (e.key === "ArrowRight" && page < pageCount - 1) onPageChange && onPageChange(page + 1);
      if (e.key === "ArrowLeft" && page > 0) onPageChange && onPageChange(page - 1);
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      window.removeEventListener("keydown", key);
    };
  }, [page, pageCount, onPageChange, fullscreen]);

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [fullscreen]);

  return (
    <>
      <div
        ref={wrapperRef}
        className="preview"
        aria-label={ariaLabel}
        role="button"
        tabIndex={0}
        onClick={() => setFullscreen(true)}
      >
        {/* scale is applied via CSS var; inner .paper is scaled to fill width */}
        <div className="pv-scale">{renderContent()}</div>
        {pageCount > 1 && (
          <div className="pager">
            <button className="pager-btn" onClick={(e)=>{e.stopPropagation(); onPageChange && onPageChange(Math.max(page-1,0));}} disabled={page===0}>
              <Icon name="left" />
            </button>
            <div className="pageIndicator">{page+1} / {pageCount}</div>
            <button className="pager-btn" onClick={(e)=>{e.stopPropagation(); onPageChange && onPageChange(Math.min(page+1,pageCount-1));}} disabled={page===pageCount-1}>
              <Icon name="right" />
            </button>
          </div>
        )}
      </div>
      {fullscreen && (
        <div
          className="fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="fullscreen-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="fullscreen-close"
              aria-label="Close preview"
              onClick={() => setFullscreen(false)}
            >
              &times;
            </button>
            <div className="relative">
              {renderContent()}
              {pageCount > 1 && (
                <div className="pager">
                  <button className="pager-btn" onClick={(e)=>{e.stopPropagation(); onPageChange && onPageChange(Math.max(page-1,0));}} disabled={page===0}>
                    <Icon name="left" />
                  </button>
                  <div className="pageIndicator">{page+1} / {pageCount}</div>
                  <button className="pager-btn" onClick={(e)=>{e.stopPropagation(); onPageChange && onPageChange(Math.min(page+1,pageCount-1));}} disabled={page===pageCount-1}>
                    <Icon name="right" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

