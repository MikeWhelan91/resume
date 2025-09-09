import React from "react";
import { Page, Text, Document, StyleSheet } from "@react-pdf/renderer";
import "./registerFonts";

const styles = StyleSheet.create({
  page: { fontFamily: "InterRegular", fontSize: 11, lineHeight: 1.6, padding: 72 },
  h1:   { fontFamily: "InterBold", fontWeight: 700, fontSize: 16, marginBottom: 12 },
  para: { fontFamily: "InterRegular", marginBottom: 10 },
  sign: { fontFamily: "InterBold", fontWeight: 700, marginTop: 18 },
});


export default function CoverLetterPdf({ text }) {
  const body = String(text || "");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {body.split(/\n+/).map((line, i) => (
          <Text key={`${line}-${i}`} style={styles.para}>{line}</Text>
        ))}
      </Page>
    </Document>
  );
}
