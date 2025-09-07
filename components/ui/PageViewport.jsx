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
export default function PageViewport({ children, ariaLabel = "Preview" }) {
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
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

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
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}

