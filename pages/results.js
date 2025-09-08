import { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { pdf } from "@react-pdf/renderer";
import ResumePdf from "../components/pdf/ResumePdf";
import CoverLetterPdf from "../components/pdf/CoverLetterPdf";
import dynamic from "next/dynamic";

const PdfCanvasPreview = dynamic(
  () => import("../components/pdf/PdfCanvasPreview").then(m => m.default),
  { ssr: false }
);

const LAYOUTS = ["normal", "cosy", "compact"];
const COLORS = ["#14b8a6", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#0ea5e9"]; // theme dots

export default function ResultsPage() {
  const [payload, setPayload] = useState(null);
  const [layout, setLayout] = useState("normal");
  const [accent, setAccent] = useState("#3b82f6");
  const [ats, setAts] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("resumeResult") || "null");
      setPayload(saved || null);
    } catch {}
  }, []);

  const resumeDoc = useMemo(() => (
    <ResumePdf data={payload?.resumeData} layout={layout} accent={accent} ats={ats} />
  ), [payload, layout, accent, ats]);

  const coverDoc = useMemo(() => (
    <CoverLetterPdf text={payload?.coverLetter} identity={payload?.resumeData} layout={layout} accent={accent} ats={ats} />
  ), [payload, layout, accent, ats]);

  async function downloadResume() {
    if (!payload) return;
    const blob = await pdf(resumeDoc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "resume.pdf"; a.click(); URL.revokeObjectURL(url);
  }

  async function downloadCover() {
    if (!payload) return;
    const blob = await pdf(coverDoc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cover-letter.pdf"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <Head>
        <title>Preview &amp; Download – TailorCV</title>
        <meta name="description" content="Side-by-side résumé and cover letter previews with matching PDF downloads. Customise layout, theme colours and ATS-friendly mode." />
      </Head>
      <div className="mx-auto px-6 py-8 max-w-[1800px] grid grid-cols-[320px_1fr] gap-8">
        {/* LEFT: controls */}
        <aside className="space-y-5 sticky top-8">
          <h1 className="text-3xl font-semibold">Preview</h1>

          {/* Layout */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Layout</label>
            <select className="w-full border rounded px-2 py-2 bg-white" value={layout} onChange={e => setLayout(e.target.value)}>
              {LAYOUTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Theme colours */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className="h-8 w-8 rounded-full border"
                  style={{ backgroundColor: c, outline: accent === c ? "3px solid rgba(0,0,0,.2)" : "none" }}
                  aria-label={`Theme ${c}`}
                />
              ))}
            </div>
          </div>

          {/* ATS mode */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ats} onChange={e => setAts(e.target.checked)} />
            ATS mode
          </label>

          {/* Downloads */}
          <div className="space-y-3 pt-2">
            <button className="w-full border rounded px-3 py-2 bg-white hover:bg-zinc-50" onClick={downloadResume}>
              Download Résumé (PDF)
            </button>
            <button className="w-full border rounded px-3 py-2 bg-white hover:bg-zinc-50" onClick={downloadCover}>
              Download Cover Letter (PDF)
            </button>
          </div>
        </aside>

        {/* RIGHT: two borderless previews */}
        <section className="grid grid-cols-2 gap-8">
          <div className="flex flex-col">
            <div className="text-sm font-medium mb-2">Résumé</div>
            <PdfCanvasPreview
              title="Résumé Preview"
              doc={resumeDoc}
            />
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-medium mb-2">Cover Letter</div>
            <PdfCanvasPreview
              title="Cover Letter Preview"
              doc={coverDoc}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
