import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./registerFonts";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 11,
    lineHeight: 1.4,
    fontFamily: "InterPDF",
  },
  grid: { flexDirection: "row" },
  sidebar: { width: 180 },
  main: {
    flex: 1,
    marginLeft: 18,
    paddingLeft: 18,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  h1: { fontFamily: "InterPDF", fontSize: 20, fontWeight: 700, marginBottom: 4 },
  h2: { fontFamily: "InterPDF", fontSize: 12, fontWeight: 600, marginTop: 14, marginBottom: 6, textTransform: "uppercase" },
  muted: { color: "#64748b" },
  pill: {
    fontFamily: "InterPDF",
    fontWeight: 500,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
    fontSize: 10,
  },
  row: { flexDirection: "row", alignItems: "baseline" },
  ul: { marginTop: 4, marginLeft: 10 },
  li: { marginBottom: 4 },
});

function Header({ data }) {
  const meta = [data.title, data.location].filter(Boolean).join(" • ");
  const contacts = [
    data.email,
    data.phone,
    ...(Array.isArray(data.links) ? data.links.map((l) => l.url) : []),
  ].filter(Boolean).join(" · ");
  return (
    <View>
      <Text style={styles.h1}>{data.name || "Candidate"}</Text>
      {meta ? <Text style={[styles.muted, { marginBottom: 8 }]}>{meta}</Text> : null}
      {contacts ? <Text style={[styles.muted, { marginBottom: 8 }]}>{contacts}</Text> : null}
    </View>
  );
}

function Skills({ data }) {
  if (!Array.isArray(data.skills) || !data.skills.length) return null;
  return (
    <View>
      <Text style={[styles.h2, { marginTop: 0 }]}>Skills</Text>
      {data.skills.map((s, i) => (
        <Text key={i} style={styles.pill}>
          {String(s)}
        </Text>
      ))}
    </View>
  );
}

function Education({ data }) {
  const ed = Array.isArray(data.education) ? data.education : [];
  if (!ed.length) return null;
  return (
    <View>
      <Text style={styles.h2}>Education</Text>
      {ed.map((e, i) => {
        const dateRange = [e.start, e.end].filter(Boolean).join(" – ");
        const detail = [e.degree, e.grade, dateRange].filter(Boolean).join(" • ");
        return (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: 700 }}>{e.school}</Text>
            {detail ? <Text style={styles.muted}>{detail}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function Summary({ data }) {
  if (!data.summary) return null;
  return (
    <View>
      <Text style={styles.h2}>Profile</Text>
      <Text>{String(data.summary)}</Text>
    </View>
  );
}

function Experience({ data }) {
  const xp = Array.isArray(data.experience) ? data.experience : [];
  if (!xp.length) return null;
  return (
    <View>
      <Text style={styles.h2}>Experience</Text>
      {xp.map((x, i) => {
        const heading = [x.company, x.role].filter(Boolean).join(" — ");
        const dates = [x.start, x.end || "Present"].filter(Boolean).join(" – ");
        return (
          <View key={i} wrap={false}>
            <View style={styles.row}>
              <Text style={{ fontWeight: 700 }}>{heading}</Text>
              <Text style={{ fontStyle: "italic" }}>{dates}</Text>
            </View>
            <View style={styles.ul}>
              {(Array.isArray(x.bullets) ? x.bullets : []).map((b, j) => (
                <Text key={j} style={styles.li}>
                  • {String(b)}
                </Text>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function SidebarPdf({ data }) {
  const safe = data || {};
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.grid}>
          <View style={styles.sidebar}>
            <Header data={safe} />
            <Skills data={safe} />
            <Education data={safe} />
          </View>
          <View style={styles.main}>
            <Summary data={safe} />
            <Experience data={safe} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

