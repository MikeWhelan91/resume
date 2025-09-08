export function makeTheme(layout = 'normal', accent = '#2563eb', ats = false) {
  const base = {
    normal:  { base: 11, lh: 1.4, gap: 10, bullet: 4, margin: 36, h1: 16, h2: 12 },
    cosy:    { base: 12, lh: 1.5, gap: 12, bullet: 5, margin: 40, h1: 17, h2: 13 },
    compact: { base: 10, lh: 1.3, gap:  8, bullet: 3, margin: 28, h1: 15, h2: 11 },
  }[layout] || this.normal;
  return {
    ...base,
    accent: ats ? '#000000' : accent,
    text:   '#000000',
    meta:   '#555555',
    ats,
  };
}
