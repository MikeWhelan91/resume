import { useMemo, useRef, useState, useEffect } from "react";
import Head from "next/head";
import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import Centered from "../components/templates/Centered";
import Sidebar from "../components/templates/Sidebar";
import Modern from "../components/templates/Modern";
import { pdf } from "@react-pdf/renderer";
import ClassicPdf from "../components/pdf/ClassicPdf";
import CoverLetterPdf from "../components/pdf/CoverLetterPdf";
import CenteredPdf from "../components/pdf/CenteredPdf";
import TwoColPdf from "../components/pdf/TwoColPdf";
import SidebarPdf from "../components/pdf/SidebarPdf";
// pages/index.js
import "../components/pdf/registerFonts";
import ResumeWizard from "../components/ResumeWizard";
import PageViewport from "../components/ui/PageViewport";


const TEMPLATE_INFO = {
  classic: "Single-column, ATS-first. Clean headings, great for online parsers and conservative employers.",
  twoCol: "Two columns with a compact sidebar. Good when you have many skills and want dense use of space.",
  centered: "Centered header with balanced sections. Reads modern while staying recruiter-friendly.",
  sidebar: "Prominent left sidebar for skills/education; main column for experience. Great for showcasing stack breadth.",
  modern: "Two-column grid with clean hierarchy. ATS-safe by default; subtle accents only in Design mode."
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
  const [template, setTemplate] = useState("classic"); // classic | twoCol | centered | sidebar | modern

  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState(null);
  const [isScratch, setIsScratch] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [coverTone, setCoverTone] = useState("professional");
  const [phase, setPhase] = useState("entry"); // entry | target | results

  const [exportMode, setExportMode] = useState("ats"); // default ATS-first

  // --- menu state ---
  const [docxOpen, setDocxOpen] = useState(false);


  // Close DOCX menu on outside click
  useEffect(() => {
    const close = (e) => {
      const m = document.querySelector(".menu");
      if (m && !m.contains(e.target)) setDocxOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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
    setCoverTone("professional");
    setShowWizard(false);
    setWizardData(null);
    setIsScratch(false);
    setError("");
    setPhase("entry");
  }

  function newJob(){
    setResult(null);
    setJobDesc("");
    setCoverTone("professional");
    setError("");
    setPhase("target");
  }

  async function generateFromData(resumeData, jobDesc, coverTone){
    setError(""); setResult(null);
    if(!jobDesc.trim()) return setError("Please paste a job description.");
    try{
      setLoading(true);
      const fd = new FormData();
      fd.append("resumeData", JSON.stringify(resumeData));
      fd.append("jobDesc", jobDesc);
      fd.append("tone", coverTone);
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

  async function downloadAtsPdf() {
    const data = (result?.resumeData || resumeData);
    if (!data) return;
    const res = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        template,
        mode: exportMode, // "ats" by default; user can flip to "design" if you expose it
        filename: `${data.name}-CV`
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      alert(err?.error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.name || "resume")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
      case "modern": return Modern;
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
            content="Upload or craft a resume, then tailor it to any job description to generate ATS-friendly A4 resumes and matching cover letters. Bullets are rewritten with strong action verbs, quantified achievements, and keyword variants while cross-checking against your resume to avoid fabricated experience, with selectable tone, quick ATS-optimized PDF and DOCX downloads, and accurate side-by-side A4 previews that open fullscreen on click. Reuse your CV for multiple job descriptions or upload a new one anytime."
          />
          <meta
            name="keywords"
              content="AI resume builder, cover letter generator, job description tailoring, skill cross-referencing, verified skills, willingness to learn, action verbs, quantified achievements, keyword variants, accuracy check, resume verification, cover letter tone selection, tone selector, reuse CV, multiple job descriptions, upload new resume, ATS, resume wizard, PDF download, DOCX download, CV PDF, cover letter PDF, templates, template preview, side-by-side preview, fullscreen preview, A4 resume preview, A4 cover letter preview, accurate cover letter preview, ATS PDF export, ATS optimized PDF, modern resume template"

            />
        </Head>
      {phase === 'results' && result ? (
        <div className="shell">
          <main className="workspace">
            {/* LEFT: CV A4 preview */}
            <section className="pane">
              <PageViewport ariaLabel="CV preview">
                <div className="paper">
                  <TemplateView data={result.resumeData} />
                </div>
              </PageViewport>
            </section>

            {/* RIGHT: Cover letter A4 preview */}
            <section className="pane">
              <PageViewport ariaLabel="Cover letter preview">
                <div className="paper cover-letter">
                  <div className="whitespace-pre-wrap text-[11px] leading-[1.6]">
                    {result.coverLetter || (
                      <div className="opacity-60">No cover letter returned.</div>
                    )}
                  </div>
                </div>
              </PageViewport>
            </section>
          </main>

          <div className="toolbar">
            <div className="group">
              <button className="btn" onClick={newJob}>New Job Description</button>
              <button className="btn" onClick={startOver}>Upload New CV</button>
            </div>

            <div className="group">
              {/* DOCX dropdown */}
              <div className={`menu ${docxOpen ? "open" : ""}`}>
                <button type="button" className="menu-btn" onClick={() => setDocxOpen(v=>!v)} aria-haspopup="menu" aria-expanded={docxOpen}>
                  Export DOCX ▾
                </button>
                <div className="menu-pop" role="menu">
                  <button className="menu-item" role="menuitem" onClick={() => { setDocxOpen(false); downloadCvDocx(); }}>
                    Download CV as DOCX
                  </button>
                  <button className="menu-item" role="menuitem" onClick={() => { setDocxOpen(false); downloadClDocx(); }}>
                    Download Cover Letter as DOCX
                  </button>
                </div>
              </div>

              {template !== "modern" && (
                <button className="btn" onClick={downloadCvPdf}>Download CV PDF</button>
              )}
              <button className="btn" onClick={downloadClPdf}>Download Cover Letter PDF</button>

              <label className="btn-ghost" style={{marginLeft:8}}>Mode</label>
              <select className="select" value={exportMode} onChange={e=>setExportMode(e.target.value)}>
                <option value="ats">ATS (recommended)</option>
                <option value="design">Design</option>
              </select>

              <button className="btn btn-primary" onClick={downloadAtsPdf}>Download ATS PDF</button>
            </div>
          </div>
        </div>
      ) : (
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
              <label className="block">
                <span className="text-sm">Cover Letter Tone</span>
                <select
                  className="tc-input mt-1"
                  value={coverTone}
                  onChange={e => setCoverTone(e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </label>
              <div className="tc-sticky flex justify-between">
                <button type="button" className="tc-btn-quiet" onClick={()=>setJobDesc('')}>Clear JD</button>
                <button type="button" className="tc-btn-primary" onClick={()=>generateFromData(resumeData, jobDesc, coverTone)}>Generate CV + Cover Letter</button>
              </div>
            </section>
          )}

          {error && <div className="text-red-600 mt-4">{error}</div>}
        </main>
      )}

      {loading && (
        <div className="fixed inset-0 z-[var(--tc-z-overlay)] backdrop-blur bg-bg/80 flex items-center justify-center">
          <div className="tc-card">Generating...</div>
        </div>
      )}

    </>
  );
}
