import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';
import { getTheme } from './theme';

function makeStyles(t) {
  return StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: t.baseFont, lineHeight: t.lineHeight, padding: t.pageMargin },
    h1: { fontSize: t.headingSize, marginBottom: 6, fontWeight: 700 },
    h2: { fontSize: t.subheadingSize, marginBottom: 4, fontWeight: 700 },
    row: { display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'baseline' },
    section: { marginBottom: t.sectionGap },
    bullet: { marginLeft: 10, marginBottom: t.bulletGap },
    meta: { color: '#555' },
  });
}

export default function ResumePdf({ data, layout = 'normal' }) {
  registerPdfFonts();
  const t = getTheme(layout);
  const s = makeStyles(t);
  const exp = Array.isArray(data?.experience) ? data.experience : [];
  const edu = Array.isArray(data?.education) ? data.education : [];
  const skills = Array.isArray(data?.skills) ? data.skills : [];
  const links = Array.isArray(data?.links) ? data.links : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.section}>
          {!!data?.name && <Text style={s.h1}>{String(data.name)}</Text>}
          <View style={s.row}>
            {!!data?.title && <Text>{String(data.title)}</Text>}
            {!!data?.location && <Text style={s.meta}>• {String(data.location)}</Text>}
            {!!data?.email && <Text style={s.meta}>• {String(data.email)}</Text>}
            {!!data?.phone && <Text style={s.meta}>• {String(data.phone)}</Text>}
          </View>
          {links?.length ? (
            <View style={s.row}>
              {links.map((l, i) => <Text key={i} style={s.meta}>{(l?.label || l?.url)}</Text>)}
            </View>
          ) : null}
          {!!data?.summary && <Text style={{ marginTop: 6 }}>{String(data.summary)}</Text>}
        </View>

        {/* Skills */}
        {skills.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Skills</Text>
            <Text>{skills.join(' • ')}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {exp.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Experience</Text>
            {exp.map((e, i) => (
              <View key={i} style={{ marginBottom: t.sectionGap - 2 }}>
                <Text style={{ fontWeight: 700 }}>{[e.role, e.company].filter(Boolean).join(' • ')}</Text>
                <Text style={s.meta}>
                  {[e.start, e.end].filter(Boolean).join(' – ')}{e.location ? ` • ${e.location}` : ''}
                </Text>
                {(Array.isArray(e.bullets) ? e.bullets : []).map((b, j) => (
                  <Text key={j} style={s.bullet}>• {String(b)}</Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {edu.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Education</Text>
            {edu.map((e, i) => (
              <View key={i} style={{ marginBottom: t.bulletGap }}>
                <Text style={{ fontWeight: 700 }}>{[e.degree, e.school].filter(Boolean).join(' • ')}</Text>
                <Text style={s.meta}>
                  {[e.start, e.end].filter(Boolean).join(' – ')}{e.grade ? ` • ${e.grade}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
