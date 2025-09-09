'use client';
import React from 'react';

const A4 = { w: 794, h: 1123 }; // 210x297mm @ ~96dpi for on-screen preview

export default function PreviewFrame({ engine, htmlDoc, templateId }) {
  const style = {
    width: A4.w,
    height: A4.h,
    border: 0,
    boxShadow: '0 10px 30px rgba(0,0,0,.15)',
    background: '#fff'
  };

  if (engine === 'html') {
    // HTML themes: provide full <html> doc via srcDoc
    return <iframe style={style} srcDoc={htmlDoc} />;
  }

  // React-PDF templates: preview is served by server API, not client rendering
  const src = `/api/preview-pdf?template=${encodeURIComponent(templateId)}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  return <iframe style={style} src={src} />;
}
