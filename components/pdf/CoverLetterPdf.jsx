import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerInter } from './fonts';
import { makeTheme } from './theme';

function stylesFor(t) {
  return StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: t.base, lineHeight: t.lh, padding: t.margin, color: t.text },
    name: { fontSize: t.h1, fontWeight: 700, marginBottom: 8, color: t.accent },
    meta: { color: t.meta, marginBottom: 12 },
    p: { marginBottom: 8 },
    sign: { fontWeight: 700, marginTop: 8 },
  });
}

export default function CoverLetterPdf({ text, identity, layout='normal', accent='#2563eb', ats=false }) {
  registerInter();
  const t = makeTheme(layout, accent, ats);
  const s = stylesFor(t);
  const lines = String(text || '').split(/\n+/).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {identity?.name ? <Text style={s.name}>{String(identity.name)}</Text> : null}
        <Text style={s.meta}>
          {[identity?.email, identity?.phone, identity?.location].filter(Boolean).join(' • ')}
        </Text>
        {lines.length ? lines.map((ln, i) => <Text key={i} style={s.p}>{ln}</Text>) : <Text>(No cover letter)</Text>}
        {identity?.name ? <Text style={s.sign}>{String(identity.name)}</Text> : null}
      </Page>
    </Document>
  );
}
