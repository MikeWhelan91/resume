import { useEffect, useRef, useState, useMemo } from "react";
import Head from "next/head";
import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import Centered from "../components/templates/Centered";
import Sidebar from "../components/templates/Sidebar";
import { useReactToPrint } from "react-to-print";

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
  const [exportType, setExportType] = useState("pdf"); // pdf | docx

  const resumeScrollRef = useRef(null);
  const [resumePage, setResumePage] = useState(1);
  const [resumePageCount, setResumePageCount] = useState(1);

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

  function pageResume(dir) {
    const scroller = resumeScrollRef.current;
    if (!scroller) return;
    const h = scroller.clientHeight || 1;
    const next = Math.min(Math.max(resumePage + dir, 1), resumePageCount);
    scroller.scrollTo({ top: (next - 1) * h, behavior: "smooth" });
  }

  const compRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => compRef.current,
    documentTitle: `${result?.resumeData?.name || "Resume"}`
  });

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

  async function downloadDocx() {
    if (!result?.resumeData) return;
    const r = await fetch("/api/export-docx-structured", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ data: result.resumeData, filename: `${(result.resumeData.name||"resume").replace(/\s+/g,"_")}` })
    });
    if (!r.ok) return alert("Export failed");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(result.resumeData.name||"resume").replace(/\s+/g,"_")}.docx`;
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
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
        <meta name="description" content="Generate tailored, ATS-friendly resumes and cover letters with PDF and DOCX export options." />
        <meta name="keywords" content="AI resume, cover letter, ATS, PDF, DOCX, templates" />
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
              <div>
                <label style={{display:"block", fontWeight:600, marginBottom:6}}>Export:</label>
                <select value={exportType} onChange={e=>setExportType(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>

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
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  alignItems: "start",
                  minWidth: 980
                }}
              >
                {/* A4 CV PREVIEW (paged) */}
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
                          onClick={() => pageResume(-1)}
                          disabled={resumePage <= 1}
                          aria-label="Previous CV page"
                        >
                          ‹
                        </button>
                        <button
                          className="pager-btn"
                          onClick={() => pageResume(1)}
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

                {/* A4 COVER LETTER PREVIEW */}
                <div className="a4">
                  <div className="a4-inner">
                    <div className="a4-scroll">
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

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => (exportType === "pdf" ? handlePrint() : downloadDocx())}>
                  {exportType === "pdf" ? "Download PDF" : "Download DOCX"}
                </button>
                <button onClick={handlePrint}>Print</button>
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>Your generated résumé will appear here.</div>
          )}

          {/* Keep existing action buttons (Download/Print) BELOW the previews if you prefer.
              If you want them above, move them accordingly. */}
        </section>
      </main>
    </>
  );
}
