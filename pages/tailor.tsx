import { useState } from 'react';
import Head from 'next/head';
import { loadResume, saveResume } from '../lib/resume/storage';

export default function TailorPage() {
  const [jd, setJd] = useState('');
  const [coverage, setCoverage] = useState(0);
  const [letter, setLetter] = useState('');

  const resume = loadResume();

  function analyze() {
    const jdWords = new Set(jd.toLowerCase().split(/[^a-z0-9]+/));
    const resumeWords = new Set(JSON.stringify(resume).toLowerCase().split(/[^a-z0-9]+/));
    let match = 0;
    jdWords.forEach(w => { if (resumeWords.has(w)) match++; });
    setCoverage(Math.round((match / jdWords.size) * 100));
  }

  async function generateCV() {
    const res = await fetch('/api/tailor/cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription: jd }),
    });
    const data = await res.json();
    if (res.ok) {
      saveResume(data.resume);
      alert('Tailored resume saved.');
    }
  }

  async function generateLetter() {
    const res = await fetch('/api/tailor/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription: jd }),
    });
    const data = await res.json();
    if (res.ok) setLetter(data.letter);
  }

  return (
    <>
      <Head>
        <title>Tailor CV - TailorCV</title>
        <meta name="description" content="Tailor your resume to a job description." />
      </Head>
      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste job description" className="w-full h-40 border p-2" />
        <div className="flex gap-2">
          <button onClick={analyze} className="border px-2 py-1">Analyze</button>
          <button onClick={generateCV} className="border px-2 py-1">Generate Targeted CV</button>
          <button onClick={generateLetter} className="border px-2 py-1">Generate Cover Letter</button>
        </div>
        <div>Coverage: {coverage}%</div>
        {letter && <pre className="whitespace-pre-wrap border p-2">{letter}</pre>}
      </main>
    </>
  );
}
