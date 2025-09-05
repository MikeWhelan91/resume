import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Docker', 'AWS', 'CSS', 'HTML'
];

export default function SkillsInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function commit(raw) {
    if (!raw) return;
    const parts = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    const existing = new Set(value.map(v => v.toLowerCase()));
    const next = [...value];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (!existing.has(key)) {
        existing.add(key);
        next.push(p);
      }
    }
    if (next.length !== value.length) onChange(next);
  }

  function handleAdd() {
    commit(input);
    setInput('');
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text');
    if (text && /[\n,]/.test(text)) {
      e.preventDefault();
      commit(text);
      setInput('');
    }
  }

  function remove(skill) {
    onChange(value.filter(s => s !== skill));
  }

  const suggestions = input
    ? COMMON_SKILLS.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)).slice(0,5)
    : [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 h-11 rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          aria-label="Add skill"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 h-11 rounded-xl bg-teal-600 text-white disabled:opacity-50"
          disabled={!input.trim()}
        >+ Add</button>
      </div>
      {!!suggestions.length && (
        <div className="flex gap-2 flex-wrap text-sm">
          {suggestions.map(s => (
            <button key={s} type="button" onClick={()=>{commit(s); setInput('');}} className="px-2 py-1 rounded-md border border-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label={`Add ${s}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <AnimatePresence>
          {value.map(skill => (
            <motion.span
              key={skill}
              layout
              initial={{ scale:0.8, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.8, opacity:0 }}
              transition={{ type:'spring', duration:0.2 }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-zinc-300 bg-zinc-100 dark:bg-zinc-800"
            >
              <span>{skill}</span>
              <button
                type="button"
                className="focus:outline-none"
                onClick={()=>remove(skill)}
                aria-label={`Remove ${skill}`}
                onKeyDown={(e)=>{ if(e.key==='Backspace' || e.key==='Delete'){ e.preventDefault(); remove(skill); } }}
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
