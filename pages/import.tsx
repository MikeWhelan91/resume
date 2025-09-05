import { useState } from 'react';
import Head from 'next/head';
import { saveResume } from '../lib/resume/storage';
import { Resume } from '../lib/schema/resume';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ resume: Resume; confidences: Record<string,string> } | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parse', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Parse failed');
    } else {
      setResult(data);
      saveResume(data.resume);
    }
  }

  return (
    <>
      <Head>
        <title>Import Resume - TailorCV</title>
        <meta name="description" content="Import an existing resume for editing." />
      </Head>
      <main className="p-4 max-w-xl mx-auto">
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Upload</button>
            {error && <p className="text-red-600">{error}</p>}
          </form>
        )}
        {result && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Parsed!</h2>
            <ul className="list-disc ml-4">
              {Object.entries(result.confidences).map(([k, v]) => (
                <li key={k}>{k}: {v}</li>
              ))}
            </ul>
            <a href="/builder" className="bg-green-600 text-white px-4 py-2 rounded inline-block">Edit Data</a>
          </div>
        )}
      </main>
    </>
  );
}
