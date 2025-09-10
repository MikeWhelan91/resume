import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import PreviewFrame from '../components/PreviewFrame';
import { listTemplates, getTemplate } from '../templates';
import { renderHtml } from '../lib/renderHtmlTemplate';
import { toTemplateModel } from '../lib/templateModel';

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'];

export default function ResultsPage() {
  // Stable templates list
  const templates = useMemo(() => listTemplates(), []);
  const firstTplId = templates[0]?.id || '';

  const [tplId, setTplId]   = useState(firstTplId);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [result, setResult] = useState(null);

  useEffect(() => { if (!tplId && firstTplId) setTplId(firstTplId); }, [tplId, firstTplId]);

  // Load persisted data; DO NOT early-return before hooks below
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('resumeResult') || 'null');
      if (r) setResult(r);
    } catch {}
  }, []);

  useEffect(() => {
    if (result) {
      try {
        document.cookie = `resumeResult=${encodeURIComponent(JSON.stringify(result))}; path=/`;
      } catch {}
    }
  }, [result]);

  // Null-safe fallbacks so hooks always run
  const resume  = result?.resumeData  ?? {};
  const letter  = result?.coverLetter ?? {};
  const appData = useMemo(() => ({ ...resume, coverLetter: letter }), [resume, letter]);

  const tpl = useMemo(() => getTemplate(tplId) || getTemplate(firstTplId) || {}, [tplId, firstTplId]);

  const model = useMemo(
    () => toTemplateModel(appData, { ats:false, density:'normal', isCoverLetter:false }),
    [appData]
  );
  const tplDensity = model.density;
  const coverModel = useMemo(() => ({ ...model, isCoverLetter:true }), [model]);

  const cvHtml = useMemo(
    () => renderHtml({ html: tpl.html, css: tpl.css, model, options: { mode:'preview', accent, density: tplDensity, ats:false } }),
    [tpl, model, accent, tplDensity]
  );
  const coverHtml = useMemo(
    () => renderHtml({ html: tpl.html, css: tpl.css, model: coverModel, options: { mode:'preview', accent, density: tplDensity, ats:false } }),
    [tpl, coverModel, accent, tplDensity]
  );

  const isLoading = result == null;

  return (
    <>
      <Head>
        <title>Results Preview – TailorCV</title>
        <meta name="description" content="Preview and download your resume and cover letter side-by-side."/>
      </Head>
      <h1 className="sr-only">Preview your resume and cover letter</h1>
      <div className="ResultsLayout">
        <aside className="ResultsSidebar">
          <h2 className="PanelTitle">Controls</h2>
          <div className="Group">
            <label className="Label" htmlFor="templateSelect">Template</label>
            <select id="templateSelect" className="Select" value={tplId} onChange={e => setTplId(e.target.value)}>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="Group">
            <h3>Theme Colour</h3>
            <div className="Row">
              {ACCENTS.map(c => (
                <button
                  key={c}
                  className="RadioSwatch"
                  style={{background:c, outlineColor: c===accent ? c : 'var(--border)'}}
                  onClick={() => setAccent(c)}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="Group">
            <button
              className="Button"
              onClick={() => window.location.href = `/api/pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=normal&ats=0`}
            >
              Download CV PDF
            </button>
            <div style={{height:10}} />
            <button
              className="Button secondary"
              onClick={() => window.location.href = `/api/cover-pdf?template=${tplId}&accent=${encodeURIComponent(accent)}&density=normal&ats=0`}
            >
              Download Cover Letter PDF
            </button>
          </div>
        </aside>

        <section className="PreviewsSection">
          <h2 className="PanelTitle">Previews</h2>
          <div className="Previews">
            <div className="PreviewCard">
              <div className="PreviewHeader">CV Preview</div>
              {isLoading ? (
                <div className="A4Preview" style={{display:'grid',placeItems:'center'}}>Loading…</div>
              ) : (
                <PreviewFrame className="A4Preview" htmlDoc={cvHtml} />
              )}
            </div>
            <div className="PreviewCard">
              <div className="PreviewHeader">Cover Letter Preview</div>
              {isLoading ? (
                <div className="A4Preview" style={{display:'grid',placeItems:'center'}}>Loading…</div>
              ) : (
                <PreviewFrame className="A4Preview" htmlDoc={coverHtml} />
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
