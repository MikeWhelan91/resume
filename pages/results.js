import { useEffect, useState } from 'react';
import Head from 'next/head';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import PreviewPane from '../components/ui/PreviewPane';
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
  const [atsMode, setAtsMode] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(()=>{
    try{ const r = JSON.parse(localStorage.getItem('resumeResult')||'null'); if(r) setResult(r); }catch{}
  },[]);

  if(!result) return null;

  const TemplateComp = TemplateMap[template] || Classic;
  const resumePage = <div className="paper"><TemplateComp data={result.resumeData} /></div>;
  const coverPage = <div className="paper cover-letter"><div className="whitespace-pre-wrap text-[11px] leading-[1.6]">{result.coverLetter || 'No cover letter returned.'}</div></div>;

  async function downloadCvPdf(){
    const res = await fetch('/api/export-pdf',{method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({data: result.resumeData, template, mode: atsMode?'ats':'design', filename:'cv'})});
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
        <meta name="description" content="Preview and export your tailored CV and cover letter." />
      </Head>
      <MainShell
        left={<ControlsPanel template={template} setTemplate={setTemplate} accent={accent} setAccent={setAccent} density={density} setDensity={setDensity} atsMode={atsMode} setAtsMode={setAtsMode} onExportPdf={downloadCvPdf} onExportDocx={downloadCvDocx} onExportClPdf={downloadClPdf} onExportClDocx={downloadClDocx} page={page} pageCount={1} onPageChange={setPage} />}
        right={<div className="space-y-6"><PreviewPane content={[resumePage]} /><PreviewPane content={[coverPage]} /></div>}
      />
    </>
  );
}
