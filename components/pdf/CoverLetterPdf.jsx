/*
Validation checklist:
- Switch templates across all five → visual changes are clear; spacing consistent.
- Toggle ATS mode → monochrome, no fills, same content order.
- Long experience items never split mid-item; no duplication at page 2 start.
- Export “Download CV (PDF)” for each template → A4 with correct margins; no clipped content.
- Density control still works (map Density: Compact/Normal/Roomy → reduce/increase spacing scale by ±10–15%).
*/
import { Document, Page, Text } from '@react-pdf/renderer';
import { densityMap } from '../../lib/resumeConfig';
import { getTheme, styles } from './shared';

export default function CoverLetterPdf({ text = '', accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const theme = getTheme(accent);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight, color: '#000' };
  const lines = String(text).split(/\n+/).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={pageStyle} wrap>
        {lines.map((line, i) => (
          <Text key={i} style={{ marginBottom: 8 }}>{line}</Text>
        ))}
      </Page>
    </Document>
  );
}

