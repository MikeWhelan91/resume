import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import PreviewFrame from '../components/PreviewFrame';
import { listTemplates, getTemplate } from '../templates';
import { renderHtml } from '../lib/renderHtmlTemplate';
import { toTemplateModel } from '../lib/templateModel';

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'];
const DENSITIES = ['Compact','Normal','Relaxed'];

function pickDocTemplate(tpl, docType){
  if (docType === 'cover') {
    const src = tpl?.coverHtml ? { html: tpl.coverHtml, css: (tpl.coverCss||'') } 
                               : { html: getTemplate('_cover-default')?.coverHtml, css: getTemplate('_cover-default')?.coverCss || '' };
    return src || { html: '<main><h1>{{name}}</h1><p>{{{coverLetter.bodyHtml}}}</p></main>', css: '' };
  }
  return { html: tpl?.html || '<main></main>', css: tpl?.css || '' };
}

export default function ResultsPage() {
  // Stable templates list
  const templates = useMemo(() => listTemplates(), []);
  const firstTplId = templates[0]?.id || '';

  const [tplId, setTplId]     = useState(firstTplId);
  const [accent, setAccent]   = useState(ACCENTS[0]);
  const [density, setDensity] = useState('Normal');
  const [ats, setAts]         = useState(false);
  const [result, setResult]   = useState(null);

  useEffect(() => { if (!tplId && firstTplId) setTplId(firstTplId); }, [tplId, firstTplId]);

  // Load persisted data; DO NOT early-return before hooks below
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('resumeResult') || 'null');
      if (r) setResult(r);
    } catch {}
  }, []);

  // Null-safe fallbacks so hooks always run
  const resume  = result?.resumeData  ?? {};
  const letter  = result?.coverLetter ?? {};
  const appData = useMemo(() => ({ ...resume, coverLetter: letter }), [resume, letter]);

  const tpl = useMemo(() => getTemplate(tplId) || getTemplate(firstTplId) || {}, [tplId, firstTplId]);

  const model = useMemo(
    () => toTemplateModel(appData, { ats, density }),
    [appData, ats, density]
  );

  // Build two separate documents
  const cvSrc     = useMemo(() => pickDocTemplate(tpl, 'cv'), [tpl]);
  const coverSrc  = useMemo(() => pickDocTemplate(tpl, 'cover'), [tpl]);

  const cvHtml = useMemo(() =>
    renderHtml({ html: cvSrc.html, css: cvSrc.css, model, options: { mode:'preview', accent, density, ats } }),
    [cvSrc, model, accent, density, ats]
  );
  const coverHtml = useMemo(() =>
    renderHtml({ html: coverSrc.html, css: coverSrc.css, model, options: { mode:'preview', accent, density, ats } }),
    [coverSrc, model, accent, density, ats]
  );

  const isLoading = result == null;

  return (
    <>
      <Head><title>Preview</title><meta name="description" content="Preview and download your resume and cover letter side-by-side."/></Head>
      <div className="ResultsLayout">
        <aside className="ResultsSidebar">
          <div className="Group">
            <h3>Layout</h3>
            <select className="Select" value={density} onChange={e => setDensity(e.target.value)}>
              {DENSITIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="Group">
            <h3>Theme</h3>
            <select className="Select" value={tplId} onChange={e => setTplId(e.target.value)}>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="Group">
            <h3>Theme Color</h3>
            <div className="Row">
              {ACCENTS.map(c => (
                <button key={c} className="RadioSwatch" style={{background:c, outlineColor: c===accent ? c : 'var(--border)'}}
                        onClick={() => setAccent(c)} aria-label={`Accent ${c}`} />
              ))}
            </div>
          </div>

          <div className="Group">
            <h3>ATS</h3>
            <label className="Row" style={{gap:8}}>
              <input type="checkbox" checked={ats} onChange={e=>setAts(e.target.checked)} />
              <span>ATS mode</span>
            </label>
          </div>

          <div className="Group">
            <button className="Button"
              onClick={() => window.location.href =
                `/api/pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=${encodeURIComponent(density)}&ats=${ats?'1':'0'}`}>
              Download Résumé (PDF)
            </button>
            <div style={{height:10}} />
            <button className="Button secondary"
              onClick={() => window.location.href =
                `/api/cover-pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=${encodeURIComponent(density)}&ats=${ats?'1':'0'}`}>
              Download Cover Letter (PDF)
            </button>
          </div>
        </aside>

        <section className="Previews">
          <div className="PreviewCard">
            <div className="PreviewHeader">Résumé</div>
            {isLoading ? <div className="A4Preview" style={{display:'grid',placeItems:'center'}}>Loading…</div>
                       : <PreviewFrame className="A4Preview" htmlDoc={cvHtml} />}
          </div>
          <div className="PreviewCard">
            <div className="PreviewHeader">Cover Letter</div>
            {isLoading ? <div className="A4Preview" style={{display:'grid',placeItems:'center'}}>Loading…</div>
                       : <PreviewFrame className="A4Preview" htmlDoc={coverHtml} />}
          </div>
        </section>
      </div>
    </>
  );
}
