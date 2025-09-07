import { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Preview({ pages = [], page = 0, onPageChange }) {
  const containerRef = useRef(null);
  const pageCount = pages.length || 1;
  const content = pages[Math.min(page, pageCount - 1)] || null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const paper = el.querySelector('.paper');
    if (!paper) return;
    const scale = Math.min(el.clientWidth / paper.scrollWidth, 1);
    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = 'top left';
    el.style.height = `${paper.scrollHeight * scale}px`;
  }, [content]);

  return (
    <div className="preview" ref={containerRef} aria-label="Document preview">
      {content}
      {pageCount > 1 && (
        <>
          <button
            className="pager-btn pager-left"
            onClick={() => onPageChange && onPageChange(Math.max(page - 1, 0))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <Icon name="left" />
          </button>
          <span className="pageIndicator">
            {page + 1} / {pageCount}
          </span>
          <button
            className="pager-btn pager-right"
            onClick={() => onPageChange && onPageChange(Math.min(page + 1, pageCount - 1))}
            disabled={page === pageCount - 1}
            aria-label="Next page"
          >
            <Icon name="right" />
          </button>
        </>
      )}
    </div>
  );
}
