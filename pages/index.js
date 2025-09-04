import { useMemo, useRef, useState } from "react";
import Head from "next/head";
import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import { useReactToPrint } from "react-to-print";

export default function Home() {
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);          // { coverLetter, resumeData }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [template, setTemplate] = useState("classic"); // "classic" | "twoCol"
  const [useMyLayout, setUseMyLayout] = useState(true);
  const [exportType, setExportType] = useState("pdf"); // "pdf" | "docx"

  const compRef = useRef(null);
  const handlePrint = useReactToPrint({ content: () => compRef.current });

  async function inferTemplateIfNeeded() {
    if (!useMyLayout || !resume) return;
    const formData = new FormData();
    formData.append("resume", resume);
    try{
      const r = await fetch("/api/infer-layout", { method:"POST", body: formData });
      const j = await r.json();
      if (j?.template === "twoCol" || j?.template === "classic") setTemplate(j.template);
    }catch(_) {}
  }

  async function handleSubmit(e){
    e.preventDefault();
    setError(""); setResult(null);

    if (!resume) return setError("Please upload a resume (PDF or DOCX).");
    if (!jobDesc.trim()) return setError("Please paste a job description.");

    await inferTemplateIfNeeded();

    try{
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resume);
      if (coverLetter) formData.append("coverLetter", coverLetter);
      formData.append("jobDesc", jobDesc);

      const res = await fetch("/api/generate", { method:"POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(`${data?.code || "E_UNKNOWN"}: ${data?.error || "Request failed"}`);
        return;
      }
      setResult(data); // { coverLetter, resumeData }
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

  const TemplateView = useMemo(()=> template === "twoCol" ? TwoCol : Classic, [template]);

  return (
    <>
      <Head>
        <title>TailorCV - AI Résumé + Cover Letter</title>
        <meta name="description" content="Generate tailored, ATS-friendly resumes and cover letters with PDF and DOCX export options." />
        <meta name="keywords" content="AI resume, cover letter, ATS, PDF, DOCX, templates" />
      </Head>

      <main style={{maxWidth:980, margin:"24px auto", padding:"0 12px"}}>
        <h1 style={{fontSize:24, marginBottom:8}}>AI Résumé + Cover Letter</h1>

        <form onSubmit={handleSubmit} style={{display:"grid", gap:12, marginBottom:16}}>
          <div>
            <label>Upload resume (PDF/DOCX): </label>
            <input type="file" accept=".pdf,.docx,.txt" onChange={e=>setResume(e.target.files?.[0]||null)} />
          </div>
          <div>
            <label>Optional previous cover letter: </label>
            <input type="file" accept=".pdf,.docx,.txt" onChange={e=>setCoverLetter(e.target.files?.[0]||null)} />
          </div>
          <div>
            <label>Job description:</label>
            <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} rows={8} style={{width:"100%"}} />
          </div>

          <div style={{display:"flex", gap:16, alignItems:"center"}}>
            <label><input type="checkbox" checked={useMyLayout} onChange={e=>setUseMyLayout(e.target.checked)} /> Use my CV layout (auto-detect)</label>
            <span style={{opacity:.6}}>Detected/Chosen template:</span>
            <select value={template} onChange={e=>setTemplate(e.target.value)}>
              <option value="classic">Classic (ATS)</option>
              <option value="twoCol">Two-Column</option>
            </select>
            <span style={{marginLeft:12, opacity:.6}}>Export:</span>
            <select value={exportType} onChange={e=>setExportType(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
            </select>
            <button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
          </div>
        </form>

        {error && <div style={{color:"#b91c1c", marginBottom:8}}>{error}</div>}

        {result?.resumeData && (
          <section style={{border:"1px solid #e5e7eb", borderRadius:8, padding:12, background:"#fff"}}>
            <div ref={compRef}><TemplateView data={result.resumeData} /></div>
            <div style={{display:"flex", gap:8, marginTop:10}}>
              <button onClick={() => exportType==="pdf" ? handlePrint() : downloadDocx()}>
                {exportType==="pdf" ? "Download PDF" : "Download DOCX"}
              </button>
              <button onClick={handlePrint}>Print</button>
            </div>
          </section>
        )}

        {result?.coverLetter && (
          <section style={{marginTop:18}}>
            <h2>Cover Letter</h2>
            <textarea readOnly value={result.coverLetter} rows={10} style={{width:"100%"}} />
          </section>
        )}
      </main>
    </>
  );
}
