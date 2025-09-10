import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ExperienceCard({ value, onChange, onRemove, onDuplicate, index }) {
  const [bulletInput, setBulletInput] = useState('');

  function updateField(field, val) {
    onChange({ ...value, [field]: val });
  }

  function addBullet() {
    const t = bulletInput.trim();
    if (!t) return;
    const bullets = [...(value.bullets || []), t];
    onChange({ ...value, bullets });
    setBulletInput('');
  }

  function removeBullet(i) {
    const bullets = (value.bullets || []).filter((_, idx) => idx !== i);
    onChange({ ...value, bullets });
  }

  return (
    <motion.div layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
      className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Company*</label>
          <input
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
            value={value.company}
            onChange={e => updateField('company', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Job Title*</label>
          <input
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
            value={value.title}
            onChange={e => updateField('title', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Location</label>
          <input
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
            value={value.location || ''}
            onChange={e => updateField('location', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Start</label>
            <input
              type="month"
              className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
              value={value.start}
              onChange={e => updateField('start', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">End</label>
            <input
              type="month"
              disabled={value.present}
              className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent disabled:opacity-50"
              value={value.end || ''}
              onChange={e => updateField('end', e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id={`exp-present-${index}`} type="checkbox" checked={value.present || false} onChange={e => updateField('present', e.target.checked)} />
          <label htmlFor={`exp-present-${index}`} className="text-sm">Present</label>
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
        <div className="text-xs font-medium text-zinc-500">Bullets</div>
        <div className="flex gap-2">
          <input
            className="flex-1 h-11 rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent"
            value={bulletInput}
            onChange={e=>setBulletInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addBullet(); } }}
            aria-label="Add bullet"
          />
          <button type="button" onClick={addBullet} className="px-3 h-11 rounded-xl bg-teal-600 text-white disabled:opacity-50" disabled={!bulletInput.trim()}>+ Add bullet</button>
        </div>
        <ul className="space-y-2">
          <AnimatePresence>
            {(value.bullets || []).map((b, i) => (
              <motion.li key={i} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="flex items-start gap-2">
                <span className="flex-1 text-sm">{b}</span>
                <button type="button" onClick={()=>removeBullet(i)} aria-label="Remove bullet" className="text-zinc-500 hover:text-zinc-800">×</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
        {onDuplicate && <button type="button" onClick={onDuplicate} className="text-sm text-teal-600">Duplicate role</button>}
        {onRemove && <button type="button" onClick={onRemove} className="text-sm text-red-600">Remove role</button>}
      </div>
    </motion.div>
  );
}
