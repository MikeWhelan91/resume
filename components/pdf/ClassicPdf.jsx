/*
Validation checklist:
- Switch templates across all five → visual changes are clear; spacing consistent.
- Toggle ATS mode → monochrome, no fills, same content order.
- Long experience items never split mid-item; no duplication at page 2 start.
- Export “Download CV (PDF)” for each template → A4 with correct margins; no clipped content.
- Density control still works (map Density: Compact/Normal/Roomy → reduce/increase spacing scale by ±10–15%).
*/
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { densityMap } from '../../lib/resumeConfig';
import { getTheme, styles, Section, H, Meta, Chip, Row } from './shared';

export default function ClassicPdf({ data = {}, accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const theme = getTheme(accent);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight, color: atsMode ? '#000' : '#000' };
  const gap = density === 'compact' ? 8 : density === 'cozy' ? 16 : 12;
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];
  const certs = Array.isArray(data.certifications) ? data.certifications : [];
  const fmt = (s) => (s ? String(s).replace(/-/g, '–') : '');

  return (
    <Document>
      <Page size="A4" style={pageStyle} wrap>
        <Section style={{ marginBottom: gap }}>
          <Text style={styles.h1}>{data.name}</Text>
          {(data.title || data.location) && (
            <Meta>{[data.title, data.location].filter(Boolean).join(' • ')}</Meta>
          )}
          {(data.email || data.phone || links.length) && (
            <Meta>{[data.email, data.phone, ...links.map((l) => l?.url).filter(Boolean)].join(' · ')}</Meta>
          )}
          <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ marginTop: 6 }} />
        </Section>

        {data.summary && (
          <Section style={{ marginBottom: gap }} wrap={false}>
            <H style={{ color: atsMode ? '#000' : theme.accent }}>Profile</H>
            <Text>{data.summary}</Text>
          </Section>
        )}

        {skills.length > 0 && (
          <Section style={{ marginBottom: gap }} wrap={false}>
            <H style={{ color: atsMode ? '#000' : theme.accent }}>Skills</H>
            <Row style={{ flexWrap: 'wrap' }}>
              {skills.map((s, i) => (
                <Chip key={`${s}-${i}`} theme={theme} atsMode={atsMode}>{s}</Chip>
              ))}
            </Row>
          </Section>
        )}

        {exp.length > 0 && (
          <Section style={{ marginBottom: gap }}>
            <H style={{ color: atsMode ? '#000' : theme.accent }}>Experience</H>
            {exp.map((x, i) => (
              <View key={`${x.company}-${x.role}-${x.start}-${x.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                {x.company && <Text style={{ fontWeight: 700 }}>{x.company}</Text>}
                {x.role && <Text>{x.role}</Text>}
                {(x.start || x.end != null) && (
                  <Meta>{fmt(x.start)} – {x.end == null ? 'Present' : fmt(x.end)}</Meta>
                )}
                {x.location && <Meta>{x.location}</Meta>}
                {Array.isArray(x.bullets) && x.bullets.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    {x.bullets.map((b, j) => (
                      <Text key={j}>• {b}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </Section>
        )}

        {edu.length > 0 && (
          <Section style={{ marginBottom: gap }}>
            <H style={{ color: atsMode ? '#000' : theme.accent }}>Education</H>
            {edu.map((e, i) => (
              <View key={`${e.school}-${e.degree}-${e.start}-${e.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                {e.school && <Text style={{ fontWeight: 700 }}>{e.school}</Text>}
                {(e.degree || e.grade) && <Text>{[e.degree, e.grade].filter(Boolean).join(' — ')}</Text>}
                {(e.start || e.end) && <Meta>{fmt(e.start)} – {fmt(e.end)}</Meta>}
              </View>
            ))}
          </Section>
        )}

        {(certs.length > 0 || links.length > 0) && (
          <Section style={{ marginBottom: gap }}>
            {certs.length > 0 && (
              <View wrap={false} style={{ marginBottom: gap/2 }}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Certifications</H>
                {certs.map((c, i) => (
                  <Text key={`${c}-${i}`}>{c}</Text>
                ))}
              </View>
            )}
            {links.length > 0 && (
              <View wrap={false}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Links</H>
                {links.map((l, i) => (
                  <Text key={`${l.url}-${i}`}>{l.url}</Text>
                ))}
              </View>
            )}
          </Section>
        )}
      </Page>
    </Document>
  );
}

