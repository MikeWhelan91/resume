import React from "react";
import { Page, Text, Document, StyleSheet } from "@react-pdf/renderer";
import "./registerFonts";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36, paddingBottom: 36, paddingHorizontal: 36,
    fontSize: 11, lineHeight: 1.6, fontFamily: "InterPDF",
  },
  h1:   { fontFamily: "InterPDF", fontSize: 16, fontWeight: 700, marginBottom: 12 },
  para: { fontFamily: "InterPDF", fontWeight: 400, marginBottom: 10 },
  sign: { fontFamily: "InterPDF", fontWeight: 700, marginTop: 18 },
});


export default function CoverLetterPdf({ text }) {
  const body = String(text || "");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {body.split(/\n+/).map((line, i) => (
          <Text key={i} style={{ marginBottom: 6 }}>{line}</Text>
        ))}
      </Page>
    </Document>
  );
}
