import { useEffect, useState } from 'react';
import Head from 'next/head';
import { pdf } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import ResumePdf from '../components/pdf/ResumePdf';
import CoverLetterPdf from '../components/pdf/CoverLetterPdf';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(m => m.PDFViewer), {
  ssr: false,
});

const LAYOUTS = ['normal','cosy','compact'];

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [layout, setLayout] = useState('normal');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('resumeResult') || 'null');
      setData(saved || null);
    } catch {}
  }, []);

  async function downloadResume() {
    if (!data) return;
    const blob = await pdf(<ResumePdf data={data?.resumeData} layout={layout} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'resume.pdf'; a.click(); URL.revokeObjectURL(url);
  }

  async function downloadCover() {
    if (!data) return;
    const blob = await pdf(<CoverLetterPdf text={data?.coverLetter} identity={data?.resumeData} layout={layout} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cover-letter.pdf'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>Results – TailorCV</title>
        <meta name="description" content="Preview and export your résumé and cover letter with pixel-perfect PDF rendering and adjustable layouts." />
      </Head>
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto px-6 py-8 max-w-[1600px]">
          <header className="mb-6 flex items-end justify-between" data-app-chrome>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Preview</h1>
              <select className="border rounded px-2 py-1" value={layout} onChange={e => setLayout(e.target.value)}>
                {LAYOUTS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button className="border rounded px-3 py-1" onClick={downloadResume}>Download Résumé (PDF)</button>
              <button className="border rounded px-3 py-1" onClick={downloadCover}>Download Cover Letter (PDF)</button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="flex flex-col">
              <div className="text-sm font-medium mb-2">Résumé</div>
              <div className="h-[80vh] border rounded overflow-hidden bg-white">
                <PDFViewer width="100%" height="100%">
                  <ResumePdf data={data?.resumeData} layout={layout} />
                </PDFViewer>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm font-medium mb-2">Cover Letter</div>
              <div className="h-[80vh] border rounded overflow-hidden bg-white">
                <PDFViewer width="100%" height="100%">
                  <CoverLetterPdf text={data?.coverLetter} identity={data?.resumeData} layout={layout} />
                </PDFViewer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
