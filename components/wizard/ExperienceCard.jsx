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
      className="bg-surface text-text border border-border rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Company*</label>
          <input
            className="form-input"
            value={value.company}
            onChange={e => updateField('company', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Job Title*</label>
          <input
            className="form-input"
            value={value.title}
            onChange={e => updateField('title', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Location</label>
          <input
            className="form-input"
            value={value.location || ''}
            onChange={e => updateField('location', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Start</label>
            <input
              type="month"
              className="form-input"
              value={value.start}
              onChange={e => updateField('start', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">End</label>
            <input
              type="month"
              disabled={value.present}
              className="form-input disabled:opacity-50"
              value={value.end || ''}
              onChange={e => updateField('end', e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input 
            id={`exp-present-${index}`} 
            type="checkbox" 
            checked={value.present || false} 
            onChange={e => updateField('present', e.target.checked)}
            className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2 accent-primary"
          />
          <label htmlFor={`exp-present-${index}`} className="text-sm text-text">Present</label>
        </div>
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <div className="text-xs font-medium text-muted">Bullets</div>
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            value={bulletInput}
            onChange={e=>setBulletInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addBullet(); } }}
            aria-label="Add bullet"
          />
          <button type="button" onClick={addBullet} className="btn btn-primary" disabled={!bulletInput.trim()}>+ Add bullet</button>
        </div>
        <ul className="space-y-2">
          <AnimatePresence>
            {(value.bullets || []).map((b, i) => (
              <motion.li key={i} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="flex items-start gap-2">
                <span className="flex-1 text-sm">{b}</span>
                <button type="button" onClick={()=>removeBullet(i)} aria-label="Remove bullet" className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">×</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        {onDuplicate && <button type="button" onClick={onDuplicate} className="btn btn-ghost btn-sm">Duplicate role</button>}
        {onRemove && <button type="button" onClick={onRemove} className="text-sm text-red-600">Remove role</button>}
      </div>
    </motion.div>
  );
}
