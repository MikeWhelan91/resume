import { useEffect, useState } from 'react';
import Head from 'next/head';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import MainShell from '../components/layout/MainShell';
import ControlsPanel from '../components/ui/ControlsPanel';
import ClassicPdf from '../components/pdf/ClassicPdf';
import TwoColPdf from '../components/pdf/TwoColPdf';
import SidebarPdf from '../components/pdf/SidebarPdf';
import CenteredPdf from '../components/pdf/CenteredPdf';
import ModernPdf from '../components/pdf/ModernPdf';
import CoverLetterPdf from '../components/pdf/CoverLetterPdf';

const pdfTemplates = {
  classic: ClassicPdf,
  twoCol: TwoColPdf,
  sidebar: SidebarPdf,
  centered: CenteredPdf,
  modern: ModernPdf,
};

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const [template, setTemplate] = useState('classic');
  const [accent, setAccent] = useState('#00C9A7');
  const [density, setDensity] = useState('normal');
  const [atsMode, setAtsMode] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);

  const Template = pdfTemplates[template] || ClassicPdf;

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
        <Template data={result.resumeData} accent={accent} density={density} atsMode={atsMode} />
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
  }, [result, accent, density, atsMode, template]);

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
          content="Preview and download your tailored CV and cover letter as clean PDFs across Classic, Two-Column, Sidebar, Centered and Modern templates with smart page breaks and easy controls."
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
                <Template
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

