import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerInter } from './fonts';
import { makeTheme } from './theme';

function stylesFor(t) {
  return StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: t.base, lineHeight: t.lh, padding: t.margin, color: t.text },
    h1: { fontSize: t.h1, fontWeight: 700, marginBottom: 6, color: t.accent },
    h2: { fontSize: t.h2, fontWeight: 700, marginBottom: 6, marginTop: 8, color: t.accent },
    metaRow: { flexDirection: 'row', gap: 6, color: t.meta },
    section: { marginBottom: t.gap },
    bullet: { marginLeft: 10, marginBottom: t.bullet },
    strong: { fontWeight: 700 },
  });
}

export default function ResumePdf({ data, layout='normal', accent='#2563eb', ats=false }) {
  registerInter();
  const t = makeTheme(layout, accent, ats);
  const s = stylesFor(t);
  const skills = Array.isArray(data?.skills) ? data.skills : [];
  const links  = Array.isArray(data?.links)  ? data.links  : [];
  const exp    = Array.isArray(data?.experience) ? data.experience : [];
  const edu    = Array.isArray(data?.education)  ? data.education  : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          {data?.name ? <Text style={s.h1}>{String(data.name)}</Text> : null}
          <View style={s.metaRow}>
            {data?.title && <Text>{String(data.title)}</Text>}
            {data?.location && <Text>• {String(data.location)}</Text>}
            {data?.email && <Text>• {String(data.email)}</Text>}
            {data?.phone && <Text>• {String(data.phone)}</Text>}
          </View>
          {links.length ? (
            <View style={s.metaRow}>
              {links.map((l, i) => <Text key={i}>{String(l?.label || l?.url || '')}</Text>)}
            </View>
          ) : null}
          {data?.summary ? <Text style={{ marginTop: 6 }}>{String(data.summary)}</Text> : null}
        </View>

        {skills.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Skills</Text>
            <Text>{skills.join(' • ')}</Text>
          </View>
        ) : null}

        {exp.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Experience</Text>
            {exp.map((e, i) => (
              <View key={i} style={{ marginBottom: t.gap - 2 }}>
                <Text style={s.strong}>
                  {[e.role, e.company].filter(Boolean).join(' • ')}
                </Text>
                <Text style={{ color: t.meta, marginBottom: 2 }}>
                  {[e.start, e.end].filter(Boolean).join(' – ')}
                  {e.location ? ` • ${e.location}` : ''}
                </Text>
                {(Array.isArray(e.bullets) ? e.bullets : []).map((b, j) => (
                  <Text key={j} style={s.bullet}>• {String(b)}</Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {edu.length ? (
          <View style={s.section}>
            <Text style={s.h2}>Education</Text>
            {edu.map((e, i) => (
              <View key={i} style={{ marginBottom: t.bullet }}>
                <Text style={s.strong}>
                  {[e.degree, e.school].filter(Boolean).join(' • ')}
                </Text>
                <Text style={{ color: t.meta }}>
                  {[e.start, e.end].filter(Boolean).join(' – ')}
                  {e.grade ? ` • ${e.grade}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
