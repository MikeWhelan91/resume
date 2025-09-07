import React from 'react';

export default function Section({ children, className='' }) {
  return (
    <section className={`max-w-5xl mx-auto px-4 py-16 ${className}`}>
      {children}
    </section>
  );
}
