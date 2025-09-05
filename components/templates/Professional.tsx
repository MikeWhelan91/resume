import { Resume } from '../../lib/schema/resume';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '../pdf/registerFonts';

export function renderHtml(resume: Resume) {
  return (
    <div className="p-4 font-sans text-gray-900 grid grid-cols-3 gap-4">
      <div className="col-span-1 bg-gray-50 p-2">
        <h2 className="font-bold">Contact</h2>
        <p>{resume.basics.email}</p>
      </div>
      <div className="col-span-2">
        <h1 className="text-2xl font-bold">{resume.basics.name}</h1>
        {resume.work.length > 0 && (
          <section className="mt-4">
            <h2 className="font-bold">Work</h2>
            {resume.work.map((w, i) => (
              <div key={i} className="mt-2">
                <div className="font-medium">{w.role} - {w.company}</div>
                <ul className="list-disc ml-4">
                  {w.highlights.map((h, j) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export function renderPdf(resume: Resume) {
  const styles = StyleSheet.create({
    page: { padding: 32, fontFamily: 'InterRegular', fontSize: 12, flexDirection: 'row', color: '#111827' },
    sidebar: { width: '30%', paddingRight: 16 },
    main: { width: '70%' },
    name: { fontSize: 20, fontFamily: 'InterBold' },
    section: { marginTop: 12 },
    heading: { fontFamily: 'InterBold', marginBottom: 4 },
    list: { marginLeft: 12 },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          <Text style={styles.heading}>Contact</Text>
          <Text>{resume.basics.email}</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.name}>{resume.basics.name}</Text>
          {resume.work.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Work</Text>
              {resume.work.map((w, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                  <Text>{w.role} - {w.company}</Text>
                  {w.highlights.map((h, j) => (
                    <Text key={j} style={styles.list}>• {h}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
