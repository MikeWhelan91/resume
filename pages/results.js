import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Head from 'next/head';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import { getTemplate, densityMap } from '../lib/resumeConfig';
import PageCarousel from '../components/ui/PageCarousel';
import LightboxModal from '../components/ui/LightboxModal';
import A4Page from '../components/A4Page';

export default function ResultsPage(){
  const [result, setResult] = useState(null);
  const [template, setTemplate] = useState('classic');
  const [accent, setAccent] = useState('#00C9A7');
  const [density, setDensity] = useState('normal');
  const [atsMode, setAtsMode] = useState(false);
  const [page, setPage] = useState(0);
  const [resumePages, setResumePages] = useState([]);
  const [rIndex, setRIndex] = useState(0);
  const [cIndex, setCIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [docType, setDocType] = useState(null);

  useEffect(()=>{
    try{ const r = JSON.parse(localStorage.getItem('resumeResult')||'null'); if(r) setResult(r); }catch{}
  },[]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1") {
      setPrintMode(true);
      document.documentElement.classList.add("print-mode");
    }
    const doc = params.get("doc");
    if (doc) setDocType(doc);
  }, []);

  const TemplateComp = getTemplate(template);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const styleVars = { '--accent': accent, '--font-size': fontSize, '--line-height': lineHeight };

  useEffect(() => {
    if (!result) return;
    const off = document.createElement('div');
    off.className = `a4-page ${atsMode ? 'ats-mode' : ''}`;
    Object.entries(styleVars).forEach(([k, v]) => off.style.setProperty(k, v));
    off.style.position = 'absolute';
    off.style.visibility = 'hidden';
    off.style.pointerEvents = 'none';
    off.style.left = '-10000px';
    document.body.appendChild(off);
    const pageHeight = off.getBoundingClientRect().height;
    const computed = window.getComputedStyle(off);
    const padTop = parseFloat(computed.paddingTop) || 0;
    const padBottom = parseFloat(computed.paddingBottom) || 0;
    // Allow content to expand so we can measure its full height
    off.style.height = 'auto';
    off.style.overflow = 'visible';
    off.style.padding = '0';
    const root = createRoot(off);
    root.render(<TemplateComp data={result.resumeData} />);
    requestAnimationFrame(() => {
      const total = off.scrollHeight;
      const items = Array.from(off.querySelectorAll('.avoid-break'));
      const positions = [];
      const innerHeight = pageHeight - padTop - padBottom;
      let start = 0;
      while (start < total) {
        let end = start + innerHeight;
        const crossing = items.find(
          el => el.offsetTop < end && (el.offsetTop + el.offsetHeight) > end
        );
        if (crossing && crossing.offsetTop > start) {
          end = crossing.offsetTop;
        }
        positions.push(start);
        start = end;
      }
      const arr = positions.map((pos, i) => (
        <div className={`${atsMode ? 'ats-mode' : ''}`} style={styleVars} key={i}>
          <div style={{ position: 'relative', top: -pos }}>
            <TemplateComp data={result.resumeData} />
          </div>
        </div>
      ));
      setResumePages(arr);
      setPage(p => Math.min(p, arr.length - 1));
      setRIndex(i => Math.min(i, arr.length - 1));
      root.unmount();
      document.body.removeChild(off);
    });
  }, [result, template, accent, density, atsMode]);

  if(!result) return null;

  const coverPage = (
    <div className={`${atsMode ? 'ats-mode' : ''}`} style={styleVars}>
      <div className="text-[11px] leading-[1.6] space-y-[10px]">
        {(result.coverLetter || 'No cover letter returned.').split(/\n+/).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
  const coverPages = [coverPage];
  const resumePageEls = resumePages.map((p, i) => <A4Page key={i}>{p}</A4Page>);
  const coverPageEls = coverPages.map((p, i) => <A4Page key={i}>{p}</A4Page>);

  async function downloadResumePdf() {
    window.open('/api/pdf?doc=resume', '_blank');
  }

  async function downloadCoverPdf() {
    window.open('/api/pdf?doc=cover', '_blank');
  }

  async function downloadCvDocx(){
    const res = await fetch('/api/export-docx-structured',{method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({data: result.resumeData, filename:'cv'})});
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cv.docx'; a.click(); URL.revokeObjectURL(url);
  }
  async function downloadClDocx(){
    const res = await fetch('/api/export-cover-letter-docx',{method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({coverLetter: result.coverLetter, filename:'cover_letter'})});
    const blob = await res.blob();
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='cover_letter.docx'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta
          name="description"
          content="Accurately preview and export your tailored CV and cover letter with responsive A4 display, exact PDF replication, consistent page margins, scrollable full-screen zoom, arrow navigation for multi-page previews, seamless downloads, customizable templates, themes, density, and ATS-friendly mode."
        />
      </Head>
        {printMode ? (
          <div id="print-root">
            <div className="a4-viewport">
              {(docType === 'cover' ? [] : resumePages).map((p, i) => (
                <div className="a4-page" key={i}>{p}</div>
              ))}
              {(docType === 'resume' ? [] : coverPages).map((p, i) => (
                <div className="a4-page" key={`c${i}`}>{p}</div>
              ))}
            </div>
          </div>
        ) : (
          <MainShell
            left={
              <div className="no-print">
                <ControlsPanel
                  template={template}
                  setTemplate={setTemplate}
                  accent={accent}
                  setAccent={setAccent}
                  density={density}
                  setDensity={setDensity}
                  atsMode={atsMode}
                  setAtsMode={setAtsMode}
                  onExportPdf={downloadResumePdf}
                  onExportDocx={downloadCvDocx}
                  onExportClPdf={downloadCoverPdf}
                  onExportClDocx={downloadClDocx}
                  page={page}
                  pageCount={resumePages.length || 1}
                  onPageChange={(p)=>{setPage(p); setRIndex(p);}}
                />
              </div>
            }
            right={
              <div id="print-root">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  <PageCarousel
                    title="Résumé"
                    pages={resumePageEls}
                    index={rIndex}
                    setIndex={(i)=>{setRIndex(i); setPage(i);}}
                    onOpenLightbox={()=>setLightbox({ type: 'resume' })}
                  />
                  <PageCarousel
                    title="Cover Letter"
                    pages={coverPageEls}
                    index={cIndex}
                    setIndex={setCIndex}
                    onOpenLightbox={()=>setLightbox({ type: 'cover' })}
                  />
                </div>
              </div>
            }
          />
        )}
      <LightboxModal
        open={!!lightbox}
        onClose={()=>setLightbox(null)}
        onPrev={()=>{
          if(!lightbox) return;
          if(lightbox.type === 'resume') setRIndex(i=>{ const n = Math.max(0, i-1); setPage(n); return n; });
          if(lightbox.type === 'cover') setCIndex(i=>Math.max(0, i-1));
        }}
        onNext={()=>{
          if(!lightbox) return;
          if(lightbox.type === 'resume') setRIndex(i=>{ const n = Math.min((resumePages?.length ?? 1) - 1, i+1); setPage(n); return n; });
          if(lightbox.type === 'cover') setCIndex(i=>Math.min((coverPages?.length ?? 1) - 1, i+1));
        }}
        canPrev={lightbox?.type === 'resume' ? rIndex > 0 : cIndex > 0}
        canNext={lightbox?.type === 'resume'
          ? rIndex < (resumePages?.length ?? 1) - 1
          : cIndex < (coverPages?.length ?? 1) - 1}
        pageLabel={
          lightbox
            ? `${lightbox.type === 'resume' ? rIndex + 1 : cIndex + 1} / ${lightbox.type === 'resume' ? (resumePages?.length ?? 1) : (coverPages?.length ?? 1)}`
            : ''
        }
      >
        {lightbox?.type === 'resume' ? resumePageEls?.[rIndex] : coverPageEls?.[cIndex]}
      </LightboxModal>
    </>
  );
}
