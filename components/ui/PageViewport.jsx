import React, { useEffect, useLayoutEffect, useRef } from "react";

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

  // Measure & scale to fit width
  const recompute = () => {
    const el = wrapperRef.current;
    if (!el) return;

    const paper = el.querySelector(".paper");
    if (paper) {
      paper.style.setProperty("--pv-scale", "1");
      const paperW = paper.scrollWidth || paper.getBoundingClientRect().width;
      const pad = 16; // safety padding
      const targetW = el.clientWidth - pad;
      const s = paperW ? Math.min(1, targetW / paperW) : 1;
      paper.style.setProperty("--pv-scale", String(s));
      // Adjust wrapper height to scaled paper height
      el.style.height = `${paper.scrollHeight * s}px`;
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
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="preview"
      aria-label={ariaLabel}
    >
      {/* scale is applied via CSS var; inner .paper is scaled to fill width */}
      <div className="pv-scale">
        {children}
      </div>
    </div>
  );
}

