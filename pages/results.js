import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import PreviewFrame from '../components/PreviewFrame'
import { listTemplates, getTemplate } from '../templates'
import { renderHtml } from '../lib/renderHtmlTemplate'
import { toTemplateModel } from '../lib/templateModel'

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'] // teal, blue, violet, orange, red, near-black
const DENSITIES = ['Compact','Normal','Relaxed']

export default function ResultsPage() {
  const templates = listTemplates()
  const [tplId, setTplId] = useState(templates[0]?.id)
  const [accent, setAccent] = useState(ACCENTS[0])
  const [density, setDensity] = useState('Normal')
  const [ats, setAts] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('resumeResult') || 'null')
      if (r) setResult(r)
    } catch {}
  }, [])

  if (!result) return null

  const tpl = getTemplate(tplId)
  const appData = { ...result.resumeData, coverLetter: result.coverLetter }
  const model = useMemo(() => toTemplateModel(appData, { ats, density }), [appData, ats, density])

  const cvHtml = useMemo(() => renderHtml({
    html: tpl.html, css: tpl.css, model, options: { mode: 'preview', accent, density, ats }
  }), [tpl, model, accent, density, ats])

  const coverModel = useMemo(() => ({ ...model, isCoverLetter: true }), [model])
  const coverHtml = useMemo(() => renderHtml({
    html: tpl.html, css: tpl.css, model: coverModel, options: { mode: 'preview', accent, density, ats }
  }), [tpl, coverModel, accent, density, ats])

  return (
    <>
      <Head>
        <title>Results – Tailored CV & Cover Letter | TailorCV</title>
        <meta
          name="description"
          content="Preview and download your tailored CV and cover letter with unified HTML A4 templates."
        />
      </Head>
      <div className="ResultsLayout">
        <aside className="ResultsSidebar">
          <div className="Group">
            <h3>Theme</h3>
            <select className="Select" value={tplId} onChange={e => setTplId(e.target.value)}>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="Group">
            <h3>Color</h3>
            <div className="Row">
              {ACCENTS.map(c => (
                <button key={c} className="RadioSwatch" style={{background:c, outlineColor: c===accent ? c : 'var(--border)'}} onClick={() => setAccent(c)} aria-label={`Accent ${c}`} />
              ))}
            </div>
          </div>

          <div className="Group">
            <h3>Density</h3>
            <select className="Select" value={density} onChange={e=>setDensity(e.target.value)}>
              {DENSITIES.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="Group">
            <h3>Document</h3>
            <label className="Row" style={{gap:8}}>
              <input type="checkbox" checked={ats} onChange={e=>setAts(e.target.checked)} />
              <span>ATS mode</span>
            </label>
          </div>

          <div className="Group">
            <button className="Button" onClick={() => window.location.href=`/api/pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=${encodeURIComponent(density)}&ats=${ats?'1':'0'}`}>Download CV (PDF)</button>
            <div style={{height:'10px'}}></div>
            <button className="Button secondary" onClick={() => window.location.href=`/api/export-docx?template=${tplId}&ats=${ats?'1':'0'}`}>Download CV (DOCX)</button>
            <div style={{height:'10px'}}></div>
            <button className="Button secondary" onClick={() => window.location.href=`/api/cover-pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=${encodeURIComponent(density)}&ats=${ats?'1':'0'}`}>Download Cover Letter (PDF)</button>
            <div style={{height:'10px'}}></div>
            <button className="Button secondary" onClick={() => window.location.href=`/api/export-cover-letter-docx?template=${tplId}&ats=${ats?'1':'0'}`}>Download Cover Letter (DOCX)</button>
          </div>
        </aside>

        <section className="Previews">
          <div className="PreviewCard"><PreviewFrame className="A4" htmlDoc={cvHtml} /></div>
          <div className="PreviewCard"><PreviewFrame className="A4" htmlDoc={coverHtml} /></div>
        </section>
      </div>
    </>
  )
}
