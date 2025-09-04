// pages/index.js
import { useState } from "react";

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">TailorCV</h1>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded border max-w-3xl">
        <div className="flex gap-3">
          <input type="file" accept=".pdf,.docx" onChange={(e) => setResume(e.target.files[0] || null)} />
          <input type="file" accept=".docx,.txt" onChange={(e) => setCoverLetter(e.target.files[0] || null)} />
        </div>
        <textarea
          className="w-full p-2 border rounded"
          rows={6}
          placeholder="Paste job description here"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      {result && (
        <div className="max-w-5xl">
          <Tabs active={tab} setActive={setTab} />
          <div className="mt-3 bg-white p-4 rounded border">
            {tab === "cl" ? (
              <>
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
                <pre className="whitespace-pre-wrap">{result.coverLetter || "(empty)"}</pre>
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button className="px-3 py-1 border rounded" onClick={() => copyText(result.resume)}>
                    Copy
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => downloadDocx(result.resume, "Tailored-Resume.docx")}
                  >
                    Download .docx
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{result.resume || "(empty)"}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
