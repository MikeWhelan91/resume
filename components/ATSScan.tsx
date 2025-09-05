import { Resume } from '../lib/schema/resume';

interface Props { resume: Resume; templateId: string; }

export default function ATSScan({ resume, templateId }: Props) {
  const warnings: string[] = [];
  resume.work.forEach((w, i) => {
    if (!w.start) warnings.push(`Work item ${i+1} missing start date`);
  });
  resume.work.forEach((w) => w.highlights.forEach(h => { if (h.length > 300) warnings.push('Bullet too long'); }));
  if (templateId === 'professional') warnings.push('Two-column templates may confuse ATS');
  return (
    <div className="p-2 text-sm">
      <h3 className="font-bold">ATS Warnings</h3>
      {warnings.length === 0 ? <p>None</p> : (
        <ul className="list-disc ml-4">
          {warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}
