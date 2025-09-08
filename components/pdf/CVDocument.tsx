import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica' }, // 0.5" margins (72pt = 1")
  h1: { fontSize: 14, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  p: { fontSize: 10, lineHeight: 1.35 },
  section: { marginBottom: 10 },
  row: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontFamily: 'Helvetica-Bold' }
})

export type CVData = {
  name: string
  title?: string
  contact?: string
  summary?: string
  experience?: Array<{ company: string; role: string; dates: string; bullets: string[] }>
  skills?: string[]
  education?: Array<{ school: string; award: string; dates: string }>
}

export default function CVDocument({ data }: { data: CVData }) {
  return (
    <Document title={`${data.name} — CV`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.section}>
          <Text style={styles.h1}>{data.name}</Text>
          {data.title ? <Text style={styles.p}>{data.title}</Text> : null}
          {data.contact ? <Text style={styles.p}>{data.contact}</Text> : null}
        </View>

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.h1}>Summary</Text>
            <Text style={styles.p}>{data.summary}</Text>
          </View>
        ) : null}

        {data.experience?.length ? (
          <View style={styles.section}>
            <Text style={styles.h1}>Experience</Text>
            {data.experience.map((x, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.row}>
                  <Text style={[styles.p, styles.bold]}>{x.role}</Text>
                  <Text style={styles.p}>{x.dates}</Text>
                </View>
                <Text style={styles.p}>{x.company}</Text>
                {x.bullets.map((b, j) => (
                  <Text key={j} style={styles.p}>• {b}</Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.skills?.length ? (
          <View style={styles.section}>
            <Text style={styles.h1}>Skills</Text>
            <Text style={styles.p}>{data.skills.join(' · ')}</Text>
          </View>
        ) : null}

        {data.education?.length ? (
          <View style={styles.section}>
            <Text style={styles.h1}>Education</Text>
            {data.education.map((e, i) => (
              <Text key={i} style={styles.p}>{e.award} — {e.school} ({e.dates})</Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
