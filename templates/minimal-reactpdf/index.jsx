import React from 'react'
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
Font.registerHyphenationCallback(w => [w])
const s = StyleSheet.create({
  page: { paddingTop: 18, paddingBottom: 18, paddingHorizontal: 16 },
  h1: { fontSize: 20, marginBottom: 6 },
  meta: { fontSize: 9, color:'#475569', marginBottom: 6 },
  h2: { fontSize: 11, marginTop: 12, marginBottom: 6, letterSpacing:.5, fontWeight:700 },
  p: { fontSize: 10, lineHeight: 1.35 },
  row: { marginBottom: 6 },
  bold: { fontWeight: 700 },
  ul: { marginLeft: 6 },
  li: { fontSize: 10, lineHeight: 1.35, marginBottom: 2, flexDirection:'row' },
  dot: { width: 10, textAlign: 'center' },
  text: { flex: 1 }
})
export function DocumentFor({ model }){
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{model.name}</Text>
        <Text style={s.meta}>{[model.label, model.email, model.phone, model.url].filter(Boolean).join(' • ')}</Text>

        <Text style={s.h2}>PROFILE</Text>
        <Text style={s.p}>{model.summary}</Text>

        <Text style={s.h2}>EXPERIENCE</Text>
        {model.experience.map((j, i) => (
          <View key={`${j.company}-${j.title}-${j.start}-${j.end}-${i}`} wrap={false} style={s.row}>
            <Text><Text style={s.bold}>{j.company}</Text> • <Text style={s.bold}>{j.title}</Text>
              <Text>  </Text><Text style={s.meta}>{j.start} — {j.end}</Text></Text>
            <View style={s.ul}>
              {j.bullets.map((b, k) => (
                <View key={k} style={s.li}><Text style={s.dot}>•</Text><Text style={s.text}>{b}</Text></View>
              ))}
            </View>
          </View>
        ))}

        <Text style={s.h2}>EDUCATION</Text>
        {model.education.map((e, i) => (
          <View key={`${e.institution}-${e.area}-${i}`} wrap={false} style={s.row}>
            <Text><Text style={s.bold}>{e.institution}</Text> • <Text style={s.bold}>{e.area}</Text>
              <Text>  </Text><Text style={s.meta}>{e.start} — {e.end}</Text></Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
export default DocumentFor
