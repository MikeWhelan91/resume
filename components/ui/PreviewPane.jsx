import { useMemo } from 'react';
import PageViewport from './PageViewport';

export default function PreviewPane({ content, page = 0, onPageChange }) {
  // content: array of page elements
  const pages = useMemo(() => content || [], [content]);
  const pageCount = pages.length || 1;
  return (
    <PageViewport page={page} pageCount={pageCount} onPageChange={onPageChange} ariaLabel="Document preview">
      {pages[page]}
    </PageViewport>
  );
}
