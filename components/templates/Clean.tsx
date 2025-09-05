import { Resume } from '../../lib/schema/resume';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '../pdf/registerFonts';

export function renderHtml(resume: Resume) {
  return (
    <div className="p-4 font-sans text-gray-900">
      <h1 className="text-2xl font-bold">{resume.basics.name}</h1>
      {resume.summary && <p className="mt-2">{resume.summary}</p>}
      <section className="mt-4">
        <h2 className="font-bold">Skills</h2>
        <ul className="list-disc ml-4">
          {resume.skills.map((s, i) => (
            <li key={i}>{s.name}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function renderPdf(resume: Resume) {
  const styles = StyleSheet.create({
    page: { padding: 32, fontFamily: 'InterRegular', fontSize: 12, color: '#111827' },
    name: { fontSize: 20, fontFamily: 'InterBold' },
    section: { marginTop: 12 },
    heading: { fontFamily: 'InterBold', marginBottom: 4 },
    list: { marginLeft: 12 },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.basics.name}</Text>
        {resume.summary && <Text style={styles.section}>{resume.summary}</Text>}
        {resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            {resume.skills.map((s, i) => (
              <Text key={i} style={styles.list}>• {s.name}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
