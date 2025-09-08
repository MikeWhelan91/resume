import { useEffect, useState } from "react";
import Head from "next/head";
import { pdf } from "@react-pdf/renderer";
import ResumePdf from "../components/pdf/ResumePdf";
import CoverLetterPdf from "../components/pdf/CoverLetterPdf";
import dynamic from "next/dynamic";

const PdfPreviewFrame = dynamic(() => import("../components/pdf/PdfPreviewFrame"), { ssr: false });

const LAYOUTS = ["normal", "cosy", "compact"];

export default function ResultsPage() {
  const [payload, setPayload] = useState(null);
  const [layout, setLayout] = useState("normal");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("resumeResult") || "null");
      setPayload(saved || null);
    } catch {}
  }, []);

  async function downloadResume() {
    if (!payload) return;
    const blob = await pdf(<ResumePdf data={payload.resumeData} layout={layout} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "resume.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCover() {
    if (!payload) return;
    const blob = await pdf(<CoverLetterPdf text={payload.coverLetter} identity={payload.resumeData} layout={layout} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cover-letter.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <Head>
        <title>Preview – TailorCV</title>
        <meta name="description" content="Preview your tailored résumé and cover letter, adjust layouts, and download clean PDFs." />
      </Head>
      {/* 2-column app layout: left fixed sidebar (320px), right flexible */}
      <div className="mx-auto px-6 py-8 max-w-[1800px] grid grid-cols-[320px_1fr] gap-8">
        {/* LEFT: Controls */}
        <aside className="space-y-4">
          <h1 className="text-3xl font-semibold">Preview</h1>

          <div className="space-y-2">
            <label className="text-sm font-medium">Layout</label>
            <select
              className="w-full border rounded px-2 py-2 bg-white"
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
            >
              {LAYOUTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <button className="w-full border rounded px-3 py-2 bg-white hover:bg-zinc-50"
                    onClick={downloadResume}>
              Download Résumé (PDF)
            </button>
            <button className="w-full border rounded px-3 py-2 bg-white hover:bg-zinc-50"
                    onClick={downloadCover}>
              Download Cover Letter (PDF)
            </button>
          </div>

          {/* Keep any other existing controls here (theme, ATS mode, etc.) */}
        </aside>

        {/* RIGHT: Two clean previews */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <div className="text-sm font-medium mb-2">Résumé</div>
            <PdfPreviewFrame
              title="Résumé Preview"
              doc={<ResumePdf data={payload?.resumeData} layout={layout} />}
            />
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-medium mb-2">Cover Letter</div>
            <PdfPreviewFrame
              title="Cover Letter Preview"
              doc={<CoverLetterPdf text={payload?.coverLetter} identity={payload?.resumeData} layout={layout} />}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
