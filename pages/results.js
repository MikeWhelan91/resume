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

const TemplateMap = { classic: Classic, twoCol: TwoCol, centered: Centered, sidebar: Sidebar, modern: Modern };

export default function ResultsPage(){
  const [result, setResult] = useState(null);
  const [template, setTemplate] = useState('classic');
  const [accent, setAccent] = useState('#00C9A7');
  const [density, setDensity] = useState('normal');
  const [atsMode, setAtsMode] = useState(false);
  const [page, setPage] = useState(0);
  const [resumePages, setResumePages] = useState([]);

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
      <div className="whitespace-pre-wrap text-[11px] leading-[1.6]">
        {result.coverLetter || 'No cover letter returned.'}
      </div>
    </div>
  );

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
            onPageChange={setPage}
          />
        }
        right={
          <div className="grid gap-6 md:grid-cols-2">
            <div className="pane">
              <Preview pages={resumePages} page={page} onPageChange={setPage} />
            </div>
            <div className="pane">
              <Preview pages={[coverPage]} />
            </div>
          </div>
        }
      />
    </>
  );
}
