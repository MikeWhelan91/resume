import React from 'react';

const paths = {
  upload: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bolt: 'M13 2L3 14h7v8l10-12h-7z',
  stars: 'M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6'
};

export default function Icon({ name, size=24, stroke='currentColor', fill='none', ...props }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
