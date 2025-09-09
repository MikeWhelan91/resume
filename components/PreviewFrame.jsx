import React from 'react';
import { BlobProvider } from '@react-pdf/renderer';

const A4 = {
  wpx: 794, // A4 @ 96dpi (screen preview only)
  hpx: 1123,
};

// Renders either an HTML document string or a React-PDF <Document/>
export default function PreviewFrame({ engine, htmlDoc, ReactPdfDoc }) {
  const style = {
    width: A4.wpx,
    height: A4.hpx,
    border: '0',
    boxShadow: '0 10px 30px rgba(0,0,0,.15)',
    background: '#fff',
  };

  if (engine === 'html') {
    return <iframe style={style} srcDoc={htmlDoc} />;
  }

  // React-PDF: use BlobProvider -> iframe with toolbar disabled
  if (engine === 'react-pdf') {
    return (
      <BlobProvider document={ReactPdfDoc}>
        {({ url, loading, error }) => {
          if (loading)
            return (
              <div style={{ width: A4.wpx, height: A4.hpx, display: 'grid', placeItems: 'center' }}>
                Rendering…
              </div>
            );
          if (error)
            return (
              <div style={{ width: A4.wpx, height: A4.hpx, padding: 16, color: 'crimson' }}>
                PDF error: {String(error)}
              </div>
            );
          const cleanUrl = url ? url + '#view=FitH&toolbar=0&navpanes=0&scrollbar=0' : '';
          return <iframe style={style} src={cleanUrl} />;
        }}
      </BlobProvider>
    );
  }

  return null;
}
