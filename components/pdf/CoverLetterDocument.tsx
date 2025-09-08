import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

export type CoverLetterData = {
  applicantName: string
  address?: string
  date?: string
  recipient?: string
  body: string
  signoff?: string // e.g. "Kind regards,"
}

const styles = StyleSheet.create({
  page: { padding: 56, fontFamily: 'Helvetica' },
  h: { fontSize: 12, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  p: { fontSize: 11, lineHeight: 1.5, marginBottom: 8 }
})

export default function CoverLetterDocument({ data }: { data: CoverLetterData }) {
  return (
    <Document title={`${data.applicantName} — Cover Letter`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={{ marginBottom: 12 }}>
          {data.address ? <Text style={styles.p}>{data.address}</Text> : null}
          {data.date ? <Text style={styles.p}>{data.date}</Text> : null}
          {data.recipient ? <Text style={styles.p}>{data.recipient}</Text> : null}
        </View>
        <Text style={styles.p}>{data.body}</Text>
        <View style={{ marginTop: 16 }}>
          <Text style={styles.p}>{data.signoff || 'Sincerely,'}</Text>
          <Text style={styles.p}>{data.applicantName}</Text>
        </View>
      </Page>
    </Document>
  )
}
