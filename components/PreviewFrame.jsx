'use client';
import React from 'react';

export default function PreviewFrame({ htmlDoc, className }) {
  // Strictly an iframe with srcDoc; no external URL, no scaling logic here.
  return <iframe className={className || 'A4Preview'} srcDoc={htmlDoc} />;
}
