import { useState, useMemo } from 'react';
import PageViewport from './PageViewport';

export default function PreviewPane({ content }) {
  // content: array of page elements
  const pages = useMemo(() => content || [], [content]);
  const [page, setPage] = useState(0);
  const pageCount = pages.length || 1;
  return (
    <PageViewport page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel="Document preview">
      {pages[page]}
    </PageViewport>
  );
}
