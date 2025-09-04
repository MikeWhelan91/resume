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
  const { show: toast, Toast } = useToast();

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
    <div className="min-h-screen bg-bg">
      <Head>
        <title>TailorCV - AI Resume & Cover Letter Generator</title>
        <meta
          name="description"
          content="Generate a tailored resume and cover letter for any job using TailorCV's simple AI-powered tool."
        />
      </Head>
      <div className="mx-auto max-w-3xl p-4">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">TailorCV</h1>
          <ToggleTheme />
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Button type="submit" loading={loading} className="w-full">
                Generate
              </Button>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </form>

        {loading && (
          <div className="mt-8">
            <Skeleton className="h-64" />
          </div>
        )}

        {!loading && result && (
          <section className="mt-8">
            <Tabs defaultValue="cl">
              <TabList>
                <Tab value="cl">Cover Letter</Tab>
                <Tab value="cv">Resume</Tab>
              </TabList>
              <TabPanel value="cl">
                <Card className="mt-4">
                  <CardContent className="p-0">
                    <div className="sticky top-0 flex justify-end gap-2 border-b border-border bg-card p-2">
                      <Button variant="outline" onClick={() => copyText(result.coverLetter)}>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          downloadDocx(result.coverLetter, "Cover-Letter.docx")
                        }
                      >
                        Download .docx
                      </Button>
                    </div>
                    <pre className="max-h-[70vh] overflow-auto p-4 font-mono text-sm">
                      {result.coverLetter}
                    </pre>
                  </CardContent>
                </Card>
              </TabPanel>
              <TabPanel value="cv">
                <Card className="mt-4">
                  <CardContent className="p-0">
                    <div className="sticky top-0 flex justify-end gap-2 border-b border-border bg-card p-2">
                      <Button variant="outline" onClick={() => copyText(result.resume)}>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          downloadDocx(result.resume, "Tailored-Resume.docx")
                        }
                      >
                        Download .docx
                      </Button>
                    </div>
                    <pre className="max-h-[70vh] overflow-auto p-4 font-mono text-sm">
                      {result.resume}
                    </pre>
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
