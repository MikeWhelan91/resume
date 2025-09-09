import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { densityMap } from '../../lib/resumeConfig';
import './registerFonts';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'InterRegular',
  },
  header: { marginBottom: 12, borderBottom: '1 solid #e5e7eb', paddingBottom: 8 },
  name: { fontSize: 18, fontFamily: 'InterSemiBold' },
  muted: { fontSize: 10, color: '#6b7280' },
  section: { marginTop: 12 },
  heading: { fontSize: 12, fontFamily: 'InterSemiBold', marginBottom: 4 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { fontSize: 10, marginRight: 4, marginBottom: 4 },
  experience: { marginBottom: 8 },
  bold: { fontFamily: 'InterSemiBold' },
  bullet: { fontSize: 10, marginLeft: 12 },
});

export default function ResumePdf({ data = {}, accent = '#000', density = 'normal', atsMode = false }) {
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight };
  const headingStyle = { ...styles.heading, color: accent };
  const bodyColor = atsMode ? '#000000' : '#374151';
  const fmt = (s) => (s ? String(s).replace(/-/g, '–') : '');
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];

  return (
    <Document>
      <Page size="A4" style={{ ...pageStyle, color: bodyColor }} wrap>
        <View style={styles.header}>
          {data.name && <Text style={styles.name}>{data.name}</Text>}
          {(data.title || data.location) && (
            <Text style={styles.muted}>{[data.title, data.location].filter(Boolean).join(' • ')}</Text>
          )}
          {(data.email || data.phone || links.length) && (
            <Text style={styles.muted}>{[data.email, data.phone, ...links.map(l => l?.url).filter(Boolean)].join(' · ')}</Text>
          )}
        </View>

        {data.summary && (
          <View style={styles.section} wrap={false}>
            <Text style={headingStyle}>Profile</Text>
            <Text>{data.summary}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={headingStyle}>Skills</Text>
            <View style={styles.pillWrap}>
              {skills.map((s, i) => (
                <Text key={i} style={styles.pill}>{s}</Text>
              ))}
            </View>
          </View>
        )}

        {exp.length > 0 && (
          <View style={styles.section}>
            <Text style={headingStyle}>Experience</Text>
            {exp.map((x, i) => (
              <View key={i} style={styles.experience} wrap={false}>
                {x.company && <Text style={styles.bold}>{x.company}</Text>}
                {x.role && <Text>{x.role}</Text>}
                {(x.start || x.end != null) && (
                  <Text style={styles.muted}>{fmt(x.start)} – {x.end == null ? 'Present' : fmt(x.end)}</Text>
                )}
                {x.location && <Text style={styles.muted}>{x.location}</Text>}
                {Array.isArray(x.bullets) && x.bullets.length > 0 && (
                  <View>
                    {x.bullets.map((b, j) => (
                      <Text key={j} style={styles.bullet}>• {b}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {edu.length > 0 && (
          <View style={styles.section}>
            <Text style={headingStyle}>Education</Text>
            {edu.map((e, i) => (
              <View key={i} wrap={false}>
                {e.school && <Text style={styles.bold}>{e.school}</Text>}
                {(e.degree || e.grade) && (
                  <Text>{[e.degree, e.grade].filter(Boolean).join(' — ')}</Text>
                )}
                {(e.start || e.end) && (
                  <Text style={styles.muted}>{fmt(e.start)} – {fmt(e.end)}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

