import React from "react";
import { Page, Text, Document, StyleSheet } from "@react-pdf/renderer";
import "./registerFonts";

const layoutMap = {
  normal: { fontSize: 11, lineHeight: 1.6 },
  cosy:   { fontSize: 12, lineHeight: 1.7 },
  compact:{ fontSize: 10, lineHeight: 1.5 },
};

export default function CoverLetterPdf({ text, identity, layout = "normal" }) {
  const body = String(text || "");
  const { fontSize, lineHeight } = layoutMap[layout] || layoutMap.normal;
  const styles = StyleSheet.create({
    page: { fontFamily: "InterRegular", fontSize, lineHeight, padding: 48 },
    h1:   { fontFamily: "InterBold", fontWeight: 700, fontSize: 16, marginBottom: 12 },
    para: { fontFamily: "InterRegular", marginBottom: 10 },
    sign: { fontFamily: "InterBold", fontWeight: 700, marginTop: 18 },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {identity?.name ? <Text style={styles.h1}>{identity.name}</Text> : null}
        {body.split(/\n+/).map((line, i) => (
          <Text key={i} style={styles.para}>{line}</Text>
        ))}
        {identity?.name ? <Text style={styles.sign}>{identity.name}</Text> : null}
      </Page>
    </Document>
  );
}
