// pages/index.js
import { useState } from "react";
import Head from "next/head";

function Tabs({ active, setActive }) {
  return (
    <div className="mt-6 inline-flex rounded border overflow-hidden">
      <button
        onClick={() => setActive("cl")}
        className={`px-4 py-2 ${active === "cl" ? "bg-blue-600 text-white" : "bg-white"}`}
      >
        Cover Letter
      </button>
      <button
        onClick={() => setActive("cv")}
        className={`px-4 py-2 border-l ${active === "cv" ? "bg-blue-600 text-white" : "bg-white"}`}
      >
        Resume
      </button>
    </div>
  );
}

export default function Home() {
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("cl");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!resume) return setError("Please upload a resume (PDF or DOCX).");
    if (!jobDesc.trim()) return setError("Please paste a job description.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resume);
      if (coverLetter) formData.append("coverLetter", coverLetter);
      formData.append("jobDesc", jobDesc);

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setResult(data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
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
  };

  const previewHtml = (text) =>
    `<!DOCTYPE html><html><head><style>body{font-family:Arial, sans-serif;padding:1rem;white-space:pre-wrap;}</style></head><body>${
      (text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
    }</body></html>`;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Head>
        <title>TailorCV - AI Resume & Cover Letter Generator</title>
        <meta
          name="description"
          content="Generate a tailored resume and cover letter for any job using TailorCV's simple AI-powered tool."
        />
      </Head>
      <h1 className="text-4xl font-bold text-center mb-8">TailorCV</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded border max-w-3xl mx-auto"
      >
        <h2 className="text-xl font-semibold">Upload Documents</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1 font-medium" htmlFor="resume">
              Resume (PDF or DOCX)
            </label>
            <input
              id="resume"
              className="w-full p-2 border rounded"
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setResume(e.target.files[0] || null)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="coverLetter">
              Existing Cover Letter (optional)
            </label>
            <input
              id="coverLetter"
              className="w-full p-2 border rounded"
              type="file"
              accept=".docx,.txt"
              onChange={(e) => setCoverLetter(e.target.files[0] || null)}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="jobDesc">
            Job Description
          </label>
          <textarea
            id="jobDesc"
            className="w-full p-3 border rounded"
            rows={8}
            placeholder="Paste job description here"
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      {result && (
        <section className="max-w-5xl mx-auto">
          <Tabs active={tab} setActive={setTab} />
          <div className="mt-3 bg-white p-4 rounded border">
            {tab === "cl" ? (
              <>
                <h2 className="text-lg font-semibold mb-2">Cover Letter Preview</h2>
                <div className="flex gap-2 mb-3">
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => copyText(result.coverLetter)}
                  >
                    Copy
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => downloadDocx(result.coverLetter, "Cover-Letter.docx")}
                  >
                    Download .docx
                  </button>
                </div>
                <iframe
                  className="w-full h-96 border rounded"
                  srcDoc={previewHtml(result.coverLetter)}
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-2">Resume Preview</h2>
                <div className="flex gap-2 mb-3">
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => copyText(result.resume)}
                  >
                    Copy
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => downloadDocx(result.resume, "Tailored-Resume.docx")}
                  >
                    Download .docx
                  </button>
                </div>
                <iframe
                  className="w-full h-96 border rounded"
                  srcDoc={previewHtml(result.resume)}
                />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
