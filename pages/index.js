import { useState } from "react";
import Head from "next/head";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Tabs, TabList, Tab, TabPanel } from "../components/ui/Tabs";
import Textarea from "../components/ui/Textarea";
import FileInput from "../components/ui/FileInput";
import ToggleTheme from "../components/ui/ToggleTheme";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";

export default function Home() {
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("ats");       // "default" | "ats"
  const [tighten, setTighten] = useState(1);     // 0..2
  const [coverage, setCoverage] = useState({ pct: 0, covered: [], missing: [] });
  const { show: toast, Toast } = useToast();

  function extractKeywords(text) {
    return Array.from(
      new Set(
        String(text || "")
          .toLowerCase()
          .replace(/[^a-z0-9+.#/\s-]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2 && !["with","and","for","the","you","our","this","that","are","from"].includes(w))
      )
    );
  }
  function computeCoverage(jd, out) {
    const jdT = extractKeywords(jd);
    const outT = extractKeywords(out);
    const covered = jdT.filter((t) => outT.includes(t));
    const missing = jdT.filter((t) => !outT.includes(t)).slice(0, 15);
    const pct = Math.round((covered.length / Math.max(1, jdT.length)) * 100);
    return { pct, covered, missing };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setCoverage({ pct: 0, covered: [], missing: [] });

    if (!resume) return setError("Please upload a resume (PDF or DOCX).");
    if (!jobDesc.trim()) return setError("Please paste a job description.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resume);
      if (coverLetter) formData.append("coverLetter", coverLetter);
      formData.append("jobDesc", jobDesc);
      formData.append("mode", mode);
      formData.append("tighten", String(tighten));

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setResult(data);
      const allOut = (data.coverLetter || "") + "\n" + (data.resume || "");
      setCoverage(computeCoverage(jobDesc, allOut));
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast("Copied to clipboard");
    } catch (_) {}
  };

  const downloadDocx = async (content, filename) => {
    const res = await fetch("/api/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Download failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Download started");
  };

  return (
    <div className="app-container">
      <Head>
        <title>TailorCV - ATS Resume & Cover Letter Generator</title>
        <meta
          name="description"
          content="Generate ATS-friendly resumes and cover letters with keyword coverage and conciseness control using TailorCV's AI tool."
        />
        <meta
          name="keywords"
          content="ATS resume, cover letter, AI resume generator, keyword coverage, conciseness slider"
        />
      </Head>
      <div className="container">
        <header className="header">
          <h1>TailorCV</h1>
          <ToggleTheme />
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid-two">
                <FileInput
                  id="resume"
                  label="Resume (PDF or DOCX)"
                  accept=".pdf,.docx"
                  onChange={(e) => setResume(e.target.files[0] || null)}
                  helper="Required"
                  disabled={loading}
                />
                <FileInput
                  id="coverLetter"
                  label="Existing Cover Letter (optional)"
                  accept=".docx,.txt"
                  onChange={(e) => setCoverLetter(e.target.files[0] || null)}
                  helper="Optional"
                  disabled={loading}
                />
              </div>
              <Textarea
                id="jobDesc"
                label="Job Description"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={8}
                helper="Paste job description"
                showCount
                disabled={loading}
              />
              <label className="block text-sm font-medium mb-1">Mode</label>
              <div className="flex gap-3 mb-4">
                <label><input type="radio" name="mode" checked={mode==="ats"} onChange={()=>setMode("ats")} /> ATS</label>
                <label><input type="radio" name="mode" checked={mode==="default"} onChange={()=>setMode("default")} /> Default</label>
              </div>

              <label className="block text-sm font-medium mb-1">Conciseness</label>
              <input type="range" min="0" max="2" value={tighten} onChange={e=>setTighten(Number(e.target.value))} />
              <Button type="submit" loading={loading} className="full-width">
                Generate
              </Button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </form>

        {loading && (
          <div style={{ marginTop: "2rem" }}>
            <Skeleton className="full-width" style={{ height: "16rem" }} />
          </div>
        )}

        {!loading && result && (
          <section style={{ marginTop: "2rem" }}>
            {(result && (result.coverLetter || result.resume)) && (
              <div className="my-4 p-3 border rounded">
                <div>Keyword coverage: <strong>{coverage.pct}%</strong></div>
                {coverage.missing.length > 0 && (
                  <div className="text-xs opacity-80 mt-1">Top missing: {coverage.missing.slice(0,8).join(", ")}</div>
                )}
              </div>
            )}
            <Tabs defaultValue="cl">
              <TabList>
                <Tab value="cl">Cover Letter</Tab>
                <Tab value="cv">Resume</Tab>
              </TabList>
              <TabPanel value="cl">
                <Card style={{ marginTop: "1rem" }}>
                  <CardContent>
                    <div className="actions">
                      <Button variant="outline" onClick={() => copyText(result.coverLetter)}>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadDocx(result.coverLetter, "Cover-Letter.docx")}
                      >
                        Download .docx
                      </Button>
                    </div>
                    <pre>{result.coverLetter}</pre>
                  </CardContent>
                </Card>
              </TabPanel>
              <TabPanel value="cv">
                <Card style={{ marginTop: "1rem" }}>
                  <CardContent>
                    <div className="actions">
                      <Button variant="outline" onClick={() => copyText(result.resume)}>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadDocx(result.resume, "Tailored-Resume.docx")}
                      >
                        Download .docx
                      </Button>
                    </div>
                    <pre>{result.resume}</pre>
                  </CardContent>
                </Card>
              </TabPanel>
            </Tabs>
          </section>
        )}
      </div>
      <Toast />
    </div>
  );
}
