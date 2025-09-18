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
import { useCreditContext } from '../contexts/CreditContext';
import { InfoTooltip } from './ui/TooltipPortal';
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

export default function ResumeWizard({ initialData, onComplete, autosaveKey, onAuthCheck, initialUserGoal = 'both' }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { language, getTerminology } = useLanguage();
  const { showError } = useError();
  const terms = getTerminology();
  const { entitlement, userPlan, dayPassUsage } = useCreditContext();
  const stepIds = ['goal', 'basics', 'skills', 'work', 'projects', 'education', 'review'];
  const stepLabels = ['Goal', 'Basics','Skills','Experience','Projects (Optional)','Education','Review'];

  // Dynamic step arrays - ATS mode only has upload step, others skip goal selection
  const getActiveStepIds = () => userGoal === 'ats' ? ['upload'] : stepIds.slice(1); // Remove 'goal' step
  const getActiveStepLabels = () => userGoal === 'ats' ? ['Upload CV'] : stepLabels.slice(1); // Remove 'Goal' label
  const [userGoal, setUserGoal] = useState(initialUserGoal); // 'cv', 'cover-letter', 'both', 'ats'
  const [step, setStep] = useState(0);

  // Reset step if user changes to ATS mode and is on job description step
  useEffect(() => {
    if (userGoal === 'ats' && step === 6) {
      setStep(5); // Move back to education step
    }
  }, [userGoal, step]);

  const isStandardPlan = (plan) => plan === 'standard' || plan === 'free';

  // Check if user has enough generations for specific option
  const canGenerateOption = (requiredGenerations) => {
    if (!session?.user) {
      // Trial users - check trial usage
      const generationsRemaining = trialUsage
        ? Math.max(0, trialUsage.generationsLimit - trialUsage.generationsUsed)
        : 0;


      return generationsRemaining >= requiredGenerations;
    }
    if (isStandardPlan(userPlan)) {
      const free = entitlement?.freeCreditsThisMonth ?? entitlement?.freeWeeklyCreditsRemaining ?? 0;
      const purchased = entitlement?.creditBalance ?? 0;
      return (free + purchased) >= requiredGenerations;
    }
    return true; // Pro users have unlimited generations
  };


  const methods = useForm({ defaultValues: initialData || emptyResume, mode: 'onChange' });
  const { register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = methods;

  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState('');

  // Helper function to get input class names with error styling
  const getInputClassName = (fieldName, baseClasses = 'form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500') => {
    const hasError = !!errors[fieldName];
    if (hasError) {
      return `${baseClasses.replace('focus:ring-blue-500 focus:border-blue-500', 'focus:ring-red-500 focus:border-red-500')} border-red-500 bg-red-50 dark:bg-red-900/20`;
    }
    return baseClasses;
  };

  const getTextareaClassName = (fieldName, baseClasses = 'form-textarea focus:ring-2 focus:ring-blue-500 focus:border-blue-500') => {
    const hasError = !!errors[fieldName];
    if (hasError) {
      return `${baseClasses.replace('focus:ring-blue-500 focus:border-blue-500', 'focus:ring-red-500 focus:border-red-500')} border-red-500 bg-red-50 dark:bg-red-900/20`;
    }
    return baseClasses;
  };
  const [jd, setJd] = useState('');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [trialUsage, setTrialUsage] = useState(null);
  const [trialUsageLoading, setTrialUsageLoading] = useState(true);

  // Handle userGoal logic for signed-out users and generation limits
  useEffect(() => {
    if (!session && trialUsage && !trialUsageLoading) {
      // Trial user logic - only run once when trialUsage loads
      const generationsRemaining = Math.max(0, trialUsage.generationsLimit - trialUsage.generationsUsed);

      if (generationsRemaining < 2) {
        // Not enough generations for 'both', default to 'cv'
        if (userGoal === 'both') {
          setUserGoal('cv');
        }
      } else if (generationsRemaining >= 2) {
        // Has enough generations, force 'both' for trial users
        if (userGoal === 'cv' || userGoal === 'cover-letter') {
          setUserGoal('both');
        }
      }
    }
  }, [session, trialUsage, trialUsageLoading]); // Added trialUsageLoading to prevent running before data loads

  useEffect(() => {
    const sub = watch(() => {
      const activeSteps = getActiveStepIds();
      const key = activeSteps[step];
      // Goal selection is now handled in WizardEntry, so no need to validate it here
      if(step === activeSteps.length - 1){
        // Final step validation
        if (userGoal === 'ats') {
          // For ATS mode, final step is upload - always valid (upload triggers immediately)
          setIsValid(true);
          setMessage('');
          return;
        }

        // For other modes, validate job description and generation capability
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
          } else if (isStandardPlan(userPlan) && getCreditsRemaining() <= 0) {
            setMessage('No credits remaining - Upgrade to Pro or buy credits');
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

  // autosave - database for authenticated users, localStorage for anonymous
  useEffect(() => {
    if (!autosaveKey) return;

    const saveDraft = async (data) => {
      if (session?.user) {
        // Save to database for authenticated users
        try {
          await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftData: data })
          });
        } catch (error) {
          console.error('Error saving draft to database:', error);
          // Fallback to localStorage if database save fails
          try {
            localStorage.setItem(autosaveKey, JSON.stringify(data));
          } catch {}
        }
      } else {
        // Save to localStorage for anonymous users
        try {
          localStorage.setItem(autosaveKey, JSON.stringify(data));
        } catch {}
      }
    };

    const sub = watch((val) => {
      // Debounce saves to avoid excessive API calls
      clearTimeout(window.draftSaveTimeout);
      window.draftSaveTimeout = setTimeout(() => {
        saveDraft(val);
      }, 1000);
    });

    return () => {
      sub.unsubscribe();
      clearTimeout(window.draftSaveTimeout);
    };
  }, [watch, autosaveKey, session]);

  // Fetch trial usage for anonymous users only (authenticated users use CreditContext)
  useEffect(() => {
    const fetchTrialData = async () => {
      if (session?.user?.id) {
        // Authenticated user - fetch entitlements
        try {
          const [entitlementResponse] = await Promise.all([
            fetch('/api/entitlements')
          ]);
          
          if (entitlementResponse.ok) {
            // Entitlement data is managed by CreditContext
            console.log('Entitlement data fetched successfully');
          }
          
          // Day pass usage is managed by CreditContext
        } catch (error) {
          console.error('Error fetching entitlement:', error);
        }
      } else {
        // Anonymous user - fetch trial usage
        try {
          // Trial usage is managed by CreditContext
          console.log('Trial usage will be managed by CreditContext');
        } catch (error) {
          console.error('Error fetching trial usage:', error);
        }
      }
    };

    // Data fetching is now handled by CreditContext
    // fetchTrialData();
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
        if (!String(userPlan || '').startsWith('pro')) {
          showError(
            'You\'ve used all your available credits. Upgrade to Pro or buy credits for unlimited access!',
            'Credit Limit Reached'
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
    if (entitlement) {
      if (String(userPlan || '').startsWith('pro')) return null;
      const free = entitlement.freeCreditsThisMonth ?? entitlement.freeWeeklyCreditsRemaining ?? 0;
      const purchased = entitlement.creditBalance ?? 0;
      return Math.max(0, free + purchased);
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
      return trialUsage ? trialUsage.canGenerate : false;
    }
    if (String(userPlan || '').startsWith('pro')) return true;
    return (getCreditsRemaining() || 0) > 0;
  };

  function next() {
    const activeSteps = getActiveStepIds();
    if (step < activeSteps.length - 1) {
      setStep(s => s + 1);
    }
  }
  function prev() {
    if (step > 0) setStep(s => s - 1);
  }

  const handleCVUpload = async (file) => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const uploadedData = data.resumeData || emptyResume;

        // Debug: Log what was extracted from the CV
        console.log('🔍 CV Upload Debug - Extracted data:', JSON.stringify(uploadedData, null, 2));

        // Skip to final step (analysis) for ATS mode
        reset(uploadedData);
        localStorage.setItem('userGoal', userGoal);

        // Trigger analysis immediately
        await analyzeUploadedCV(uploadedData);
      } else {
        showError(data.error || 'Failed to process CV', 'Upload Failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Failed to process CV. Please try again.', 'Upload Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeUploadedCV = async (resumeData) => {
    try {
      // Create result data for analysis (no generation needed)
      const resultData = {
        resumeData,
        analysisOnly: true
      };

      localStorage.setItem('resumeResult', JSON.stringify(resultData));
      onComplete && onComplete(resultData);
    } catch (error) {
      console.error('Analysis error:', error);
      showError('Failed to analyze CV. Please try again.', 'Analysis Error');
    }
  };
  const saveDraftNow = async () => {
    const data = getValues();
    if (session?.user) {
      try {
        await fetch('/api/save-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftData: data })
        });
      } catch (error) {
        console.error('Error saving draft:', error);
        try {
          localStorage.setItem('resumeWizardDraft', JSON.stringify(data));
        } catch {}
      }
    } else {
      try {
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data));
      } catch {}
    }
  };

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
    const activeSteps = getActiveStepIds();
    if(step !== activeSteps.length -1) return;

    console.log('Submit called with userGoal:', userGoal, 'session:', !!session?.user);

    // If onAuthCheck is provided, use it for real-time auth verification
    if (onAuthCheck) {
      try {
        const authResult = await onAuthCheck();
        if (!authResult.canAccess) {
          if (!authResult.authenticated) {
            setShowAccountPrompt(true);
            return;
          } else {
            showUpgradeAlert(authResult.reason || 'Access denied');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        showError('Unable to verify access. Please try again.');
        return;
      }
    } else if (!canGenerate()) {
      // Fallback to existing check if onAuthCheck not provided
      if (!session?.user) {
        // Trial user has exhausted their generations - show signup BEFORE generation attempt
        const remaining = getTrialGenerationsRemaining();
        console.log('Trial user exhausted, remaining:', remaining);
        setShowAccountPrompt(true);
        return;
      } else if (!String(userPlan || '').startsWith('pro') && (getCreditsRemaining() || 0) <= 0) {
        showUpgradeAlert(`You've used all your monthly credits. Your credits reset on the 1st of each month. Upgrade to Pro or buy credits for unlimited credits!`);
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
      
      // Save job description and userGoal to localStorage for results page
      localStorage.setItem('jobDescription', jd);
      localStorage.setItem('userGoal', userGoal);
      
      const res = await fetch('/api/generate',{method:'POST', body:fd});
      const out = await res.json();
      if(res.ok){
        // Also save job description with the result data
        const resultData = { ...out, jobDescription: jd };
        localStorage.setItem('resumeResult', JSON.stringify(resultData));

        // Clear drafts after successful generation
        if (session?.user) {
          try {
            // Delete draft from database
            await fetch('/api/save-draft', {
              method: 'DELETE'
            });
          } catch (error) {
            console.error('Error clearing database draft:', error);
          }
        }
        // Always clear localStorage draft
        localStorage.removeItem(autosaveKey);

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
          steps={getActiveStepLabels()}
          current={step}
          onChange={(i)=>{ if(i<=step || isValid) setStep(i); }}
          allowNext={isValid}
          showButtons={true}
          isGenerating={isGenerating}
          disabledMessage={message}
          onNext={() => {
            const activeSteps = getActiveStepIds();
            if (step < activeSteps.length - 1) {
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
        {/* Old route selection removed - now handled in WizardEntry */}
        {/* ATS CV Upload Interface - now step 0 since goal selection moved to WizardEntry */}
        {userGoal === 'ats' && step === 0 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Your CV</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Upload your existing CV to get instant ATS compatibility analysis and improvement suggestions.</p>
            </header>

            <div className="max-w-xl mx-auto">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center space-y-4 hover:border-orange-400 transition-colors">
                <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Drop your CV here</h3>
                  <p className="text-gray-500 dark:text-gray-400">or click to browse files</p>
                  <p className="text-sm text-gray-400">Supports PDF, DOC, DOCX files up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCVUpload(file);
                  }}
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>
          </section>
        )}

        {userGoal !== 'ats' && step === 0 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Tell us who you are and how to reach you. This information appears at the top of your resume.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 md:col-span-1 col-span-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                  Name*
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input {...register('name')} className={getInputClassName('name')} placeholder="" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Title / Headline</label>
                <input {...register('title')} className={getInputClassName('title')} placeholder="" />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
                <input {...register('email')} type="email" className={getInputClassName('email')} placeholder="" />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Phone</label>
                <input {...register('phone')} className={getInputClassName('phone')} placeholder="" />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Location</label>
                <input {...register('location')} className={getInputClassName('location')} placeholder="" />
                {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>}
              </div>
              <div className="col-span-full space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Summary</label>
                <textarea {...register('summary')} rows={4} className={getTextareaClassName('summary')} placeholder="" />
                {errors.summary && <p className="text-sm text-red-600 mt-1">{errors.summary.message}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-sm font-bold text-muted">Links</div>
              {(values.links || []).map((l, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                  <input {...register(`links.${i}.label`)} placeholder="" className={getInputClassName(`links.${i}.label`)} />
                  <div className="flex gap-2">
                    <input {...register(`links.${i}.url`)} placeholder="" className={getInputClassName(`links.${i}.url`, "flex-1 form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500")} />
                    <button type="button" onClick={() => removeLink(i)} className="btn btn-ghost text-red-600 hover:bg-red-50">×</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLink} className="btn btn-ghost btn-sm" style={{color: '#2840A7'}}>+ Add link</button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Skills & Expertise</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Add your core skills and areas of expertise that make you stand out.</p>
            </header>
            <SkillsInput value={values.skills} onChange={v => setValue('skills', v)} />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Highlight your relevant professional experience and achievements.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {(values.experience || []).map((exp, i) => (
                  <ExperienceCard key={i} value={exp} index={i} onChange={v => updateExp(i, v)} onRemove={() => removeExp(i)} onDuplicate={() => duplicateExp(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addExp} className="btn btn-ghost btn-sm" style={{color: '#2840A7'}}>+ Add role</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Projects <span className="text-lg font-normal text-gray-500 dark:text-gray-400">(Optional)</span></h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                <strong>Optional:</strong> Showcase your personal projects, open source work, and side projects that demonstrate your skills.
                <span className="block mt-2 text-base text-gray-500 dark:text-gray-400">You can skip this section if you don't have relevant projects to include.</span>
              </p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {(values.projects || []).map((project, i) => (
                  <ProjectCard key={i} value={project} index={i} onChange={v => updateProject(i, v)} onRemove={() => removeProject(i)} onDuplicate={() => duplicateProject(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addProject} className="btn btn-ghost btn-sm" style={{color: '#2840A7'}}>+ Add project</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Education</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Your academic background and qualifications that support your career goals.</p>
            </header>
            <div className="space-y-4">
              <AnimatePresence>
                {(values.education || []).map((edu, i) => (
                  <EducationCard key={i} value={edu} index={i} onChange={v => updateEdu(i, v)} onRemove={() => removeEdu(i)} onDuplicate={() => duplicateEdu(i)} />
                ))}
              </AnimatePresence>
              <button type="button" onClick={addEdu} className="btn btn-ghost btn-sm" style={{color: '#2840A7'}}>+ Add education</button>
            </div>
          </section>
        )}

        {step === 5 && userGoal !== 'ats' && (
          <section className="space-y-8">
            <header className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Job Description</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">Tailor your documents to match the specific job requirements and get noticed by recruiters.</p>
            </header>
            {userGoal !== 'cv' && (
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-3">Cover Letter Tone</label>
                <select className="form-select w-48 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={tone} onChange={e=>setTone(e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="concise">Concise</option>
                </select>
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                Job Description*
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                className="form-textarea h-48 resize-vertical w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={jd}
                onChange={e=>setJd(e.target.value)}
                placeholder="Paste the complete job description here..."
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
                {userGoal === 'ats'
                  ? 'Analyzing your CV for ATS compatibility and parsing data. This may take a moment...'
                  : 'AI is analyzing your resume and the job description to create tailored documents. This may take a moment...'
                }
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{backgroundColor: '#2840A7'}}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-text">Trial Credits Used Up</h3>
              <p className="text-muted">
                You've used all your trial generations. 
                Sign up now and get <strong>6 free credits per month</strong> to continue creating tailored resumes and cover letters!
              </p>
              <div className="text-sm text-muted space-y-1">
                <div>✓ 6 free credits monthly</div>
                <div>✓ PDF downloads included</div>
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

