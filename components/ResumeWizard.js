import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import SkillsInput from './wizard/SkillsInput';
import ExperienceCard from './wizard/ExperienceCard';
import ProjectCard from './wizard/ProjectCard';
import EducationCard from './wizard/EducationCard';
// Templates removed - using simple preview only
import { AnimatePresence } from 'framer-motion';
import StepNav from './ui/StepNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useError } from '../contexts/ErrorContext';
import { InfoTooltip, HelpTooltip } from './ui/TooltipPortal';
import { Upload } from 'lucide-react';

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
  projects: [],
  education: []
};


const schemas = {
  basics: z.object({
    name: z.string().min(1, 'Name is required'),
    title: z.string().nullish().transform(val => val ?? ''),
    email: z.string().nullish().transform(val => val ?? '').refine(val => !val || z.string().email().safeParse(val).success, 'Invalid email'),
    phone: z.string().nullish().transform(val => val ?? ''),
    location: z.string().nullish().transform(val => val ?? ''),
    summary: z.string().nullish().transform(val => val ?? ''),
    links: z.array(z.object({
      label: z.string().nullish().transform(val => val ?? ''),
      url: z.string().optional().default('')
    })).optional().default([])
  }),
  skills: z.object({ skills: z.array(z.string()).optional().default([]) }),
  work: z.object({
    experience: z.array(z.object({
      company: z.string().min(1, 'Company required'),
      title: z.string().min(1, 'Job title required'),
      location: z.string().nullish().transform(val => val ?? ''),
      start: z.string().nullish().transform(val => val ?? ''),
      end: z.string().nullish().transform(val => val ?? ''),
      present: z.boolean().optional().default(false),
      bullets: z.array(z.string()).optional().default([])
    })).optional().default([])
  }),
  projects: z.object({
    projects: z.array(z.object({
      name: z.string().optional().default(''),
      description: z.string().nullish().transform(val => val ?? ''),
      start: z.string().nullish().transform(val => val ?? ''),
      end: z.string().nullish().transform(val => val ?? ''),
      present: z.boolean().optional().default(false),
      url: z.string().optional().default(''),
      demo: z.string().optional().default(''),
      bullets: z.array(z.string()).optional().default([])
    })).optional().default([])
  }),
  education: z.object({
    education: z.array(z.object({
      school: z.string().min(1, 'School required'),
      degree: z.string().nullish().transform(val => val ?? ''),
      grade: z.string().nullish().transform(val => val ?? ''),
      start: z.string().nullish().transform(val => val ?? ''),
      end: z.string().nullish().transform(val => val ?? ''),
      present: z.boolean().optional().default(false),
      bullets: z.array(z.string()).optional().default([])
    })).optional().default([])
  })
};

export default function ResumeWizard({ initialData, onComplete, autosaveKey }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { language, getTerminology } = useLanguage();
  const { showError } = useError();
  const terms = getTerminology();
  const [step, setStep] = useState(0);
  const stepIds = ['goal', 'basics', 'skills', 'work', 'projects', 'education', 'review'];
  const stepLabels = ['Goal', 'Basics','Skills','Experience','Projects','Education','Review'];
  const [userGoal, setUserGoal] = useState('both'); // 'cv', 'cover-letter', 'both'

  const methods = useForm({ defaultValues: initialData || emptyResume, mode: 'onChange' });
  const { register, handleSubmit, watch, setValue, getValues } = methods;

  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState('');
  const [jd, setJd] = useState('');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [entitlement, setEntitlement] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [dayPassUsage, setDayPassUsage] = useState(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [trialUsage, setTrialUsage] = useState(null);
  const [trialUsageLoading, setTrialUsageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Force 'both' option for signed-out users
  useEffect(() => {
    if (!session && (userGoal === 'cv' || userGoal === 'cover-letter')) {
      console.log('Forcing userGoal to both for trial user, was:', userGoal);
      setUserGoal('both');
    }
  }, [session, userGoal]);

  useEffect(() => {
    const sub = watch(() => {
      const key = stepIds[step];
      if(key === 'goal'){
        setIsValid(true);
        setMessage('');
        return;
      }
      if(key === 'review'){
        const jdValid = jd.trim().length > 0;
        const canGen = canGenerate();
        const ok = jdValid && canGen;
        
        if (!jdValid) {
          setIsValid(false);
          setMessage('Job description required');
        } else if (!canGen) {
          setIsValid(false);
          if (!session?.user) {
            setMessage('Sign in required to generate documents');
          } else if (userPlan === 'free' && getCreditsRemaining() <= 0) {
            setMessage('No credits remaining - upgrade to Pro');
          } else if (userPlan === 'day_pass' && getCreditsRemaining() <= 0) {
            setMessage('Daily generation limit reached - upgrade to Pro');
          }
        } else {
          setIsValid(true);
          setMessage('');
        }
        return;
      }
      const schema = schemas[key];
      if (!schema) { setIsValid(true); setMessage(''); return; }
      const res = schema.safeParse(getValues());
      setIsValid(res.success);
      setMessage(res.success ? '' : res.error.issues[0]?.message || 'Incomplete');
    });
    return () => sub.unsubscribe();
  }, [watch, step, getValues, jd, session, userPlan, entitlement, dayPassUsage]);

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

  // Fetch user entitlement data (authenticated) or trial usage (anonymous)
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        // Authenticated user - fetch entitlements
        try {
          const [entitlementResponse, dayPassResponse] = await Promise.all([
            fetch('/api/entitlements'),
            fetch('/api/day-pass-usage')
          ]);
          
          if (entitlementResponse.ok) {
            const data = await entitlementResponse.json();
            setEntitlement(data);
            setUserPlan(data.plan);
          }
          
          if (dayPassResponse.ok) {
            const dayPassData = await dayPassResponse.json();
            setDayPassUsage(dayPassData);
          }
        } catch (error) {
          console.error('Error fetching entitlement:', error);
        }
      } else {
        // Anonymous user - fetch trial usage
        try {
          const trialResponse = await fetch('/api/trial-usage');
          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            setTrialUsage(trialData);
          }
        } catch (error) {
          console.error('Error fetching trial usage:', error);
        }
        setTrialUsageLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  // Check if user can generate and redirect/show error if not
  useEffect(() => {
    // Only check after data is loaded
    if (session === null && !trialUsageLoading && trialUsage) {
      // Anonymous user with trial data loaded
      if (!canGenerate()) {
        showError(
          `You've used all ${trialUsage.generationsLimit} free generations. Sign up to create unlimited resumes and cover letters!`,
          'Trial Limit Reached'
        );
        setTimeout(() => router.push('/'), 3000);
      }
    } else if (session && entitlement) {
      // Logged in user with entitlement loaded
      if (!canGenerate()) {
        if (userPlan === 'free') {
          showError(
            'You\'ve used all your weekly free generations. Upgrade to Pro for unlimited access!',
            'Weekly Limit Reached'
          );
        } else {
          showError(
            'Unable to generate resumes at this time. Please try again later.',
            'Generation Error'
          );
        }
        setTimeout(() => router.push('/'), 3000);
      }
    }
  }, [session, trialUsage, trialUsageLoading, entitlement, userPlan]);

  // Credit checking functions
  const getCreditsRemaining = () => {
    if (userPlan === 'free' && entitlement) {
      return entitlement.freeWeeklyCreditsRemaining || 0;
    }
    if (userPlan === 'day_pass' && dayPassUsage) {
      return dayPassUsage.generationsLimit - dayPassUsage.generationsUsed;
    }
    return null;
  };

  const getTrialGenerationsRemaining = () => {
    if (!session && trialUsage) {
      return Math.max(0, trialUsage.generationsLimit - trialUsage.generationsUsed);
    }
    return 0;
  };

  const canGenerate = () => {
    if (!session?.user) {
      // Trial users - check trial usage
      return trialUsage ? trialUsage.canGenerate : false;
    }
    if (userPlan === 'free') {
      return (entitlement?.freeWeeklyCreditsRemaining || 0) > 0;
    }
    if (userPlan === 'day_pass') {
      if (!dayPassUsage) return false; // Still loading
      return dayPassUsage.generationsUsed < dayPassUsage.generationsLimit;
    }
    return true; // Pro users can generate
  };

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

  function addProject() {
    const projects = getValues('projects');
    setValue('projects', [...projects, { name:'', description:'', start:'', end:'', present:false, url:'', demo:'', bullets:[] }]);
  }
  function updateProject(i, val) {
    const projects = getValues('projects');
    projects[i] = val; setValue('projects', projects);
  }
  function removeProject(i) {
    const projects = getValues('projects').filter((_, idx) => idx !== i);
    setValue('projects', projects);
  }
  function duplicateProject(i) {
    const projects = getValues('projects');
    setValue('projects', [...projects.slice(0,i+1), { ...projects[i] }, ...projects.slice(i+1)]);
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user can upload (reuse existing logic)
    if (!canGenerate()) {
      showError('You do not have access to upload resumes. Please upgrade your plan.', 'Access Denied');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Merge the uploaded data with current form values
        const uploadedData = data.resumeData || {};

        // Update the form with the uploaded data
        Object.keys(uploadedData).forEach(key => {
          if (uploadedData[key] !== undefined && uploadedData[key] !== null && uploadedData[key] !== '') {
            setValue(key, uploadedData[key]);
          }
        });

        // Save to localStorage
        try {
          localStorage.setItem(autosaveKey, JSON.stringify(getValues()));
        } catch {}

      } else {
        showError(data.error || 'Failed to process resume', 'Upload Failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Failed to process resume. Please try again.', 'Upload Error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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

  const showUpgradeAlert = (message) => {
    if (confirm(`${message}\n\nWould you like to view our pricing plans?`)) {
      router.push('/pricing');
    }
  };

  async function submit(data) {
    if(step !== stepIds.length -1) return;
    
    console.log('Submit called with userGoal:', userGoal, 'session:', !!session?.user);
    
    // Check if user can generate
    if (!canGenerate()) {
      if (!session?.user) {
        // Trial user has exhausted their generations - show signup BEFORE generation attempt
        const remaining = getTrialGenerationsRemaining();
        console.log('Trial user exhausted, remaining:', remaining);
        setShowAccountPrompt(true);
        return;
      } else if (userPlan === 'free' && getCreditsRemaining() <= 0) {
        showUpgradeAlert(`You've used all your weekly credits. Your credits reset every Monday at midnight Dublin time. Upgrade to Pro for unlimited generations!`);
        return;
      } else if (userPlan === 'day_pass' && getCreditsRemaining() <= 0) {
        showUpgradeAlert(`You've reached your daily generation limit. Upgrade to Pro for unlimited generations!`);
        return;
      }
    }
    
    setIsGenerating(true);
    try{
      const fd = new FormData();
      fd.append('resumeData', JSON.stringify(data));
      fd.append('jobDesc', jd);
      fd.append('tone', tone);
      fd.append('userGoal', userGoal);
      fd.append('language', language);
      
      // Save job description to localStorage for results page
      localStorage.setItem('jobDescription', jd);
      
      const res = await fetch('/api/generate',{method:'POST', body:fd});
      const out = await res.json();
      if(res.ok){
        // Also save job description with the result data
        const resultData = { ...out, jobDescription: jd };
        localStorage.setItem('resumeResult', JSON.stringify(resultData));
        onComplete && onComplete(resultData);
      } else {
        // Show specific error message from API
        const errorMessage = out.message || out.error || "Couldn't generate that. Try again in a moment.";
        showError(errorMessage, 'Generation Failed');
      }
    } catch(error) {
      console.error('Generation error:', error);
      showError("Couldn't generate that. Try again in a moment.", 'Network Error');
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
          disabledMessage={message}
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
      <div className="card p-6 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg animate-fade-in">
        {step === 0 && (
          <section className="space-y-6">
            <header className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What do you want to create?</h2>
                <HelpTooltip 
                  content={
                    <div className="space-y-3">
                      <p><strong>Resume Only:</strong> Perfect if you already have a cover letter or the job doesn't require one.</p>
                      <p><strong>Cover Letter Only:</strong> Generate a personalized cover letter when you have an up-to-date resume.</p>
                      <p><strong>Both:</strong> Get a complete application package - recommended for maximum impact!</p>
                      <p className="text-blue-200 text-sm">💡 Most successful applications include both documents.</p>
                    </div>
                  }
                />
              </div>
              <p className="text-muted">Choose what you'd like to optimize based on the job description.</p>
            </header>
            <div className="space-y-4">
              <div className="grid gap-3 max-w-2xl mx-auto">
                <label className={`card p-4 transition-all duration-300 group border-2 ${
                  !session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-blue-200'
                }`} style={{backgroundColor: userGoal === 'cv' ? 'rgb(239 246 255)' : 'rgb(249 250 251)', borderColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'rgb(229 231 235)'}}>
                  <input 
                    type="radio" 
                    name="goal" 
                    value="cv" 
                    checked={userGoal === 'cv'} 
                    onChange={(e) => setUserGoal(e.target.value)}
                    className="sr-only"
                    disabled={!session}
                  />
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{borderColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'rgb(156 163 175)', backgroundColor: userGoal === 'cv' ? 'rgb(59 130 246)' : 'transparent'}}>
                      {userGoal === 'cv' && <div className="w-2 h-2 bg-bg rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{terms.Resume} Only</div>
                      <div className="text-sm text-muted">Optimise your {terms.resume} for the job description</div>
                      <div className="text-xs text-blue-600 font-bold">Uses 1 generation</div>
                      {!session && (
                        <div className="text-xs text-red-500 font-bold mt-1">Sign up required</div>
                      )}
                    </div>
                  </div>
                </label>
                <label className={`card p-4 transition-all duration-300 group border-2 ${
                  !session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-purple-200'
                }`} style={{backgroundColor: userGoal === 'cover-letter' ? 'rgb(250 245 255)' : 'rgb(249 250 251)', borderColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'rgb(229 231 235)'}}>
                  <input 
                    type="radio" 
                    name="goal" 
                    value="cover-letter" 
                    checked={userGoal === 'cover-letter'} 
                    onChange={(e) => setUserGoal(e.target.value)}
                    className="sr-only"
                    disabled={!session}
                  />
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{borderColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'rgb(156 163 175)', backgroundColor: userGoal === 'cover-letter' ? 'rgb(147 51 234)' : 'transparent'}}>
                      {userGoal === 'cover-letter' && <div className="w-2 h-2 bg-bg rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">Cover Letter Only</div>
                      <div className="text-sm text-muted">Generate a tailored cover letter for the job</div>
                      <div className="text-xs text-purple-600 font-bold">Uses 1 generation</div>
                      {!session && (
                        <div className="text-xs text-red-500 font-bold mt-1">Sign up required</div>
                      )}
                    </div>
                  </div>
                </label>
                <label className="card p-4 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-green-200" style={{backgroundColor: userGoal === 'both' ? 'rgb(240 253 244)' : 'rgb(249 250 251)', borderColor: userGoal === 'both' ? 'rgb(34 197 94)' : 'rgb(229 231 235)'}}>
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
                      {userGoal === 'both' && <div className="w-2 h-2 bg-bg rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">Both {terms.Resume} and Cover Letter</div>
                      <div className="text-sm text-muted">Get a complete application package</div>
                      <div className="text-xs text-green-600 font-bold">
                        {session ? 'Uses 2 generations' : '🎯 FREE TRIAL - 2 generations included'}
                      </div>
                      {!session && (
                        <div className="text-xs text-green-600 font-bold mt-1">Try before you sign up!</div>
                      )}
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
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-text">Basic Information</h2>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p>Fill in your personal and contact details. This information will appear at the top of your resume.</p>
                      <p><strong>Pro tip:</strong> Use a professional email address and ensure your phone number is current.</p>
                      <p className="text-blue-200 text-sm">💡 All fields except name are optional, but more details = better results!</p>
                    </div>
                  }
                />
              </div>
              <p className="text-muted">Tell us who you are and how to reach you. This information appears at the top of your resume.</p>
            </header>

            {/* Upload Box */}
            <div className="bg-surface/60 border border-border/50 rounded-lg p-4">
              <div className="text-center">
                <h3 className="text-sm font-medium text-text mb-2">
                  Import Resume
                </h3>
                <p className="text-xs text-muted mb-3">
                  Upload your existing resume to automatically fill in your information
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !canGenerate()}
                  className={`inline-flex items-center px-4 py-2 border border-dashed rounded-lg text-sm transition-all duration-200 ${
                    uploading || !canGenerate()
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary-hover cursor-pointer'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {!canGenerate() ? 'Upload Disabled' : 'Upload Resume'}
                    </>
                  )}
                </button>

                <p className="text-xs text-muted mt-2">
                  {!canGenerate()
                    ? 'Please upgrade to upload resumes'
                    : 'Supports PDF, DOCX, and TXT files'
                  }
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-1 col-span-2">
                <label className="text-sm font-bold text-muted">Name*</label>
                <input {...register('name')} className="form-input" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted">Title / Headline</label>
                <input {...register('title')} className="form-input" placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted">Email</label>
                <input {...register('email')} type="email" className="form-input" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted">Phone</label>
                <input {...register('phone')} className="form-input" placeholder="555-123-4567" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted">Location</label>
                <input {...register('location')} className="form-input" placeholder="City, Country" />
              </div>
              <div className="col-span-full space-y-2">
                <label className="text-sm font-bold text-muted">Summary</label>
                <textarea {...register('summary')} rows={4} className="form-textarea" placeholder="3–5 lines, action-oriented" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-sm font-bold text-muted">Links</div>
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
              <h2 className="text-2xl font-bold text-text">Skills & Expertise</h2>
              <p className="text-muted">Add your core skills and areas of expertise.</p>
            </header>
            <SkillsInput value={values.skills} onChange={v => setValue('skills', v)} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-text">Work Experience</h2>
              <p className="text-muted">Highlight your relevant professional experience.</p>
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
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-text">Projects</h2>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p>Showcase your personal projects, open source contributions, and side work. This is especially important for developers, designers, and creative professionals.</p>
                      <p><strong>Pro tip:</strong> Include GitHub links, live demos, and specific technologies used.</p>
                      <p className="text-blue-200 text-sm">💡 Focus on projects that demonstrate skills relevant to your target role!</p>
                    </div>
                  }
                />
              </div>
              <p className="text-muted">Showcase your personal projects, open source work, and side projects that demonstrate your skills.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {values.projects.map((project, i) => (
                  <ProjectCard key={i} value={project} index={i} onChange={v => updateProject(i, v)} onRemove={() => removeProject(i)} onDuplicate={() => duplicateProject(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addProject} className="btn btn-ghost btn-sm text-blue-600">+ Add project</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-text">Education</h2>
              <p className="text-muted">Your academic background and qualifications.</p>
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

        {step === 6 && (
          <section className="space-y-8">
            <header className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-text">Job Description</h2>
              <p className="text-muted">Tailor your documents to the job description.</p>
            </header>
            {userGoal !== 'cv' && (
              <div className="mb-6">
                <label className="text-sm font-bold text-muted block mb-3">Cover Letter Tone</label>
                <select className="form-select w-48" value={tone} onChange={e=>setTone(e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="concise">Concise</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted">Job Description*</label>
              <textarea 
                className="form-textarea h-48 resize-vertical w-full" 
                value={jd} 
                onChange={e=>setJd(e.target.value)} 
                placeholder="Paste the job description here..."
              />
            </div>
          </section>
        )}
      </div>

      {/* Validation Message */}
      {!isValid && message && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <p className="text-sm text-red-600 font-bold">{message}</p>
        </div>
      )}
      </form>

      {/* Document Generation Loading Screen */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 max-w-md w-full text-center space-y-6 animate-scale-in">
            <div className="loading-spinner w-16 h-16 mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-text">Generating Your Documents</h3>
              <p className="text-muted">
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

      {/* Account Creation Prompt Modal */}
      {showAccountPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 max-w-md w-full text-center space-y-6 animate-scale-in mx-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-text">Trial Credits Used Up</h3>
              <p className="text-muted">
                You've used all your trial generations. 
                Sign up now and get <strong>10 free generations per week</strong> to continue creating tailored resumes and cover letters!
              </p>
              <div className="text-sm text-muted space-y-1">
                <div>✓ 10 free generations weekly</div>
                <div>✓ 10 PDF downloads weekly</div>
                <div>✓ Save your progress</div>
                <div>✓ Professional template</div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => signIn('google')}
                className="btn btn-primary w-full"
              >
                Sign Up with Google
              </button>
              <button 
                onClick={() => signIn('email')}
                className="btn btn-secondary w-full"
              >
                Sign Up with Email
              </button>
              <button 
                onClick={() => setShowAccountPrompt(false)}
                className="text-sm text-muted hover:text-text transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
