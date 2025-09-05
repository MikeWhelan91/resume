import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Resume, ResumeSchema } from '../lib/schema/resume';
import { loadResume, saveResume, clearResume } from '../lib/resume/storage';
import { normalizeResume } from '../lib/resume/normalize';
import PreviewPane from '../components/PreviewPane';

const steps = ['Contact', 'Summary', 'Skills', 'Work', 'Education', 'Projects/Certs', 'Extras', 'Review'];

export default function Builder() {
  const [step, setStep] = useState(0);
  const [resume, setResume] = useState<Resume>(() =>
    loadResume() || {
      basics: { name: '', email: '', links: [] },
      skills: [],
      work: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      volunteering: [],
      preferences: {},
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    saveResume(normalizeResume(resume));
  }, [resume]);

  function update(field: string, value: any) {
    setResume({ ...resume, [field]: value });
  }

  function validateCurrent(): boolean {
    try {
      const partial = ResumeSchema.pick({
        basics: true,
        summary: true,
        skills: true,
        work: true,
        education: true,
        projects: true,
        certifications: true,
        languages: true,
        volunteering: true,
        preferences: true,
      }).parse(resume);
      setErrors({});
      return true;
    } catch (e: any) {
      const errs: Record<string, string> = {};
      e.issues?.forEach((i: any) => {
        errs[i.path.join('.')] = i.message;
      });
      setErrors(errs);
      return false;
    }
  }

  function next() {
    if (step === steps.length - 1) return;
    if (validateCurrent()) setStep(step + 1);
  }

  function prev() {
    if (step === 0) return;
    setStep(step - 1);
  }

  function reset() {
    clearResume();
    setResume({
      basics: { name: '', email: '', links: [] },
      skills: [],
      work: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      volunteering: [],
      preferences: {},
    });
    setStep(0);
  }

  return (
    <>
      <Head>
        <title>Build Resume - TailorCV</title>
        <meta name="description" content="Step-by-step resume builder." />
      </Head>
      <div className="min-h-screen flex flex-col md:flex-row">
        <div className="flex-1 p-6 space-y-4">
          <h1 className="text-2xl font-bold">{steps[step]}</h1>
          {step === 0 && (
            <section className="space-y-2">
              <label className="block">Name
                <input value={resume.basics.name} onChange={e => update('basics', { ...resume.basics, name: e.target.value })} className="border p-2 w-full" />
              </label>
              <label className="block">Email
                <input value={resume.basics.email} onChange={e => update('basics', { ...resume.basics, email: e.target.value })} className="border p-2 w-full" />
              </label>
              <label className="block">Phone
                <input value={resume.basics.phone || ''} onChange={e => update('basics', { ...resume.basics, phone: e.target.value })} className="border p-2 w-full" />
              </label>
            </section>
          )}
          {step === 1 && (
            <section className="space-y-2">
              <label className="block">Summary
                <textarea value={resume.summary || ''} onChange={e => update('summary', e.target.value)} className="border p-2 w-full" />
              </label>
            </section>
          )}
          {step === 2 && (
            <section className="space-y-2">
              {resume.skills.map((s, idx) => (
                <div key={idx} className="flex gap-2">
                  <input value={s.name} onChange={e => {
                    const nextSkills = [...resume.skills];
                    nextSkills[idx] = { ...nextSkills[idx], name: e.target.value };
                    update('skills', nextSkills);
                  }} className="border p-2 flex-1" />
                  <button onClick={() => update('skills', resume.skills.filter((_, i) => i !== idx))} className="px-2">x</button>
                </div>
              ))}
              <button onClick={() => update('skills', [...resume.skills, { name: '' }])} className="bg-gray-200 px-2 py-1">Add Skill</button>
            </section>
          )}
          {step === steps.length - 1 && (
            <section>
              <button onClick={() => alert('Resume valid!')} className="bg-blue-600 text-white px-4 py-2 rounded">Finish</button>
              <button onClick={reset} className="ml-2 text-sm">Reset</button>
            </section>
          )}
          <div className="flex justify-between pt-4">
            <button onClick={prev} disabled={step === 0} className="px-4 py-2 border rounded">Back</button>
            <button onClick={next} disabled={step === steps.length - 1} className="px-4 py-2 border rounded">Next</button>
          </div>
        </div>
        <div className="flex-1 border-l p-4">
          <PreviewPane resume={resume} onChange={setResume} />
        </div>
      </div>
    </>
  );
}
