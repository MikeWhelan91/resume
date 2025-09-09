import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import CoverLetterPdf from '../components/pdf/CoverLetterPdf';
import { listTemplates, getTemplate } from '@/templates';
import { renderHtml } from '@/lib/renderHtmlTemplate';
import { toTemplateModel } from '@/lib/templateModel';
import { pdf } from '@react-pdf/renderer';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(m => m.PDFViewer), { ssr: false });

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const templates = listTemplates();
  const [tplId, setTplId] = useState(templates[0]?.id);
  const [accent, setAccent] = useState('#00C9A7');
  const [density, setDensity] = useState('normal');
  const [atsMode, setAtsMode] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('resumeResult') || 'null');
      if (r) setResult(r);
    } catch {}
  }, []);

  useEffect(() => {
    if (!result) return;
    async function generateCover() {
      const cBlob = await pdf(
        <CoverLetterPdf text={result.coverLetter} accent={accent} density={density} atsMode={atsMode} />
      ).toBlob();
      setCoverUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return URL.createObjectURL(cBlob);
      });
    }
    generateCover();
  }, [result, accent, density, atsMode]);

  async function downloadResumePdf() {
    if (!result) return;
    const appData = { ...result.resumeData, accent, density, ats: atsMode };
    const res = await fetch(`/api/pdf?template=${tplId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: appData })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCoverPdf() {
    if (!coverUrl) return;
    const a = document.createElement('a');
    a.href = coverUrl;
    a.download = 'cover-letter.pdf';
    a.click();
  }

  async function downloadCvDocx() {
    const res = await fetch('/api/export-docx-structured', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: result.resumeData, filename: 'cv' }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadClDocx() {
    const res = await fetch('/api/export-cover-letter-docx', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coverLetter: result.coverLetter, filename: 'cover_letter' }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover_letter.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!result) return null;

  const tpl = getTemplate(tplId);
  const model = toTemplateModel({ ...result.resumeData, accent, density, ats: atsMode });
  const html = tpl.engine === 'html' ? renderHtml({ html: tpl.html, css: tpl.css, model }) : null;

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta
          name="description"
          content="Preview and download your tailored CV with selectable HTML or React-PDF templates, consistent A4 output, and easy export options."
        />
      </Head>
      <MainShell
        left={
          <ControlsPanel
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
          />
        }
        right={
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="space-y-4">
              <select value={tplId} onChange={e => setTplId(e.target.value)} className="border p-2 rounded">
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {tpl.engine === 'html' ? (
                <iframe style={{width:'794px', height:'1123px', border:'0', boxShadow:'0 10px 30px rgba(0,0,0,.15)'}}
                        srcDoc={html} />
              ) : (
                <PDFViewer showToolbar={false} className="w-full h-full border border-gray-800">
                  {(tpl.module.DocumentFor || tpl.module.default)({ model })}
                </PDFViewer>
              )}
            </div>
            <div id="cover-preview" className="h-[80vh]">
              <PDFViewer showToolbar={false} className="w-full h-full border border-gray-800">
                <CoverLetterPdf
                  text={result.coverLetter}
                  accent={accent}
                  density={density}
                  atsMode={atsMode}
                />
              </PDFViewer>
            </div>
          </div>
        }
      />
    </>
  );
}
