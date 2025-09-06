import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import "./registerFonts";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 11,
    lineHeight: 1.4,
    fontFamily: "InterRegular",
  },
  header: { alignItems: "center", textAlign: "center" },
  h1: { fontFamily: "InterBold", fontWeight: 700, fontSize: 20, marginBottom: 6 },
  h2: {
    fontFamily: "InterSemiBold",
    fontWeight: 600,
    fontSize: 12,
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  muted: { color: "#64748b" },
  row: { flexDirection: "row", alignItems: "baseline" },
  right: { marginLeft: "auto", color: "#64748b" }, // legacy
  pillWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6, justifyContent: "center" },
  pill: {
    fontFamily: "InterMedium",
    fontWeight: 500,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 10,
  },
  rule: { borderTopWidth: 1, borderTopColor: "#e2e8f0", marginVertical: 10, width: "96%" },
  ul: { marginTop: 4, marginLeft: 10 },
  li: { marginBottom: 4 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  linkText: { color: "#1a73e8", marginRight: 8 },
});

function Header({ data }) {
  const meta = [data.title, data.location].filter(Boolean).join(" • ");
  const contacts = [
    data.email,
    data.phone,
    ...(Array.isArray(data.links) ? data.links.map((l) => l.url) : []),
  ].filter(Boolean);
  return (
    <View style={styles.header}>
      <Text style={styles.h1}>{data.name || "Candidate"}</Text>
      {meta ? <Text style={styles.muted}>{meta}</Text> : null}
      {contacts.length ? (
        <View style={styles.linkRow}>
          {contacts.map((c, i) =>
            c.startsWith("http") ? (
              <Link key={i} src={c} style={styles.linkText}>
                {c}
              </Link>
            ) : (
              <Text key={i} style={{ marginRight: 8 }}>
                {c}
              </Text>
            )
          )}
        </View>
      ) : null}
      <View style={styles.rule} />
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.h2}>{children}</Text>;
}

function Skills({ data }) {
  if (!Array.isArray(data.skills) || !data.skills.length) return null;
  return (
    <View>
      <SectionTitle>Skills</SectionTitle>
      <View style={styles.pillWrap}>
        {data.skills.map((s, i) => (
          <Text key={i} style={styles.pill}>
            {String(s)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Experience({ data }) {
  const xp = Array.isArray(data.experience) ? data.experience : [];
  if (!xp.length) return null;
  return (
    <View>
      <SectionTitle>Experience</SectionTitle>
      {xp.map((x, i) => {
        const dates = [x.start, x.end || "Present"].filter(Boolean).join(" – ");
        return (
          <View key={i} wrap={false}>
            {x.company ? (
              <Text style={{ fontFamily: "InterBold", fontWeight: 700 }}>{x.company}</Text>
            ) : null}
            {x.role ? <Text>{x.role}</Text> : null}
            {dates ? <Text style={{ color: "#64748b" }}>{dates}</Text> : null}


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

function Education({ data }) {
  const ed = Array.isArray(data.education) ? data.education : [];
  if (!ed.length) return null;
  return (
    <View>
      <SectionTitle>Education</SectionTitle>
      {ed.map((e, i) => {
        const dates = [e.start, e.end].filter(Boolean).join(" – ");
        const detail = [e.degree, e.grade].filter(Boolean).join(" • ");
        return (
          <View key={i} wrap={false} style={{ marginBottom: 4 }}>
            {e.school ? (
              <Text style={{ fontFamily: "InterBold", fontWeight: 700 }}>{e.school}</Text>
            ) : null}
            {detail ? <Text>{detail}</Text> : null}
            {dates ? <Text style={{ color: "#64748b" }}>{dates}</Text> : null}

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
      <SectionTitle>Profile</SectionTitle>
      <Text>{String(data.summary)}</Text>
    </View>
  );
}

export default function CenteredPdf({ data }) {
  const safe = data || {};
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header data={safe} />
        <Summary data={safe} />
        <Skills data={safe} />
        <Experience data={safe} />
        <Education data={safe} />
      </Page>
    </Document>
  );
}

