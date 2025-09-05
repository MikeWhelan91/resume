import { useMemo, useRef, useState, useEffect } from "react";
import Head from "next/head";
import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import Centered from "../components/templates/Centered";
import Sidebar from "../components/templates/Sidebar";
import { pdf } from "@react-pdf/renderer";
import ClassicPdf from "../components/pdf/ClassicPdf";
import CoverLetterPdf from "../components/pdf/CoverLetterPdf";
import CenteredPdf from "../components/pdf/CenteredPdf";
import TwoColPdf from "../components/pdf/TwoColPdf";
import SidebarPdf from "../components/pdf/SidebarPdf";
// pages/index.js
import "../components/pdf/registerFonts";
import ResumeWizard from "../components/ResumeWizard";


const TEMPLATE_INFO = {
  classic: "Single-column, ATS-first. Clean headings, great for online parsers and conservative employers.",
  twoCol: "Two columns with a compact sidebar. Good when you have many skills and want dense use of space.",
  centered: "Centered header with balanced sections. Reads modern while staying recruiter-friendly.",
  sidebar: "Prominent left sidebar for skills/education; main column for experience. Great for showcasing stack breadth."
};

const PdfMap = {
  classic: ClassicPdf,
  centered: CenteredPdf,
  twoCol: TwoColPdf,
  sidebar: SidebarPdf,
};

export default function Home() {
  const [result, setResult] = useState(null);          // { coverLetter, resumeData }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState("classic"); // classic | twoCol | centered | sidebar

  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState(null);
  const [isScratch, setIsScratch] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [phase, setPhase] = useState("entry"); // entry | target | results

  const resumeScrollRef = useRef(null);
  const [resumePage, setResumePage] = useState(1);
  const [resumePageCount, setResumePageCount] = useState(1);
  const [fullScreen, setFullScreen] = useState(null); // null | 'resume' | 'cover'

  useEffect(() => {
    const scroller = resumeScrollRef.current;
    if (!scroller) return;

    const update = () => {
      const h = scroller.clientHeight || 1;
      const total = Math.ceil(scroller.scrollHeight / h);
      setResumePageCount(Math.max(1, total));
      const current = Math.floor(scroller.scrollTop / h) + 1;
      setResumePage(Math.min(Math.max(current, 1), Math.max(1, total)));
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [result, template]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setFullScreen(null);
    }
    if (fullScreen) {
      window.addEventListener("keydown", handleKey);
    }
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullScreen]);

  function pageResume(dir) {
    const scroller = resumeScrollRef.current;
    if (!scroller) return;
    const h = scroller.clientHeight || 1;
    const next = Math.min(Math.max(resumePage + dir, 1), resumePageCount);
    scroller.scrollTo({ top: (next - 1) * h, behavior: "smooth" });
  }

  const compRef = useRef(null);
  const coverRef = useRef(null);

  const fileInputRef = useRef(null);

  async function handleFileInput(e){
    const f = e.target.files?.[0];
    if(!f) return;
    setError("");
    try{
      setLoading(true);
      const fd = new FormData();
      fd.append("resume", f);
      const res = await fetch("/api/parse-resume", { method:"POST", body: fd });
      const data = await res.json();
      if(!res.ok) throw new Error(data?.error || "Parse failed");
      setWizardData(data.resumeData || {});
      setShowWizard(true);
      setIsScratch(false);
    }catch(err){
      setError(String(err.message || err));
    }finally{
      setLoading(false);
    }
  }

  function startFromScratch(){
    setError("");
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem('resumeBuilderDraft') || 'null'); }catch{}
    setWizardData(saved || null);
    setShowWizard(true);
    setIsScratch(true);
  }

  function handleWizardComplete(data){
    setResumeData(data);
    setShowWizard(false);
    setResult(null);
    setPhase("target");
  }

  function startOver(){
    setResumeData(null);
    setResult(null);
    setJobDesc("");
    setShowWizard(false);
    setWizardData(null);
    setIsScratch(false);
    setPhase("entry");
  }

  async function generateFromData(resumeData, jobDesc){
    setError(""); setResult(null);
    if(!jobDesc.trim()) return setError("Please paste a job description.");
    try{
      setLoading(true);
      const fd = new FormData();
      fd.append("resumeData", JSON.stringify(resumeData));
      fd.append("jobDesc", jobDesc);
      const res = await fetch("/api/generate", { method:"POST", body: fd });
      const data = await res.json();
      if(!res.ok) throw new Error(data?.error || "Generation failed");
      setResult(data);
      setShowWizard(false);
      setPhase("results");
      if(isScratch){ try{ localStorage.removeItem('resumeBuilderDraft'); }catch{} }
    }catch(err){
      setError(String(err.message || err));
    }finally{
      setLoading(false);
    }
  }

  async function downloadCvDocx() {
    if (!result?.resumeData) return;
    const r = await fetch("/api/export-docx-structured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: result.resumeData,
        filename: `${(result.resumeData.name || "resume").replace(/\s+/g, "_")}`
      })
    });
    if (!r.ok) {
      let msg = "Export failed";
      try { const j = await r.json(); if (j?.error) msg = `Export failed: ${j.error}`; } catch {}
      alert(msg);
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(result.resumeData.name || "resume").replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  }

  async function downloadClDocx() {
    if (!result?.coverLetter) return;
    const r = await fetch("/api/export-cover-letter-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter: result.coverLetter,
        filename: `${(result.resumeData?.name || "cover_letter").replace(/\s+/g, "_")}_cover_letter`
      })
    });
    if (!r.ok) {
      let msg = "Export failed";
      try { const j = await r.json(); if (j?.error) msg = `Export failed: ${j.error}`; } catch {}
      alert(msg);
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(result.resumeData?.name || "cover_letter").replace(/\s+/g, "_")}_cover_letter.docx`;
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  }

  // CV PDF via React-PDF
  async function downloadCvPdf() {
    if (!result?.resumeData) return;
    const Comp = PdfMap[template] || ClassicPdf;
    console.log("[pdf] exporting with Inter fonts (regular/medium/semibold/bold)");
    try {
      const blob = await pdf(<Comp data={result.resumeData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(result.resumeData.name || "resume").replace(/\s+/g, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("[pdf] export failed. Ensure font files exist under public/fonts", err);
    }
  }

  // Cover Letter PDF via React-PDF
  async function downloadClPdf() {
    if (!result?.coverLetter) return;
    console.log("[pdf] exporting with Inter fonts (regular/medium/semibold/bold)");
    try {
      const blob = await pdf(<CoverLetterPdf text={result.coverLetter} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(result?.resumeData?.name || "cover_letter").replace(/\s+/g, "_")}_cover_letter.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("[pdf] export failed. Ensure font files exist under public/fonts", err);
    }
  }

  const TemplateView = useMemo(() => {
    switch (template) {
      case "twoCol": return TwoCol;
      case "centered": return Centered;
      case "sidebar": return Sidebar;
      default: return Classic;
    }
  }, [template]);

  return (
    <>
      <Head>
        <title>TailorCV - Build or Upload a Résumé</title>
        <meta
          name="description"
          content="Upload or craft a resume, then tailor it to any job description to generate ATS-friendly resumes and matching cover letters with quick PDF and DOCX downloads."
        />
        <meta
          name="keywords"
          content="AI resume builder, cover letter generator, job description tailoring, ATS, resume wizard, PDF download, DOCX download, CV PDF, cover letter PDF, templates, side-by-side preview, fullscreen preview"
        />
      </Head>
      <main className="tc-container tc-page">
        {phase === 'entry' && (
          <section className="space-y-4">
            {!showWizard && (
              <div className="space-y-3">
                <input type="file" accept=".pdf,.docx,.txt" ref={fileInputRef} className="hidden" onChange={handleFileInput} />
                <div className="flex flex-col gap-2">
                  <button type="button" className="tc-btn-primary" onClick={()=>fileInputRef.current?.click()}>Upload CV</button>
                  <button type="button" className="tc-btn-quiet" onClick={startFromScratch}>Build from scratch</button>
                </div>
              </div>
            )}
            {showWizard && (
              <ResumeWizard
                initialData={wizardData}
                onCancel={()=>setShowWizard(false)}
                onComplete={handleWizardComplete}
                autosaveKey={isScratch ? 'resumeBuilderDraft' : undefined}
                template={template}
                onTemplateChange={setTemplate}
                templateInfo={TEMPLATE_INFO}
              />
            )}
          </section>
        )}

        {phase === 'target' && resumeData && (
          <section className="space-y-4">
            <textarea
              className="tc-textarea"
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the job description"
            />
            <div className="tc-sticky flex justify-between">
              <button type="button" className="tc-btn-quiet" onClick={()=>setJobDesc('')}>Clear JD</button>
              <button type="button" className="tc-btn-primary" onClick={()=>generateFromData(resumeData, jobDesc)}>Generate CV + Cover Letter</button>
            </div>
          </section>
        )}

        {phase === 'results' && result && (
          <section className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="tc-paper cursor-pointer" onClick={()=>setFullScreen('resume')}>
                <div ref={resumeScrollRef}>
                  <TemplateView data={result.resumeData} />
                </div>
              </div>
              <div className="tc-card cursor-pointer" onClick={()=>setFullScreen('cover')}>
                <div ref={coverRef} className="whitespace-pre-wrap leading-6">
                  {result.coverLetter || <div className="opacity-60">No cover letter returned.</div>}
                </div>
              </div>
            </div>
            <div className="tc-sticky flex flex-wrap gap-3 justify-end">
              <div className="flex gap-2">
                <button className="tc-btn-quiet" onClick={downloadCvPdf}>Download CV PDF</button>
                <button className="tc-btn-quiet" onClick={downloadCvDocx}>Download CV DOCX</button>
              </div>
              <div className="flex gap-2">
                <button className="tc-btn-quiet" onClick={downloadClPdf}>Download Cover Letter PDF</button>
                <button className="tc-btn-quiet" onClick={downloadClDocx}>Download Cover Letter DOCX</button>
              </div>
            </div>
          </section>
        )}

        {error && <div className="text-red-600 mt-4">{error}</div>}
      </main>

      {loading && (
        <div className="fixed inset-0 z-[var(--tc-z-overlay)] backdrop-blur bg-bg/80 flex items-center justify-center">
          <div className="tc-card">Generating...</div>
        </div>
      )}

      {fullScreen && (
        <div className="fullscreen-overlay" onClick={() => setFullScreen(null)}>
          <div className="fullscreen-inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-close"
              onClick={() => setFullScreen(null)}
              aria-label="Close preview"
            >
              ×
            </button>
            <div className="a4">
              <div className="a4-inner">
                <div className="a4-scroll">
                  {fullScreen === 'resume' ? (
                    <TemplateView data={result.resumeData} />
                  ) : result?.coverLetter ? (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                      {result.coverLetter}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.6 }}>No cover letter returned.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
