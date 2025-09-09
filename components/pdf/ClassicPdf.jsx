import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, H, Bullet, Job, TYPE } from './shared'

export default function ClassicPdf({ data = {}, accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const links = Array.isArray(data.links) ? data.links : []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const exp = Array.isArray(data.experience) ? data.experience : []
  const edu = Array.isArray(data.education) ? data.education : []
  const certs = Array.isArray(data.certifications) ? data.certifications : []
  const fmt = s => (s ? String(s).replace(/-/g, '–') : '')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={{ fontSize: TYPE.name, fontWeight: 700, textAlign: 'center' }}>{data.name}</Text>
          {(data.title || data.location) && (
            <Text style={styles.meta}>{[data.title, data.location].filter(Boolean).join(' • ')}</Text>
          )}
          {(data.email || data.phone || links.length) && (
            <Text style={styles.meta}>{[data.email, data.phone, ...links.map(l => l?.url).filter(Boolean)].join(' · ')}</Text>
          )}
          <View style={styles.hr} />
        </View>

        {data.summary && (
          <View style={styles.section} wrap={false}>
            <H>Profile</H>
            <Text style={styles.p}>{data.summary}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <H>Skills</H>
            {skills.map((s, i) => (
              <Bullet key={`${s}-${i}`}>{s}</Bullet>
            ))}
          </View>
        )}

        {exp.length > 0 && (
          <View style={styles.section}>
            <H>Experience</H>
            {exp.map((x, i) => (
              <Job
                key={`${x.company}-${x.role}-${x.start}-${x.end}-${i}`}
                company={x.company}
                title={x.role}
                start={fmt(x.start)}
                end={x.end == null ? 'Present' : fmt(x.end)}
              >
                {Array.isArray(x.bullets) &&
                  x.bullets.map((b, j) => (
                    <Bullet key={`${x.company}-${x.role}-${x.start}-${x.end}-${j}`}>{b}</Bullet>
                  ))}
              </Job>
            ))}
          </View>
        )}

        {edu.length > 0 && (
          <View style={styles.section}>
            <H>Education</H>
            {edu.map((e, i) => (
              <Job
                key={`${e.school}-${e.degree}-${e.start}-${e.end}-${i}`}
                company={e.school}
                title={[e.degree, e.grade].filter(Boolean).join(' — ')}
                start={fmt(e.start)}
                end={fmt(e.end)}
              >
                {Array.isArray(e.bullets) &&
                  e.bullets.map((b, j) => (
                    <Bullet key={`${e.school}-${e.degree}-${e.start}-${e.end}-${j}`}>{b}</Bullet>
                  ))}
              </Job>
            ))}
          </View>
        )}

        {(certs.length > 0 || links.length > 0) && (
          <View style={styles.section}>
            {certs.length > 0 && (
              <View wrap={false} style={{ marginBottom: 6 }}>
                <H>Certifications</H>
                {certs.map((c, i) => (
                  <Text key={`${c}-${i}`} style={styles.p}>{c}</Text>
                ))}
              </View>
            )}
            {links.length > 0 && (
              <View wrap={false}>
                <H>Links</H>
                {links.map((l, i) => (
                  <Text key={`${l.url}-${i}`} style={styles.p}>{l.url}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}
