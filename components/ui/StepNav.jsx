import { useEffect } from 'react';

export default function StepNav({ steps, current, onChange, allowNext=true }) {
  useEffect(() => {
    function onKey(e){
      if(e.key==='ArrowRight' && current < steps.length-1 && allowNext) onChange(current+1);
      if(e.key==='ArrowLeft' && current>0) onChange(current-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, steps.length, allowNext, onChange]);

  return (
    <nav className="mb-6">
      <ol className="hidden md:flex items-center gap-4">
        {steps.map((s,i)=>{
          const state = i<current ? 'done' : i===current ? 'active' : 'todo';
          return (
            <li key={s} className="flex items-center cursor-pointer" onClick={()=>{ if(i<=current || allowNext) onChange(i); }}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 ${state==='done'?'bg-[var(--accent)] text-white':state==='active'?'border-2 border-[var(--accent)]':'border border-[var(--rule)]'}`}>{i+1}</span>
              <span className="text-sm">{s}</span>
            </li>
          );
        })}
      </ol>
      <div className="md:hidden h-2 bg-[var(--rule)] rounded">
        <div className="h-full bg-[var(--accent)] rounded" style={{width:`${(current)/(steps.length-1)*100}%`}} />
      </div>
    </nav>
  );
}
