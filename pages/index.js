import { useMemo, useRef, useState, useEffect } from "react";
import Head from "next/head";
import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import Centered from "../components/templates/Centered";
import Sidebar from "../components/templates/Sidebar";

const TEMPLATE_INFO = {
  classic: "Single-column, ATS-first. Clean headings, great for online parsers and conservative employers.",
  twoCol: "Two columns with a compact sidebar. Good when you have many skills and want dense use of space.",
  centered: "Centered header with balanced sections. Reads modern while staying recruiter-friendly.",
  sidebar: "Prominent left sidebar for skills/education; main column for experience. Great for showcasing stack breadth."
};

export default function Home() {
  const [resume, setResume] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);          // { coverLetter, resumeData }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [template, setTemplate] = useState("classic"); // classic | twoCol | centered | sidebar

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

  async function handleSubmit(e){
    e.preventDefault();
    setError(""); setResult(null);

    if (!resume) return setError("Please upload a resume (PDF or DOCX).");
    if (!jobDesc.trim()) return setError("Please paste a job description.");

    try{
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDesc", jobDesc);

      const res = await fetch("/api/generate", { method:"POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setResult(data);
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

  async function elementToPdf(node, filename) {
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import("jspdf"),
      import("html2canvas").then(m => m.default || m)
    ]);

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // temporarily remove preview scale so capture is 1:1
    const scaleWrapper = node.closest(".a4-scale");
    const prevTransform = scaleWrapper ? scaleWrapper.style.transform : null;
    if (scaleWrapper) scaleWrapper.style.transform = "none";

    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });

    if (scaleWrapper) scaleWrapper.style.transform = prevTransform || "";

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const pageCanvasH = (pageH * canvasW) / pageW; // canvas px height for one PDF page
    let renderedH = 0;

    while (renderedH < canvasH) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasW;
      const sliceH = Math.min(pageCanvasH, canvasH - renderedH);
      pageCanvas.height = sliceH;
      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, renderedH, canvasW, sliceH, 0, 0, canvasW, sliceH);
      const img = pageCanvas.toDataURL("image/png");
      if (renderedH > 0) pdf.addPage();
      const pdfPageH = pageH * (sliceH / pageCanvasH);
      pdf.addImage(img, "PNG", 0, 0, pageW, pdfPageH, undefined, "FAST");
      renderedH += sliceH;
    }

    pdf.save(filename);
  }

  async function downloadCvPdf() {
    if (!result?.resumeData) return;
    if (resumeScrollRef?.current) {
      const fname = `${(result.resumeData.name || "resume").replace(/\s+/g, "_")}_CV.pdf`;
      await elementToPdf(resumeScrollRef.current, fname);
    }
  }

  async function downloadClPdf() {
    if (!result?.coverLetter) return;
    if (coverRef?.current) {
      const fname = `${(result.resumeData?.name || "cover_letter").replace(/\s+/g, "_")}_cover_letter.pdf`;
      await elementToPdf(coverRef.current, fname);
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
        <title>TailorCV - AI Résumé + Cover Letter</title>
        <meta
          name="description"
          content="Generate tailored, ATS-friendly resumes and cover letters with side-by-side and fullscreen previews plus one-click, pixel-perfect PDF and DOCX downloads for CVs and cover letters."
        />
        <meta
          name="keywords"
          content="AI resume, cover letter, ATS, PDF download, DOCX download, CV PDF, cover letter PDF, templates, side-by-side preview, fullscreen preview, pixel-perfect"
        />
      </Head>

      {/* Two-column screen layout: controls left, results right */}
      <main style={{maxWidth:1200, margin:"24px auto", padding:"0 16px", display:"grid", gridTemplateColumns:"360px 1fr", gap:20}}>
        {/* LEFT: Controls */}
        <section style={{display:"grid", gap:12, alignContent:"start"}}>
          <h1 style={{fontSize:24, marginBottom:4}}>AI Résumé + Cover Letter</h1>

          <form onSubmit={handleSubmit} style={{display:"grid", gap:12}}>
            <div>
              <label style={{display:"block", fontWeight:600, marginBottom:6}}>Upload resume (PDF/DOCX):</label>
              <input type="file" accept=".pdf,.docx,.txt" onChange={e=>setResume(e.target.files?.[0]||null)} />
            </div>

            <div>
              <label style={{display:"block", fontWeight:600, marginBottom:6}}>Job description:</label>
              <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} rows={10} style={{width:"100%"}} />
              <div style={{marginTop:6}}>
                <button type="button" onClick={()=>setJobDesc("")}>Clear</button>
              </div>
            </div>

            <div>
              <label style={{display:"block", fontWeight:600, marginBottom:6}}>Select a template:</label>
              <select value={template} onChange={e=>setTemplate(e.target.value)}>
                <option value="classic">Classic (ATS)</option>
                <option value="twoCol">Two-Column</option>
                <option value="centered">Centered Header</option>
                <option value="sidebar">Sidebar</option>
              </select>
              <div style={{marginTop:8, fontSize:12, color:"#475569", border:"1px solid #e2e8f0", borderRadius:6, padding:"8px 10px", background:"#fff"}}>
                {TEMPLATE_INFO[template]}
              </div>
            </div>

            <div style={{display:"flex", gap:12, alignItems:"center"}}>
              <button type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>

          {error && <div style={{color:"#b91c1c"}}>{error}</div>}
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
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
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
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
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
