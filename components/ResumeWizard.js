import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/router';
import SkillsInput from './wizard/SkillsInput';
import ExperienceCard from './wizard/ExperienceCard';
import EducationCard from './wizard/EducationCard';
import Classic from './templates/Classic';
import TwoCol from './templates/TwoCol';
import Centered from './templates/Centered';
import Sidebar from './templates/Sidebar';
import Modern from './templates/Modern';
import { AnimatePresence } from 'framer-motion';
import StepNav from './ui/StepNav';

const emptyResume = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  links: [],
  skills: [],
  experience: [],
  education: []
};


const schemas = {
  basics: z.object({
    name: z.string().min(1, 'Name is required'),
    title: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    links: z.array(z.object({
      label: z.string().optional(),
      url: z.string().url('Invalid URL').optional().or(z.literal(''))
    }))
  }),
  skills: z.object({ skills: z.array(z.string()) }),
  work: z.object({
    experience: z.array(z.object({
      company: z.string().min(1, 'Company required'),
      role: z.string().min(1, 'Role required'),
      location: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      present: z.boolean().optional(),
      bullets: z.array(z.string()).optional()
    }))
  }),
  education: z.object({
    education: z.array(z.object({
      school: z.string().min(1, 'School required'),
      degree: z.string().optional(),
      grade: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      present: z.boolean().optional(),
      bullets: z.array(z.string()).optional()
    }))
  })
};

export default function ResumeWizard({ initialData, onComplete, autosaveKey, template, onTemplateChange, templateInfo }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const stepIds = ['basics', 'skills', 'work', 'education', 'template', 'review'];
  const stepLabels = ['Basics','Skills','Experience','Education','Template & Theme','Review'];

  const methods = useForm({ defaultValues: initialData || emptyResume, mode: 'onChange' });
  const { register, handleSubmit, watch, setValue, getValues } = methods;

  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState('');
  const [jd, setJd] = useState('');
  const [tone, setTone] = useState('professional');

  useEffect(() => {
    const sub = watch(() => {
      const key = stepIds[step];
      if(key === 'review'){
        const ok = jd.trim().length > 0;
        setIsValid(ok);
        setMessage(ok ? '' : 'Job description required');
        return;
      }
      const schema = schemas[key];
      if (!schema) { setIsValid(true); setMessage(''); return; }
      const res = schema.safeParse(getValues());
      setIsValid(res.success);
      setMessage(res.success ? '' : res.error.issues[0]?.message || 'Incomplete');
    });
    return () => sub.unsubscribe();
  }, [watch, step, getValues, jd]);

  // autosave
  useEffect(() => {
    if (!autosaveKey) return;
    const sub = watch((val) => {
      try {
        localStorage.setItem(autosaveKey, JSON.stringify(val));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [watch, autosaveKey]);

  function next() { if (step < stepIds.length -1) setStep(s => s + 1); }
  function prev() { if (step > 0) setStep(s => s - 1); }
  function saveDraft(){ try{ localStorage.setItem('resumeWizardDraft', JSON.stringify(getValues())); }catch{} }

  function addLink() {
    const links = getValues('links');
    setValue('links', [...links, { label: '', url: '' }]);
  }
  function removeLink(i) {
    const links = getValues('links').filter((_, idx) => idx !== i);
    setValue('links', links);
  }

  function addExp() {
    const exps = getValues('experience');
    setValue('experience', [...exps, { company:'', role:'', start:'', end:'', location:'', bullets:[] }]);
  }
  function updateExp(i, val) {
    const exps = getValues('experience');
    exps[i] = val; setValue('experience', exps);
  }
  function removeExp(i) {
    const exps = getValues('experience').filter((_, idx) => idx !== i);
    setValue('experience', exps);
  }
  function duplicateExp(i) {
    const exps = getValues('experience');
    setValue('experience', [...exps.slice(0,i+1), { ...exps[i] }, ...exps.slice(i+1)]);
  }

  function addEdu() {
    const eds = getValues('education');
    setValue('education', [...eds, { school:'', degree:'', start:'', end:'', grade:'', bullets:[] }]);
  }
  function updateEdu(i, val) {
    const eds = getValues('education');
    eds[i] = val; setValue('education', eds);
  }
  function removeEdu(i) {
    const eds = getValues('education').filter((_, idx) => idx !== i);
    setValue('education', eds);
  }
  function duplicateEdu(i) {
    const eds = getValues('education');
    setValue('education', [...eds.slice(0,i+1), { ...eds[i] }, ...eds.slice(i+1)]);
  }

  const TemplatePreview = useMemo(() => {
    switch (template) {
      case 'modern': return Modern;
      case 'twoCol': return TwoCol;
      case 'centered': return Centered;
      case 'sidebar': return Sidebar;
      default: return Classic;
    }
  }, [template]);

  async function submit(data) {
    if(step !== stepIds.length -1) return;
    try{
      const fd = new FormData();
      fd.append('resumeData', JSON.stringify(data));
      fd.append('jobDesc', jd);
      fd.append('tone', tone);
      const res = await fetch('/api/generate',{method:'POST', body:fd});
      const out = await res.json();
      if(res.ok){
        onComplete && onComplete(out);
      } else {
        alert("Couldn't generate that. Try again in a moment.");
      }
    }catch{
      alert("Couldn't generate that. Try again in a moment.");
    }
  }

  const values = watch();

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-3xl mx-auto space-y-8">
      <StepNav steps={stepLabels} current={step} onChange={(i)=>{ if(i<=step || isValid) setStep(i); }} allowNext={isValid} />
      <div className="space-y-8">
        {step === 0 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Basics</h2>
              <p className="text-sm text-zinc-500">Tell us who you are.</p>
            </header>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-1 col-span-2">
                <label className="text-xs font-medium text-zinc-600">Name*</label>
                <input {...register('name')} className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="Jane Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Title / Headline</label>
                <input {...register('title')} className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="Software Engineer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Email</label>
                <input {...register('email')} type="email" className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="you@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Phone</label>
                <input {...register('phone')} className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="555-123-4567" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Location</label>
                <input {...register('location')} className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="City, Country" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-600">Summary</label>
                <textarea {...register('summary')} rows={4} className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" placeholder="3–5 lines, action-oriented" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Links</div>
              {values.links.map((l, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                  <input {...register(`links.${i}.label`)} placeholder="Label" className="h-11 rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" />
                  <div className="flex gap-2">
                    <input {...register(`links.${i}.url`)} placeholder="URL" className="flex-1 h-11 rounded-xl border border-zinc-300 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-transparent" />
                    <button type="button" onClick={() => removeLink(i)} className="px-2 text-red-600">×</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLink} className="text-sm text-teal-600">Add link</button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Skills</h2>
              <p className="text-sm text-zinc-500">Add your core skills.</p>
            </header>
            <SkillsInput value={values.skills} onChange={v => setValue('skills', v)} />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Work Experience</h2>
              <p className="text-sm text-zinc-500">Highlight relevant roles.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {values.experience.map((exp, i) => (
                  <ExperienceCard key={i} value={exp} index={i} onChange={v => updateExp(i, v)} onRemove={() => removeExp(i)} onDuplicate={() => duplicateExp(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addExp} className="text-sm text-teal-600">Add role</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Education</h2>
              <p className="text-sm text-zinc-500">Your academic background.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {values.education.map((edu, i) => (
                  <EducationCard key={i} value={edu} index={i} onChange={v => updateEdu(i, v)} onRemove={() => removeEdu(i)} onDuplicate={() => duplicateEdu(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addEdu} className="text-sm text-teal-600">Add education</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Finalize</h2>
              <p className="text-sm text-zinc-500">Choose a template.</p>
            </header>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Template</label>
                <select value={template} onChange={e => onTemplateChange && onTemplateChange(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="classic">Classic (ATS)</option>
                  <option value="twoCol">Two-Column</option>
                  <option value="centered">Centered Header</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="modern">Modern</option>
                </select>
                {templateInfo && templateInfo[template] && (
                  <p className="text-sm text-zinc-500 mt-1">{templateInfo[template]}</p>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Preview</div>
                <div className="border rounded-lg p-4">
                  <TemplatePreview data={values} />
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Review</h2>
              <p className="text-sm text-zinc-500">Tailor your documents.</p>
            </header>
            <textarea className="tc-textarea" value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the job description" />
            <label className="block">
              <span className="text-sm">Tone</span>
              <select className="tc-input mt-1" value={tone} onChange={e=>setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
            </label>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-t pt-4 pb-4 px-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={prev} disabled={step === 0} className="px-4 h-10 rounded-md border disabled:opacity-50">Back</button>
          <div className="flex-1 text-center text-sm text-zinc-600">
            {step + 1}/{stepIds.length}
          </div>
          <button type="button" onClick={saveDraft} className="text-sm text-[var(--muted)]">Save draft</button>
          {step < stepIds.length - 1 && (
            <button type="button" onClick={next} disabled={!isValid} className="px-4 h-10 rounded-md bg-teal-600 text-white disabled:opacity-50">Next</button>
          )}
          {step === stepIds.length - 1 && (
            <button type="submit" disabled={!isValid} className="px-4 h-10 rounded-md bg-teal-600 text-white disabled:opacity-50">Tailor</button>
          )}
        </div>
        {!isValid && message && <p className="text-xs text-red-600 mt-1">{message}</p>}
      </div>
    </form>
  );
}
