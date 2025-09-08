import { Font } from '@react-pdf/renderer';
let registered = false;
export function registerInter() {
  if (registered) return; registered = true;
  const base = '/fonts';
  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${base}/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Inter-Italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${base}/Inter-Medium.ttf`, fontWeight: 500 },
      { src: `${base}/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Inter-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/Inter-BoldItalic.ttf`, fontWeight: 700, fontStyle: 'italic' },
    ],
  });
}
