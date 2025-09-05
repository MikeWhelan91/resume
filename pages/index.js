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

  function handleWizardComplete(data, jobDesc){
    generateFromData(data, jobDesc);
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
          content="Upload a CV or build one from scratch in a guided wizard, then generate a tailored, ATS-friendly resume and matching cover letter with quick PDF and DOCX downloads."
        />
        <meta
          name="keywords"
          content="AI resume builder, cover letter generator, ATS, resume wizard, PDF download, DOCX download, CV PDF, cover letter PDF, templates, side-by-side preview, fullscreen preview"
        />
      </Head>

      {/* Two-column screen layout: controls left, results right */}
      <main style={{maxWidth:1200, margin:"24px auto", padding:"0 16px", display:"grid", gridTemplateColumns:"360px 1fr", gap:20}}>
        {/* LEFT: Controls */}
        <section style={{display:"grid", gap:12, alignContent:"start"}}>
          <h1 style={{fontSize:24, marginBottom:4}}>AI Résumé + Cover Letter</h1>

          {!showWizard && !result && (
            <div style={{display:"grid", gap:12}}>
              <input type="file" accept=".pdf,.docx,.txt" ref={fileInputRef} style={{display:"none"}} onChange={handleFileInput} />
              <button type="button" onClick={()=>fileInputRef.current?.click()}>Upload CV</button>
              <button type="button" onClick={startFromScratch}>Build from scratch</button>
            </div>
          )}

          {showWizard && !result && (
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

          {result && (
            <div style={{display:"grid", gap:8}}>
              <button type="button" onClick={()=>{ setResult(null); setShowWizard(false); }}>Start over</button>
            </div>
          )}

          {error && <div style={{color:"#b91c1c"}}>{error}</div>}
          {loading && <div>Loading...</div>}
        </section>

        {/* RIGHT: Results container (two A4 columns) */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            background: "#fff",
            overflow: "auto",
            maxHeight: "85vh"
          }}
        >
          {result?.resumeData ? (
            <>
              <div
                className="resultGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto",
                  gap: 16,
                  alignItems: "start",
                  minWidth: 0,
                  justifyContent: "center"
                }}
              >
                {/* A4 CV PREVIEW (paged) */}
                <div className="a4-scale" onClick={() => setFullScreen('resume')} style={{cursor:'pointer'}}>
                  <div className="a4">
                    <div className="a4-inner">
                      <div ref={resumeScrollRef} className="a4-scroll">
                        <div ref={compRef}>
                          <TemplateView data={result.resumeData} />
                        </div>
                      </div>
                    </div>

                    {resumePageCount > 1 && (
                      <>
                        <div className="pager">
                          <button
                            className="pager-btn"
                            onClick={(e) => { e.stopPropagation(); pageResume(-1); }}
                            disabled={resumePage <= 1}
                            aria-label="Previous CV page"
                          >
                            ‹
                          </button>
                          <button
                            className="pager-btn"
                            onClick={(e) => { e.stopPropagation(); pageResume(1); }}
                            disabled={resumePage >= resumePageCount}
                            aria-label="Next CV page"
                          >
                            ›
                          </button>
                        </div>
                        <div className="pageIndicator">
                          {resumePage}/{resumePageCount}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* A4 COVER LETTER PREVIEW */}
                <div className="a4-scale" onClick={() => setFullScreen('cover')} style={{cursor:'pointer'}}>
                  <div className="a4">
                    <div className="a4-inner">
                      <div ref={coverRef} className="a4-scroll">
                        {result?.coverLetter ? (
                          <div ref={coverRef} style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
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

              <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:10}}>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={downloadCvPdf}>Download CV PDF</button>
                  <button onClick={downloadCvDocx}>Download CV DOCX</button>
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={downloadClPdf}>Download Cover Letter PDF</button>
                  <button onClick={downloadClDocx}>Download Cover Letter DOCX</button>
                </div>

              </div>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>Your generated résumé will appear here.</div>
          )}

          {/* Keep action buttons BELOW the previews if you prefer.
              If you want them above, move them accordingly. */}
        </section>
      </main>
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
