import { useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function HeroUpload() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    setLoading(true);
    try{
      const fd = new FormData();
      fd.append('resume', f);
      const res = await fetch('/api/parse-resume',{method:'POST', body:fd});
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.resumeData||{}));
        router.push('/wizard');
      }
    }finally{ setLoading(false); }
  }

  async function handlePaste(){
    if(!pasteText.trim()) return;
    setLoading(true);
    try{
      const fd = new FormData();
      fd.append('text', pasteText);
      const res = await fetch('/api/parse-resume',{method:'POST', body:fd});
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.resumeData||{}));
        router.push('/wizard');
      }
    }finally{
      setLoading(false);
      setShowPaste(false);
    }
  }

  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-bold text-[var(--ink)] mb-4">
        Land interviews with an <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-no-repeat [background-size:100%_6px] [background-position:0_100%]">ATS-ready CV.</span>
      </h1>
      <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-8">
        Upload your CV, paste a job description, and get a tailored CV + cover letter in minutes—no gimmicks, no dark patterns.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
        <button className="tc-btn-primary" onClick={()=>fileRef.current?.click()} disabled={loading}>Upload your CV</button>
        <button className="tc-btn-quiet" onClick={()=>setShowPaste(true)} disabled={loading}>Paste CV text</button>
      </div>
      <div className="text-xs text-[var(--muted)]">Files are processed in memory and discarded. Nothing is stored.</div>

      {showPaste && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onKeyDown={e=>{if(e.key==='Escape') setShowPaste(false);}}>
          <div className="bg-white p-6 rounded-xl max-w-lg w-full space-y-4">
            <textarea className="w-full h-40 border border-[var(--rule)] rounded-lg p-2" value={pasteText} onChange={e=>setPasteText(e.target.value)} aria-label="Paste CV text" />
            <div className="flex justify-end gap-2">
              <button className="tc-btn-quiet" onClick={()=>setShowPaste(false)}>Cancel</button>
              <button className="tc-btn-primary" onClick={handlePaste} disabled={loading}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
