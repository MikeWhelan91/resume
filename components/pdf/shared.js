import { Font, StyleSheet, View, Text } from '@react-pdf/renderer'

// Disable auto-hyphenation globally: prevents "ware- houses", "environ- ment"
Font.registerHyphenationCallback(word => [word])

// Typographic scale (pt). Recruiter-safe, ATS-friendly.
export const TYPE = {
  name: 18,
  section: 11,
  body: 10,
  meta: 9
}

// Base styles used by all templates
export const styles = StyleSheet.create({
  page: { paddingTop: 18, paddingBottom: 18, paddingHorizontal: 16 },
  section: { marginTop: 10, marginBottom: 6 },
  sectionTitle: { fontSize: TYPE.section, letterSpacing: 0.8, fontWeight: 700, textAlign: 'left', marginBottom: 6 },
  p: { fontSize: TYPE.body, lineHeight: 1.35, textAlign: 'left' },      // never center, never justify
  meta: { fontSize: TYPE.meta, color: '#475569', textAlign: 'left' },
  hr: { height: 1, backgroundColor: '#E5E7EB', marginTop: 6, marginBottom: 6 },

  // Role row: Company • Title .............. Dates (right-aligned)
  roleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 },
  company: { fontSize: TYPE.body, fontWeight: 700 },
  title:   { fontSize: TYPE.body, fontWeight: 700 },
  dot:     { fontSize: TYPE.body, fontWeight: 400 },
  spacer:  { flexGrow: 1 },
  dates:   { fontSize: TYPE.meta, color: '#334155', textAlign: 'right' },

  // Bullet with hanging indent
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  bullet: { width: 10, textAlign: 'center', fontSize: TYPE.body, lineHeight: 1.35 },
  bulletText: { flex: 1, fontSize: TYPE.body, lineHeight: 1.35, textAlign: 'left' }
})

// Helpers
export const H = ({ children }) => (
  <View style={styles.section}><Text style={styles.sectionTitle}>{children}</Text><View style={styles.hr}/></View>
)

export const Bullet = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
)

// Reusable Job block (no page split inside a job)
export const Job = ({ company, title, start, end, children }) => (
  <View wrap={false} style={{ marginBottom: 6 }}>
    <View style={styles.roleRow}>
      <Text style={styles.company}>{company}</Text>
      <Text style={styles.dot}> • </Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
      <Text style={styles.dates}>{start} — {end}</Text>
    </View>
    {children}
  </View>
)
