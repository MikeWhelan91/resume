export const THEMES = {
  normal: {
    baseFont: 11,
    lineHeight: 1.4,
    sectionGap: 10,
    bulletGap: 4,
    pageMargin: 36, // 0.5in (pt units)
    headingSize: 14,
    subheadingSize: 11,
  },
  cosy: {
    baseFont: 12,
    lineHeight: 1.5,
    sectionGap: 12,
    bulletGap: 5,
    pageMargin: 40,
    headingSize: 15,
    subheadingSize: 12,
  },
  compact: {
    baseFont: 10,
    lineHeight: 1.3,
    sectionGap: 8,
    bulletGap: 3,
    pageMargin: 28, // tighter margins
    headingSize: 13,
    subheadingSize: 10,
  },
};

export function getTheme(name) {
  return THEMES[name] || THEMES.normal;
}
