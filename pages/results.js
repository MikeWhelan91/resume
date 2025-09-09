import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import PreviewFrame from '../components/PreviewFrame';
import ControlsPanel from '../components/ui/ControlsPanel';
import { listTemplates, getTemplate } from '../templates';
import { renderHtml } from '../lib/renderHtmlTemplate';
import { toTemplateModel } from '../lib/templateModel';
import { pdf } from '@react-pdf/renderer';

const CoverLetterPdf = dynamic(() => import('../components/pdf/CoverLetterPdf'), { ssr: false });

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
      const { default: CoverLetterPdfComponent } = await import('../components/pdf/CoverLetterPdf');
      const cBlob = await pdf(
        <CoverLetterPdfComponent text={result.coverLetter} accent={accent} density={density} atsMode={atsMode} />
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
      body: JSON.stringify({ data: appData }),
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

  const appData = { ...result.resumeData, accent, density, ats: atsMode };
  const tpl = getTemplate(tplId);
  const model = toTemplateModel(appData);
  const ReactPdfDoc =
    tpl.engine === 'react-pdf'
      ? (tpl.module?.DocumentFor || tpl.module?.default)
        ? (tpl.module.DocumentFor || tpl.module.default)({ model })
        : null
      : null;
  const htmlDoc = tpl.engine === 'html' ? renderHtml({ html: tpl.html, css: tpl.css, model }) : null;

  const clDoc = (
    <CoverLetterPdf text={result.coverLetter} accent={accent} density={density} atsMode={atsMode} />
  );
  const clTpl = { engine: 'react-pdf' };

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta
          name="description"
          content="Preview and download your tailored CV and cover letter with consistent A4 frames, using HTML or React-PDF templates."
        />
      </Head>
      <div className="preview-grid">
        <aside>
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
          <div className="mt-4">
            <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="border p-2 rounded w-full">
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </aside>
        <section>
          <PreviewFrame engine={tpl.engine} htmlDoc={htmlDoc} ReactPdfDoc={ReactPdfDoc} />
        </section>
        <section id="cover-preview">
          <PreviewFrame engine={clTpl.engine} htmlDoc={null} ReactPdfDoc={clDoc} />
        </section>
      </div>
    </>
  );
}
