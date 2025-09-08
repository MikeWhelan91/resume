import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Head from 'next/head';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import { getTemplate, densityMap } from '../lib/resumeConfig';
import PageCarousel from '../components/ui/PageCarousel';
import LightboxModal from '../components/ui/LightboxModal';
import ResponsiveA4Preview from '../components/ui/ResponsiveA4Preview';
import { downloadPdfFromHtml } from "../components/export/downloadPdfFromHtml";

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

  useEffect(()=>{
    try{ const r = JSON.parse(localStorage.getItem('resumeResult')||'null'); if(r) setResult(r); }catch{}
  },[]);

  const TemplateComp = getTemplate(template);
  const { fontSize, lineHeight } = densityMap[density] || densityMap.normal;
  const styleVars = { '--accent': accent, '--font-size': fontSize, '--line-height': lineHeight };

  useEffect(() => {
    if (!result) return;
    const off = document.createElement('div');
    off.className = `paper ${atsMode ? 'ats-mode' : ''}`;
    Object.entries(styleVars).forEach(([k, v]) => off.style.setProperty(k, v));
    off.style.position = 'absolute';
    off.style.visibility = 'hidden';
    off.style.pointerEvents = 'none';
    off.style.left = '-10000px';
    document.body.appendChild(off);
    const pageHeight = off.getBoundingClientRect().height;
    const root = createRoot(off);
    root.render(<TemplateComp data={result.resumeData} />);
    requestAnimationFrame(() => {
      const total = off.scrollHeight;
      const items = Array.from(off.querySelectorAll('.avoid-break'));
      const positions = [];
      let start = 0;
      while (start < total) {
        let end = start + pageHeight;
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
        <div className={`paper ${atsMode ? 'ats-mode' : ''}`} style={styleVars} key={i}>
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
    <div className={`paper cover-letter ${atsMode ? 'ats-mode' : ''}`} style={styleVars}>
      <div className="text-[11px] leading-[1.6] space-y-[10px]">
        {(result.coverLetter || 'No cover letter returned.').split(/\n+/).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
  const coverPages = [coverPage];

  function buildHtmlFromNode(node) {
    const cssLinks = `
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="stylesheet" href="/_next/static/css/app.css">
      <link rel="stylesheet" href="/_next/static/css/styles.css">
    `;
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${cssLinks}
          <style>
            @page { size: A4; margin: 20mm; }
            @media print { body{ -webkit-print-color-adjust: exact; color-adjust: exact; } }
          </style>
        </head>
        <body>${node.outerHTML}</body>
      </html>
    `;
  }

  async function downloadResumePdf() {
    const el = document.getElementById("resume-preview");
    if (!el) return alert("Resume preview not found");
    const html = buildHtmlFromNode(el);
    await downloadPdfFromHtml(html, "resume.pdf");
  }

  async function downloadCoverPdf() {
    const el = document.getElementById("cover-preview");
    if (!el) return alert("Cover letter preview not found");
    const html = buildHtmlFromNode(el);
    await downloadPdfFromHtml(html, "cover-letter.pdf");
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

  function ResumePreviewWrapper({ children }) {
    return <div id="resume-preview"><ResponsiveA4Preview>{children}</ResponsiveA4Preview></div>;
  }

  function CoverPreviewWrapper({ children }) {
    return <div id="cover-preview"><ResponsiveA4Preview>{children}</ResponsiveA4Preview></div>;
  }

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta
          name="description"
          content="Accurately preview and export your tailored CV and cover letter with responsive A4 display, scrollable full-screen zoom, side navigation controls, seamless multi-page downloads, customizable templates, themes, density, and ATS-friendly mode."
        />
      </Head>
      <MainShell
        left={
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
        }
        right={
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <PageCarousel
              title="Résumé"
              pages={resumePages}
              index={rIndex}
              setIndex={(i)=>{setRIndex(i); setPage(i);}}
              onOpenLightbox={()=>setLightbox({ type: 'resume' })}
              Wrapper={ResumePreviewWrapper}
            />
            <PageCarousel
              title="Cover Letter"
              pages={coverPages}
              index={cIndex}
              setIndex={setCIndex}
              onOpenLightbox={()=>setLightbox({ type: 'cover' })}
              Wrapper={CoverPreviewWrapper}
            />
          </div>
        }
      />
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
        {lightbox?.type === 'resume' ? resumePages?.[rIndex] : coverPages?.[cIndex]}
      </LightboxModal>
    </>
  );
}
