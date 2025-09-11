import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/router';
import SkillsInput from './wizard/SkillsInput';
import ExperienceCard from './wizard/ExperienceCard';
import EducationCard from './wizard/EducationCard';
// Templates removed - using simple preview only
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
      title: z.string().min(1, 'Job title required'),
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

export default function ResumeWizard({ initialData, onComplete, autosaveKey }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const stepIds = ['goal', 'basics', 'skills', 'work', 'education', 'review'];
  const stepLabels = ['Goal', 'Basics','Skills','Experience','Education','Review'];
  const [userGoal, setUserGoal] = useState('both'); // 'cv', 'cover-letter', 'both'

  const methods = useForm({ defaultValues: initialData || emptyResume, mode: 'onChange' });
  const { register, handleSubmit, watch, setValue, getValues } = methods;

  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState('');
  const [jd, setJd] = useState('');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const sub = watch(() => {
      const key = stepIds[step];
      if(key === 'goal'){
        setIsValid(true);
        setMessage('');
        return;
      }
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
    setValue('experience', [...exps, { company:'', title:'', start:'', end:'', location:'', bullets:[] }]);
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

  // Simple preview component
  const TemplatePreview = ({ data }) => (
    <div style={{ padding: '20px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>
        {data?.name || 'Your Name'}
      </h1>
      <p style={{ marginBottom: '15px', color: '#666' }}>
        {data?.email || 'your.email@example.com'} • {data?.phone || 'Your Phone'}
      </p>
      {data?.summary && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '5px' }}>Summary</h2>
          <p style={{ fontSize: '11px' }}>{data.summary}</p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '30px', color: '#999' }}>
        Simple preview
      </div>
    </div>
  );

  async function submit(data) {
    if(step !== stepIds.length -1) return;
    setIsGenerating(true);
    try{
      const fd = new FormData();
      fd.append('resumeData', JSON.stringify(data));
      fd.append('jobDesc', jd);
      fd.append('tone', tone);
      fd.append('userGoal', userGoal);
      const res = await fetch('/api/generate',{method:'POST', body:fd});
      const out = await res.json();
      if(res.ok){
        onComplete && onComplete(out);
      } else {
        alert("Couldn't generate that. Try again in a moment.");
      }
    }catch{
      alert("Couldn't generate that. Try again in a moment.");
    }finally{
      setIsGenerating(false);
    }
  }

  const values = watch();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <form onSubmit={handleSubmit(submit)} className="space-y-8">
        <StepNav 
          steps={stepLabels} 
          current={step} 
          onChange={(i)=>{ if(i<=step || isValid) setStep(i); }} 
          allowNext={isValid}
          showButtons={true}
          isGenerating={isGenerating}
          onNext={() => {
            if (step < stepIds.length - 1) {
              setStep(s => s + 1);
            } else {
              handleSubmit(submit)();
            }
          }}
          onPrev={() => {
            if (step > 0) setStep(s => s - 1);
          }}
        />
      <div className="card p-8 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg animate-fade-in">
        {step === 0 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">What do you want to create?</h2>
              <p className="text-gray-600">Choose what you'd like to optimize based on the job description.</p>
            </header>
            <div className="space-y-6">
              <div className="grid gap-4 max-w-2xl mx-auto">
                <label className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-blue-200" style={{backgroundColor: userGoal === 'cv' ? 'rgb(239 246 255)' : 'white', borderColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'rgb(229 231 235)'}}>
                  <input 
                    type="radio" 
                    name="goal" 
                    value="cv" 
                    checked={userGoal === 'cv'} 
                    onChange={(e) => setUserGoal(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{borderColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'rgb(156 163 175)', backgroundColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'transparent'}}>
                      {userGoal === 'cv' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">CV/Resume Only</div>
                      <div className="text-sm text-gray-600">Optimize your resume for the job description</div>
                    </div>
                  </div>
                </label>
                <label className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-purple-200" style={{backgroundColor: userGoal === 'cover-letter' ? 'rgb(250 245 255)' : 'white', borderColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'rgb(229 231 235)'}}>
                  <input 
                    type="radio" 
                    name="goal" 
                    value="cover-letter" 
                    checked={userGoal === 'cover-letter'} 
                    onChange={(e) => setUserGoal(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{borderColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'rgb(156 163 175)', backgroundColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'transparent'}}>
                      {userGoal === 'cover-letter' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Cover Letter Only</div>
                      <div className="text-sm text-gray-600">Generate a tailored cover letter for the job</div>
                    </div>
                  </div>
                </label>
                <label className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-green-200" style={{backgroundColor: userGoal === 'both' ? 'rgb(240 253 244)' : 'white', borderColor: userGoal === 'both' ? 'rgb(34 197 94)' : 'rgb(229 231 235)'}}>
                  <input 
                    type="radio" 
                    name="goal" 
                    value="both" 
                    checked={userGoal === 'both'} 
                    onChange={(e) => setUserGoal(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{borderColor: userGoal === 'both' ? 'rgb(34 197 94)' : 'rgb(156 163 175)', backgroundColor: userGoal === 'both' ? 'rgb(34 197 94)' : 'transparent'}}>
                      {userGoal === 'both' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Both CV and Cover Letter</div>
                      <div className="text-sm text-gray-600">Get a complete application package</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-gray-600">Tell us who you are and how to reach you.</p>
            </header>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Name*</label>
                <input {...register('name')} className="form-input" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title / Headline</label>
                <input {...register('title')} className="form-input" placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input {...register('email')} type="email" className="form-input" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input {...register('phone')} className="form-input" placeholder="555-123-4567" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input {...register('location')} className="form-input" placeholder="City, Country" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Summary</label>
                <textarea {...register('summary')} rows={4} className="form-textarea" placeholder="3–5 lines, action-oriented" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">Links</div>
              {values.links.map((l, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                  <input {...register(`links.${i}.label`)} placeholder="Label" className="form-input" />
                  <div className="flex gap-2">
                    <input {...register(`links.${i}.url`)} placeholder="URL" className="flex-1 form-input" />
                    <button type="button" onClick={() => removeLink(i)} className="btn btn-ghost text-red-600 hover:bg-red-50">×</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLink} className="btn btn-ghost btn-sm text-blue-600">+ Add link</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
              <p className="text-gray-600">Add your core skills and areas of expertise.</p>
            </header>
            <SkillsInput value={values.skills} onChange={v => setValue('skills', v)} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
              <p className="text-gray-600">Highlight your relevant professional experience.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {values.experience.map((exp, i) => (
                  <ExperienceCard key={i} value={exp} index={i} onChange={v => updateExp(i, v)} onRemove={() => removeExp(i)} onDuplicate={() => duplicateExp(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addExp} className="btn btn-ghost btn-sm text-blue-600">+ Add role</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Education</h2>
              <p className="text-gray-600">Your academic background and qualifications.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {values.education.map((edu, i) => (
                  <EducationCard key={i} value={edu} index={i} onChange={v => updateEdu(i, v)} onRemove={() => removeEdu(i)} onDuplicate={() => duplicateEdu(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addEdu} className="btn btn-ghost btn-sm text-blue-600">+ Add education</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Review & Generate</h2>
              <p className="text-gray-600">Tailor your documents to the job description.</p>
            </header>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Description*</label>
              <textarea 
                className="form-textarea h-48 resize-vertical" 
                value={jd} 
                onChange={e=>setJd(e.target.value)} 
                placeholder="Paste the job description here..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tone</label>
              <select className="form-select" value={tone} onChange={e=>setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
            </div>
          </section>
        )}
      </div>

      {/* Validation Message */}
      {!isValid && message && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <p className="text-sm text-red-600 font-medium">{message}</p>
        </div>
      )}
      </form>

      {/* Document Generation Loading Screen */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 max-w-md w-full text-center space-y-6 animate-scale-in">
            <div className="loading-spinner w-16 h-16 mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Generating Your Documents</h3>
              <p className="text-gray-600">
                AI is analyzing your resume and the job description to create tailored documents. This may take a moment...
              </p>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
