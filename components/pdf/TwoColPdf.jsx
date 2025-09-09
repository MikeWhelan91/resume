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
import { getTheme, styles, Section, H, Meta, Chip, Row, Col } from './shared';

export default function TwoColPdf({ data = {}, accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const theme = getTheme(accent);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight, color: '#000' };
  const gap = density === 'compact' ? 8 : density === 'cozy' ? 16 : 12;
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const tech = Array.isArray(data.tech) ? data.tech : Array.isArray(data.technologies) ? data.technologies : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];
  const fmt = (s) => (s ? String(s).replace(/-/g, '–') : '');

  return (
    <Document>
      <Page size="A4" style={pageStyle} wrap>
        <Row style={{ gap: 16 }}>
          <Col style={{ width: '32%' }}>
            {data.summary && (
              <Section wrap={false} style={{ marginBottom: gap }}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Profile</H>
                <Text>{data.summary}</Text>
              </Section>
            )}
            {skills.length > 0 && (
              <Section wrap={false} style={{ marginBottom: gap }}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Skills</H>
                <Row style={{ flexWrap: 'wrap' }}>
                  {skills.map((s, i) => (
                    <Chip key={`${s}-${i}`} theme={theme} atsMode={atsMode}>{s}</Chip>
                  ))}
                </Row>
              </Section>
            )}
            {links.length > 0 && (
              <Section wrap={false} style={{ marginBottom: gap }}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Links</H>
                {links.map((l, i) => (
                  <Text key={`${l.url}-${i}`}>{l.url}</Text>
                ))}
              </Section>
            )}
            {tech.length > 0 && (
              <Section wrap={false}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Tech</H>
                {tech.map((t, i) => (
                  <Text key={`${t}-${i}`}>{t}</Text>
                ))}
              </Section>
            )}
          </Col>

          <Col style={{ width: '68%' }}>
            {exp.length > 0 && (
              <Section style={{ marginBottom: gap }}>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Experience</H>
                {exp.map((x, i) => (
                  <View key={`${x.company}-${x.role}-${x.start}-${x.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: 700 }}>{x.company}{x.role ? ` – ${x.role}` : ''}</Text>
                      {(x.start || x.end != null) && (
                        <Meta>{fmt(x.start)} – {x.end == null ? 'Present' : fmt(x.end)}</Meta>
                      )}
                    </Row>
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
              <Section>
                <H style={{ color: atsMode ? '#000' : theme.accent }}>Education</H>
                {edu.map((e, i) => (
                  <View key={`${e.school}-${e.degree}-${e.start}-${e.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: 700 }}>{e.school}</Text>
                      {(e.start || e.end) && <Meta>{fmt(e.start)} – {fmt(e.end)}</Meta>}
                    </Row>
                    {(e.degree || e.grade) && <Text>{[e.degree, e.grade].filter(Boolean).join(' — ')}</Text>}
                  </View>
                ))}
              </Section>
            )}
          </Col>
        </Row>
      </Page>
    </Document>
  );
}

