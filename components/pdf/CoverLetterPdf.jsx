import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import { densityMap } from '../../lib/resumeConfig';
import './registerFonts';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'InterRegular',
  },
  paragraph: { marginBottom: 8 },
});

export default function CoverLetterPdf({ text = '', accent = '#000', density = 'normal', atsMode = false }) {
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight, color: atsMode ? '#000000' : '#374151' };
  const lines = String(text).split(/\n+/).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={pageStyle} wrap>
        {lines.map((line, i) => (
          <Text key={i} style={styles.paragraph}>{line}</Text>
        ))}
      </Page>
    </Document>
  );
}

