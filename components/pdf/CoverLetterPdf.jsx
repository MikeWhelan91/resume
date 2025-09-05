import React from "react";
import { Page, Text, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 28, fontSize: 12, fontFamily: "Helvetica", lineHeight: 1.6 }
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
