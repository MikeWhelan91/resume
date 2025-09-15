import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectCard({ value, onChange, onRemove, onDuplicate, index }) {
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
          <label className="text-xs font-medium text-muted">Project Name</label>
          <input
            className="form-input"
            value={value.name || ''}
            onChange={e => updateField('name', e.target.value)}
            placeholder="Project name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Project URL</label>
          <input
            className="form-input"
            value={value.url || ''}
            onChange={e => updateField('url', e.target.value)}
            placeholder="Repository or project URL"
            type="url"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Start Date</label>
          <input
            className="form-input"
            value={value.start || ''}
            onChange={e => updateField('start', e.target.value)}
            placeholder="Start date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">End Date</label>
          <div className="space-y-2">
            <input
              className="form-input"
              value={value.end || ''}
              onChange={e => updateField('end', e.target.value)}
              placeholder="End date"
              disabled={value.present}
            />
            <label className="flex items-center text-xs text-muted">
              <input
                type="checkbox"
                checked={value.present || false}
                onChange={e => updateField('present', e.target.checked)}
                className="mr-2"
              />
              Currently working on this
            </label>
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-muted">Demo URL</label>
          <input
            className="form-input"
            value={value.demo || ''}
            onChange={e => updateField('demo', e.target.value)}
            placeholder="Live demo URL"
            type="url"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted">Description</label>
        <textarea
          className="form-textarea"
          value={value.description || ''}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Project description"
          rows={3}
        />
      </div>

      {/* Project Details */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Project Details & Achievements</label>
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            value={bulletInput}
            onChange={e => setBulletInput(e.target.value)}
            placeholder="Add project detail or achievement"
            onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addBullet(); } }}
          />
          <button type="button" onClick={addBullet} className="btn btn-primary" disabled={!bulletInput.trim()}>+ Add</button>
        </div>
        <ul className="space-y-2">
          <AnimatePresence>
            {(value.bullets || []).map((bullet, i) => (
              <motion.li key={i} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="flex items-start gap-2">
                <span className="text-muted mt-1">•</span>
                <span className="flex-1 text-sm">{bullet}</span>
                <button type="button" onClick={() => removeBullet(i)} className="text-red-600 hover:text-red-800 text-xs">×</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <button type="button" onClick={onDuplicate} className="btn btn-ghost btn-sm">Duplicate</button>
        </div>
        <button type="button" onClick={onRemove} className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">Remove</button>
      </div>
    </motion.div>
  );
}