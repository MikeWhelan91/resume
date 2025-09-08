'use client'

import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import CVDocument, { type CVData } from '../components/pdf/CVDocument'
import CoverLetterDocument, { type CoverLetterData } from '../components/pdf/CoverLetterDocument'

export default function Results() {
  const [payload, setPayload] = useState<any>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('resumeResult') || 'null')
      setPayload(saved)
    } catch {}
  }, [])

  const cvData: CVData | undefined = useMemo(() => {
    const rd = payload?.resumeData
    if (!rd) return undefined
    return {
      name: rd.name || '',
      title: rd.title,
      contact: [rd.email, rd.phone, rd.location].filter(Boolean).join(' · '),
      summary: rd.summary,
      experience: (rd.experience || []).map((e: any) => ({
        company: e.company,
        role: e.role,
        dates: [e.start, e.end].filter(Boolean).join('–'),
        bullets: e.bullets || []
      })),
      skills: rd.skills || [],
      education: (rd.education || []).map((e: any) => ({
        school: e.school,
        award: e.degree,
        dates: [e.start, e.end].filter(Boolean).join('–')
      }))
    }
  }, [payload])

  const clData: CoverLetterData | undefined = useMemo(() => {
    const rd = payload?.resumeData || {}
    if (!payload) return undefined
    return {
      applicantName: rd.name || '',
      address: rd.location,
      date: new Date().toLocaleDateString(),
      body: payload.coverLetter || '',
    }
  }, [payload])

  const cvDoc = useMemo(() => cvData ? <CVDocument data={cvData} /> : null, [cvData])
  const clDoc = useMemo(() => clData ? <CoverLetterDocument data={clData} /> : null, [clData])

  const download = async (name: 'cv' | 'cover-letter') => {
    const instance = name === 'cv' ? cvDoc : clDoc
    if (!instance) return
    const blob = await pdf(instance).toBlob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.pdf`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <Head>
        <title>Preview &amp; Download – TailorCV</title>
        <meta name="description" content="Side-by-side résumé and cover letter previews with matching PDF downloads." />
      </Head>
      <div className="grid grid-cols-[320px_1fr] h-[100dvh]">
        <aside className="border-r p-4 overflow-y-auto space-y-3" data-app-chrome>
          <h2 className="text-lg font-semibold">Controls</h2>
          <button onClick={() => download('cv')} className="px-3 py-2 rounded bg-black text-white">Download CV</button>
          <button onClick={() => download('cover-letter')} className="px-3 py-2 rounded bg-black text-white">Download Cover Letter</button>
        </aside>

        <main className="p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-4 min-w-[900px]">
            <PDFViewer style={{ width: '100%', height: '88vh' }}>
              {cvDoc}
            </PDFViewer>
            <PDFViewer style={{ width: '100%', height: '88vh' }}>
              {clDoc}
            </PDFViewer>
          </div>
        </main>
      </div>
    </>
  )
}
