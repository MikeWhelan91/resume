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

export default function CenteredPdf({ data = {}, accent = '#00C9A7', density = 'normal', atsMode = false }) {
  const theme = getTheme(accent);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const pageStyle = { ...styles.page, fontSize: parseFloat(fontSize), lineHeight, textAlign: 'center', color: '#000' };
  const gap = density === 'compact' ? 8 : density === 'cozy' ? 16 : 12;
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];
  const fmt = (s) => (s ? String(s).replace(/-/g, '–') : '');

  return (
    <Document>
      <Page size="A4" style={pageStyle} wrap>
        <Section style={{ marginBottom: gap }}>
          <Text style={styles.h1}>{data.name}</Text>
          {(data.email || data.phone || links.length) && (
            <Meta>{[data.email, data.phone, ...links.map((l) => l?.url).filter(Boolean)].join(' · ')}</Meta>
          )}
          <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ marginTop: 6, marginBottom: 0 }} />
        </Section>

        {data.summary && (
          <Section wrap={false} style={{ marginBottom: gap }}>
            <H style={{ color: atsMode ? '#000' : theme.accent, textAlign: 'center' }}>Profile</H>
            <View style={{ marginTop: 2, marginBottom: 4, alignItems: 'center' }}>
              <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ width: 40 }} />
            </View>
            <Text>{data.summary}</Text>
          </Section>
        )}

        {skills.length > 0 && (
          <Section wrap={false} style={{ marginBottom: gap }}>
            <H style={{ color: atsMode ? '#000' : theme.accent, textAlign: 'center' }}>Skills</H>
            <View style={{ marginTop: 2, marginBottom: 4, alignItems: 'center' }}>
              <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ width: 40 }} />
            </View>
            <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {skills.map((s, i) => (
                <Chip key={`${s}-${i}`} theme={theme} atsMode={atsMode}>{s}</Chip>
              ))}
            </Row>
          </Section>
        )}

        {exp.length > 0 && (
          <Section style={{ marginBottom: gap }}>
            <H style={{ color: atsMode ? '#000' : theme.accent, textAlign: 'center' }}>Experience</H>
            <View style={{ marginTop: 2, marginBottom: 4, alignItems: 'center' }}>
              <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ width: 40 }} />
            </View>
            {exp.map((x, i) => (
              <View key={`${x.company}-${x.role}-${x.start}-${x.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                {x.company && <Text style={{ fontWeight: 700 }}>{x.company}</Text>}
                {x.role && <Text>{x.role}</Text>}
                {(x.start || x.end != null) && (
                  <Meta>{fmt(x.start)} – {x.end == null ? 'Present' : fmt(x.end)}</Meta>
                )}
                {x.location && <Meta>{x.location}</Meta>}
                {Array.isArray(x.bullets) && x.bullets.length > 0 && (
                  <View style={{ marginTop: 4, textAlign: 'left' }}>
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
            <H style={{ color: atsMode ? '#000' : theme.accent, textAlign: 'center' }}>Education</H>
            <View style={{ marginTop: 2, marginBottom: 4, alignItems: 'center' }}>
              <styles.Rule color={atsMode ? '#000' : theme.accent} style={{ width: 40 }} />
            </View>
            {edu.map((e, i) => (
              <View key={`${e.school}-${e.degree}-${e.start}-${e.end}-${i}`} wrap={false} style={{ marginBottom: gap/2 }}>
                {e.school && <Text style={{ fontWeight: 700 }}>{e.school}</Text>}
                {(e.degree || e.grade) && <Text>{[e.degree, e.grade].filter(Boolean).join(' — ')}</Text>}
                {(e.start || e.end) && <Meta>{fmt(e.start)} – {fmt(e.end)}</Meta>}
              </View>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}

