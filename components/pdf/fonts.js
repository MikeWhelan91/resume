import { Font } from '@react-pdf/renderer';

// Use local fonts if available; else fall back to system sans.
export function registerPdfFonts() {
  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/Inter-Medium.ttf',  fontWeight: 500 },
        { src: '/fonts/Inter-Bold.ttf',    fontWeight: 700 },
      ],
    });
  } catch (e) {
    // safe to ignore if double-registered in HMR
  }
}
