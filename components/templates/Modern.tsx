import { Resume } from '../../lib/schema/resume';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '../pdf/registerFonts';

export function renderHtml(resume: Resume) {
  return (
    <div className="p-4 font-sans text-gray-900" style={{color: resume.preferences.color}}>
      <h1 className="text-3xl font-bold border-b-4" style={{borderColor: resume.preferences.color}}>{resume.basics.name}</h1>
      {resume.summary && <p className="mt-2">{resume.summary}</p>}
      {resume.projects.length > 0 && (
        <section className="mt-4">
          <h2 className="font-bold">Projects</h2>
          {resume.projects.map((p, i) => (
            <div key={i} className="mt-2">
              <div className="font-medium">{p.name}</div>
              {p.summary && <p>{p.summary}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export function renderPdf(resume: Resume) {
  const color = resume.preferences.color || '#111827';
  const styles = StyleSheet.create({
    page: { padding: 32, fontFamily: 'InterRegular', fontSize: 12, color },
    name: { fontSize: 24, fontFamily: 'InterBold', borderBottomWidth: 4, borderBottomColor: color, paddingBottom: 4 },
    section: { marginTop: 12 },
    heading: { fontFamily: 'InterBold', marginBottom: 4 },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.basics.name}</Text>
        {resume.summary && <Text style={styles.section}>{resume.summary}</Text>}
        {resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text>{p.name}</Text>
                {p.summary && <Text>{p.summary}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
