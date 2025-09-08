import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Head from 'next/head';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import Preview from '../components/ui/Preview';
import Classic from '../components/templates/Classic';
import TwoCol from '../components/templates/TwoCol';
import Centered from '../components/templates/Centered';
import Sidebar from '../components/templates/Sidebar';
import Modern from '../components/templates/Modern';
import { pdf } from '@react-pdf/renderer';
import CoverLetterPdf from '../components/pdf/CoverLetterPdf';
import PageCarousel from '../components/ui/PageCarousel';
import LightboxModal from '../components/ui/LightboxModal';
import ResponsiveA4Preview from '../components/ui/ResponsiveA4Preview';

const TemplateMap = { classic: Classic, twoCol: TwoCol, centered: Centered, sidebar: Sidebar, modern: Modern };

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

  const TemplateComp = TemplateMap[template] || Classic;
  const densityVars = {
    compact: { '--font-size': '11px', '--line-height': '1.5' },
    normal: { '--font-size': '12.5px', '--line-height': '1.75' },
    cozy: { '--font-size': '14px', '--line-height': '1.9' }
  };
  const styleVars = { '--accent': accent, ...densityVars[density] };

  useEffect(() => {
    if (!result) return;
    const pageHeight = 1123;
    const off = document.createElement('div');
    off.className = `paper ${atsMode ? 'ats-mode' : ''}`;
    Object.entries(styleVars).forEach(([k, v]) => off.style.setProperty(k, v));
    off.style.position = 'absolute';
    off.style.visibility = 'hidden';
    off.style.pointerEvents = 'none';
    off.style.left = '-10000px';
    document.body.appendChild(off);
    const root = createRoot(off);
    root.render(<TemplateComp data={result.resumeData} />);
    requestAnimationFrame(() => {
      const total = off.scrollHeight;
      const items = Array.from(off.querySelectorAll('.avoid-break'));
      const positions = [];
      let start = 0;
      while (start < total) {
        let end = start + pageHeight;
        const crossing = items.find(el => el.offsetTop < end && (el.offsetTop + el.offsetHeight) > end);
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

  async function downloadCvPdf(){
    const res = await fetch('/api/export-pdf',{method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({data: result.resumeData, template, mode: atsMode?'ats':'design', accent, density, filename:'cv'})});
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cv.pdf'; a.click();
    URL.revokeObjectURL(url);
  }
  async function downloadCvDocx(){
    const res = await fetch('/api/export-docx-structured',{method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({data: result.resumeData, filename:'cv'})});
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cv.docx'; a.click(); URL.revokeObjectURL(url);
  }
  async function downloadClPdf(){
    const blob = await pdf(<CoverLetterPdf text={result.coverLetter} />).toBlob();
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='cover_letter.pdf'; a.click(); URL.revokeObjectURL(url);
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
          content="View and export your tailored CV and cover letter with responsive A4 display, side navigation controls, seamless multi-page downloads, customizable templates, themes, density, and ATS-friendly mode."
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
            onExportPdf={downloadCvPdf}
            onExportDocx={downloadCvDocx}
            onExportClPdf={downloadClPdf}
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
              Wrapper={ResponsiveA4Preview}
            />
            <PageCarousel
              title="Cover Letter"
              pages={coverPages}
              index={cIndex}
              setIndex={setCIndex}
              onOpenLightbox={()=>setLightbox({ type: 'cover' })}
              Wrapper={ResponsiveA4Preview}
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
