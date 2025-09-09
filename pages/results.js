import { useEffect, useState } from 'react';
import Head from 'next/head';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import ResumePdf from '../components/pdf/ResumePdf';
import CoverLetterPdf from '../components/pdf/CoverLetterPdf';

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const [template, setTemplate] = useState('classic');
  const [accent, setAccent] = useState('#00C9A7');
  const [density, setDensity] = useState('normal');
  const [atsMode, setAtsMode] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('resumeResult') || 'null');
      if (r) setResult(r);
    } catch {}
  }, []);

  useEffect(() => {
    if (!result) return;
    async function generate() {
      const rBlob = await pdf(
        <ResumePdf data={result.resumeData} accent={accent} density={density} atsMode={atsMode} />
      ).toBlob();
      setResumeUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return URL.createObjectURL(rBlob);
      });
      const cBlob = await pdf(
        <CoverLetterPdf text={result.coverLetter} accent={accent} density={density} atsMode={atsMode} />
      ).toBlob();
      setCoverUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return URL.createObjectURL(cBlob);
      });
    }
    generate();
  }, [result, accent, density, atsMode]);

  function downloadResumePdf() {
    if (!resumeUrl) return;
    const a = document.createElement('a');
    a.href = resumeUrl;
    a.download = 'resume.pdf';
    a.click();
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

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta
          name="description"
          content="Preview and download your tailored CV and cover letter as clean PDFs with smart page breaks, zero duplication and no browser toolbars, presented in dark-bordered previews side by side with easy controls."
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
          />
        }
        right={
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div id="resume-preview" className="h-[80vh]">
              <PDFViewer showToolbar={false} className="w-full h-full border border-gray-800">
                <ResumePdf
                  data={result.resumeData}
                  accent={accent}
                  density={density}
                  atsMode={atsMode}
                />
              </PDFViewer>
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

