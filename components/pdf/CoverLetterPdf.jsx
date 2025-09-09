import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles, H } from './shared'

export default function CoverLetterPdf({ text = '', accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const lines = String(text).split(/\n+/).filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <H>Cover Letter</H>
        </View>
        {lines.map((line, i) => (
          <Text key={i} style={[styles.p, i === lines.length - 1 ? { fontWeight: 700 } : null]}>{line}</Text>
        ))}
      </Page>
    </Document>
  )
}
