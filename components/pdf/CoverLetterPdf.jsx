import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';
import { getTheme } from './theme';

function makeStyles(t) {
  return StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: t.baseFont, lineHeight: t.lineHeight, padding: t.pageMargin },
    h1: { fontSize: t.headingSize, marginBottom: 10, fontWeight: 700 },
    meta: { color: '#555', marginBottom: 10 },
    para: { marginBottom: 8 },
  });
}

export default function CoverLetterPdf({ text, identity, layout = 'normal' }) {
  registerPdfFonts();
  const t = getTheme(layout);
  const s = makeStyles(t);
  const lines = String(text || '').split(/\n+/).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {!!identity?.name && <Text style={s.h1}>{String(identity.name)}</Text>}
        <Text style={s.meta}>
          {[identity?.email, identity?.phone, identity?.location].filter(Boolean).join(' • ')}
        </Text>
        {lines.length ? lines.map((ln, i) => <Text key={i} style={s.para}>{ln}</Text>) : <Text>(No cover letter)</Text>}
      </Page>
    </Document>
  );
}
