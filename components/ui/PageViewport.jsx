import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * PageViewport
 * - Shows preview content in a scrollable viewport sized to one "page".
 * - Adds arrow navigation and page counter.
 * - Auto "fit-to-width": scales the inner .paper to fill the viewport width.
 *
 * Usage:
 *   <PageViewport ariaLabel="CV preview"><TemplateComp data={...} /></PageViewport>
 */
export default function PageViewport({ children, ariaLabel = "Preview" }) {
  const wrapperRef = useRef(null); // scrollable viewport
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);

  // Measure pages & scale to fit width
  const recompute = () => {
    const el = wrapperRef.current;
    if (!el) return;

    // Fit-to-width: find first .paper (your templates wrap content in .paper)
    const paper = el.querySelector(".paper");
    if (paper) {
      // Reset scale to measure the intrinsic width
      paper.style.setProperty("--pv-scale", "1");
      // Use scrollWidth to avoid current transforms
      const paperW = paper.scrollWidth || paper.getBoundingClientRect().width;
      const pad = 16; // small safety padding
      const targetW = el.clientWidth - pad;
      const s = paperW ? Math.min(1.1, Math.max(0.6, targetW / paperW)) : 1; // cap to avoid over/under scaling
      setScale(s);
      paper.style.setProperty("--pv-scale", String(s));
    }

    // Set page count based on scroll height vs client height
    // (after scaling, so clientHeight is one "page")
    const total = Math.max(1, Math.round(el.scrollHeight / el.clientHeight));
    setPages(total);

    // Sync current page to scrollTop
    const current = Math.min(total, Math.max(1, Math.round(el.scrollTop / el.clientHeight) + 1));
    setPage(current);
  };

  useLayoutEffect(recompute, []);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    // Also watch children size
    const paper = el.querySelector(".paper");
    if (paper) ro.observe(paper);
    return () => ro.disconnect();
  }, []);

  // Update page indicator on manual scroll
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onScroll = () => {
      const current = Math.min(pages, Math.max(1, Math.round(el.scrollTop / el.clientHeight) + 1));
      setPage(current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pages]);

  const scrollToPage = (p) => {
    const el = wrapperRef.current;
    if (!el) return;
    const clamped = Math.min(pages, Math.max(1, p));
    el.scrollTo({ top: (clamped - 1) * el.clientHeight, behavior: "smooth" });
  };
  const next = () => scrollToPage(page + 1);
  const prev = () => scrollToPage(page - 1);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); next(); }
    if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); prev(); }
  };

  return (
    <div className="page-viewport">
      <div
        ref={wrapperRef}
        className="preview paged fit"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
      >
        {/* scale is applied via CSS var; inner .paper is scaled to fill width */}
        <div className="pv-scale">
          {children}
        </div>
      </div>

      {pages > 1 && (
        <>
          <button type="button" className="pager-arrow up" onClick={prev} aria-label="Previous page" disabled={page <= 1}>▲</button>
          <div className="pager-indicator" aria-live="polite">{page} / {pages}</div>
          <button type="button" className="pager-arrow down" onClick={next} aria-label="Next page" disabled={page >= pages}>▼</button>
        </>
      )}
    </div>
  );
}

