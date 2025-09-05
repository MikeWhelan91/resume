import { useState } from 'react';
import { Resume } from '../lib/schema/resume';
import { templates, templateList } from './templates';
import ATSScan from './ATSScan';

interface Props {
  resume: Resume;
  onChange(resume: Resume): void;
}

export default function PreviewPane({ resume, onChange }: Props) {
  const [templateId, setTemplateId] = useState(resume.preferences.templateId || 'clean');

  const TemplateComp = templates[templateId];
  const [atsMode, setAtsMode] = useState(false);

  function updateTemplate(id: string) {
    setTemplateId(id);
    onChange({ ...resume, preferences: { ...resume.preferences, templateId: id } });
  }

  async function downloadPdf() {
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, templateId }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <select value={templateId} onChange={e => updateTemplate(e.target.value)} className="border p-1">
          {templateList.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="space-x-2">
          <label className="text-sm"><input type="checkbox" checked={atsMode} onChange={e => setAtsMode(e.target.checked)} /> ATS</label>
          <button onClick={downloadPdf} className="border px-2 py-1">Final PDF</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto border">
        {atsMode ? <ATSScan resume={resume} templateId={templateId} /> : TemplateComp.renderHtml(resume)}
      </div>
    </div>
  );
}
