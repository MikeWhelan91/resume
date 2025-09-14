import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, Sparkles, ArrowRight, Zap, Shield, Star, Clock, Info, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useError } from '../../contexts/ErrorContext';
import { InfoTooltip, HelpTooltip } from './TooltipPortal';
import OnboardingTourFixed from './OnboardingTourFixed';
import FirstTimeUserGuide from './FirstTimeUserGuide';
import TourTrigger from './TourTrigger';

export default function HeroUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const { getTerminology } = useLanguage();
  const { showError } = useError();
  const terms = getTerminology();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [checkingResume, setCheckingResume] = useState(false);
  const [showTourTrigger, setShowTourTrigger] = useState(false);
  const [hasJustUploaded, setHasJustUploaded] = useState(false);
  const [trialUsage, setTrialUsage] = useState(null);
  const [trialUsageLoading, setTrialUsageLoading] = useState(true);
  const [authCheck, setAuthCheck] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (session?.user) {
      checkForLatestResume();
    } else {
      // Fetch trial usage for anonymous users
      fetchTrialUsage();
    }
    
    // Check authentication and access status
    checkAuthStatus();
    
    // Check if we should show the tour trigger
    const checkTourTrigger = () => {
      const hasSeenGuide = localStorage.getItem('first_time_guide_shown') === 'true';
      setShowTourTrigger(hasSeenGuide);
    };
    
    checkTourTrigger();
    
    // Listen for the first-time guide completion
    const handleGuideCompleted = () => {
      setShowTourTrigger(true);
    };
    
    window.addEventListener('firstTimeGuideCompleted', handleGuideCompleted);
    return () => {
      window.removeEventListener('firstTimeGuideCompleted', handleGuideCompleted);
    };
  }, [session]);

  const checkForLatestResume = async () => {
    try {
      const response = await fetch('/api/resumes/latest');
      setHasLatestResume(response.ok);
    } catch (error) {
      console.error('Error checking for latest resume:', error);
      setHasLatestResume(false);
    }
  };

  const loadLatestResume = async () => {
    setCheckingResume(true);
    setLoadingMessage(`Loading your most recent ${terms.resume}...`);
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.data));
        setLoadingMessage('Perfect! Taking you to the wizard...');
        setTimeout(() => router.push('/wizard'), 500);
      } else {
        showError(`Failed to load your most recent ${terms.resume}. Please try again.`);
      }
    } catch (error) {
      console.error('Error loading latest resume:', error);
      showError(`Failed to load your most recent ${terms.resume}. Please try again.`);
    } finally {
      setCheckingResume(false);
      setLoadingMessage('');
    }
  };

  async function handleFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    
    // Check if user can generate new resumes before processing file
    if (!canGenerate()) {
      if (authCheck) {
        if (authCheck.authenticated) {
          showError(authCheck.reason || 'You do not have access to upload resumes. Please upgrade your plan.', 'Access Denied');
        } else {
          showError(authCheck.reason || 'You have used all your free trials. Please sign up to upload unlimited resumes!', 'Trial Limit Reached');
        }
      } else {
        showError('You cannot upload resumes at this time. Please try again later.', 'Access Denied');
      }
      // Reset file input
      e.target.value = '';
      return;
    }
    
    setLoading(true);
    setHasJustUploaded(true); // Mark that user has uploaded
    setLoadingMessage('Uploading file...');
    try{
      const fd = new FormData();
      fd.append('resume', f);
      setLoadingMessage(`Extracting text from ${terms.resume}...`);
      const res = await fetch('/api/parse-resume',{method:'POST', body:fd});
      setLoadingMessage('AI analysing your experience...');
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.resumeData||{}));
        setLoadingMessage('Perfect! Taking you to the wizard...');
        setTimeout(() => router.push('/wizard'), 500); // Small delay for user feedback
      } else {
        showError(data.error || `Failed to process ${terms.resume}`, 'Upload Failed');
        setHasJustUploaded(false); // Reset so user can try different paths
      }
    } catch(err) {
      showError(`Failed to process ${terms.resume}. Please try again.`, 'Upload Error');
      setHasJustUploaded(false); // Reset so user can try different paths
    } finally{ 
      setLoading(false); 
      setLoadingMessage('');
    }
  }

  async function fetchTrialUsage() {
    try {
      setTrialUsageLoading(true);
      const response = await fetch('/api/trial-usage');
      if (response.ok) {
        const data = await response.json();
        setTrialUsage(data);
      }
    } catch (error) {
      console.error('Error fetching trial usage:', error);
    } finally {
      setTrialUsageLoading(false);
    }
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth-check');
      const data = await response.json();
      setAuthCheck(data);
    } catch (error) {
      console.error('Error checking auth status:', error);
      // If check fails, assume no access for safety
      setAuthCheck({ authenticated: false, canAccess: false, reason: 'Unable to verify access' });
    } finally {
      setCheckingAuth(false);
    }
  }

  const canGenerate = () => {
    // Use authCheck if available, otherwise fall back to old logic for backward compatibility
    if (authCheck) {
      return authCheck.canAccess;
    }
    
    // Fallback logic (old behavior)
    if (session?.user) return true; // Logged in users can always generate
    if (!session && trialUsage) {
      return trialUsage.canGenerate;
    }
    return false;
  };

  function handleCreateNew(){
    // Check if user can generate new resumes
    if (!canGenerate()) {
      if (authCheck) {
        if (authCheck.authenticated) {
          showError(authCheck.reason || 'You do not have access to create new resumes. Please upgrade your plan.', 'Access Denied');
        } else {
          showError(authCheck.reason || 'You have used all your free trials. Please sign up to create unlimited resumes!', 'Trial Limit Reached');
        }
      } else {
        // Fallback message
        showError('You cannot create new resumes at this time. Please try again later.', 'Access Denied');
      }
      return;
    }
    
    // Clear any existing draft and go directly to wizard
    localStorage.removeItem('resumeWizardDraft');
    router.push('/wizard');
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative bg-bg">
        {/* Minimal background accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-24 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/2 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative tc-container">
          <div className="flex flex-col lg:flex-row items-center lg:items-start min-h-[90vh] py-12 lg:py-20">
            
            {/* Left Column - Content */}
            <div className="flex-1 lg:pr-20 text-center max-w-2xl lg:max-w-none">
              

              {/* Clean headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text leading-tight mb-8">
                Your {terms.resume},
                <br />
                <span className="text-primary">perfectly matched</span>
                <br />
                to every job
              </h1>

              {/* Clear value prop */}
              <p className="text-xl text-muted leading-relaxed mb-12 max-w-2xl">
                Upload your {terms.resume}, paste any job description, and get a tailored application package that beats ATS systems and lands interviews.
              </p>


              <div className="mb-16">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="flex-1 lg:pl-20 max-w-xl lg:max-w-none mt-12 lg:mt-0">
              <div className="relative">
                {/* Main demo card */}
                <div className="tc-card-elevated tc-card-hover relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-text">{terms.Resume} Upload</div>
                        <div className="text-xs text-muted">Instant AI Analysis</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Clickable upload interface */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 transition-all duration-250 flex items-center justify-center min-h-[120px] ${
                      canGenerate() 
                        ? "border-border dark:border-border-strong cursor-pointer hover:border-primary hover:bg-primary/5 group" 
                        : "border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800 opacity-60"
                    }`}
                    onClick={() => canGenerate() && fileRef.current?.click()}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="space-y-2">
                        <div className={`text-base font-medium transition-colors duration-250 ${
                          canGenerate() 
                            ? "text-text group-hover:text-primary" 
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {canGenerate() ? `Drop your ${terms.Resume} here` : `Upload ${authCheck?.authenticated ? 'Disabled' : 'Limited'}`}
                        </div>
                        <div className={`text-sm transition-colors duration-250 ${
                          canGenerate() 
                            ? "text-muted group-hover:text-primary/80" 
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {canGenerate() 
                            ? "PDF, DOCX, or TXT • Up to 10MB"
                            : authCheck?.authenticated 
                              ? "Please upgrade to upload resumes"
                              : "Sign up for free access"
                          }
                        </div>
                      </div>
                      <Upload className={`w-10 h-10 transition-colors duration-250 flex-shrink-0 ${
                        canGenerate() 
                          ? "text-muted group-hover:text-primary" 
                          : "text-gray-400 dark:text-gray-500"
                      }`} />
                    </div>
                  </div>
                  
                  {/* Steps preview */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="w-8 h-8 bg-success-light rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                      </div>
                      <span className="text-muted">AI extracts your information</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                      </div>
                      <span className="text-muted">Paste job description</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                      </div>
                      <span className="text-muted">Get tailored documents</span>
                    </div>
                  </div>
                </div>

                {/* Start Fresh Button - moved here */}
                <div className="mt-6 flex flex-col items-center space-y-3">
                  <InfoTooltip 
                    content="Build your resume from scratch using our step-by-step wizard."
                    position="bottom"
                  >
                    <button 
                      className="btn btn-primary btn-xl w-full max-w-sm group"
                      onClick={handleCreateNew} 
                      disabled={loading || checkingResume || !canGenerate()}
                    >
                      <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                      Start Fresh
                    </button>
                  </InfoTooltip>

                  {/* Recent resume option for logged-in users - hide during upload and after upload */}
                  {session?.user && hasLatestResume && !loading && !hasJustUploaded && (
                    <InfoTooltip 
                      content="Continue editing your previously saved resume."
                      position="bottom"
                    >
                      <button 
                        className="btn btn-outline btn-md group"
                        onClick={loadLatestResume}
                        disabled={loading || checkingResume}
                      >
                        <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                        Use Recent
                      </button>
                    </InfoTooltip>
                  )}
                </div>

                {/* Subtle accent elements */}
                <div className="absolute top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary/8 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Features Section */}
      <div className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">From Job Description to Perfect Match</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Transform any job posting into a winning application in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-text" data-tour="process-steps">
            <div className="card bg-surface/60 backdrop-blur-sm border border-border/20 rounded-xl text-center p-8 group">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">1. Upload Your {terms.Resume}</h3>
              <p className="text-muted">
                Upload your existing {terms.resume} or build one from scratch using our smart wizard.
              </p>
              <InfoTooltip 
                content="We support PDF, DOCX, and TXT files. Our AI will automatically extract all your information including work experience, education, and skills."
                position="bottom"
                size="lg"
              >
                <span className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700 cursor-help">
                  ℹ️ What formats are supported?
                </span>
              </InfoTooltip>
            </div>
            
            <div className="card bg-surface/60 backdrop-blur-sm border border-border/20 rounded-xl text-center p-8 group">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">2. Paste Job Description</h3>
              <p className="text-muted">
                Copy any job posting and our AI instantly analyses the requirements to tailor your {terms.resume} and cover letter.
              </p>
              <InfoTooltip 
                content="Our AI analyzes keywords, required skills, and company culture from the job posting to customize your documents perfectly. The more detailed the job description, the better the results!"
                position="bottom"
                size="xl"
              >
                <span className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700 cursor-help">
                  ℹ️ How does AI tailoring work?
                </span>
              </InfoTooltip>
            </div>
            
            <div className="card bg-surface/60 backdrop-blur-sm border border-border/20 rounded-xl text-center p-8 group">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">3. Tailor Documents</h3>
              <p className="text-muted">
                Download perfectly tailored {terms.resume} and cover letter optimised for that specific job – repeat for every application!
              </p>
              <InfoTooltip 
                content="Each tailored version highlights relevant experience, adjusts keywords for ATS compatibility, and includes a custom cover letter. Apply to multiple jobs with confidence!"
                position="bottom"
                size="xl"
              >
                <span className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700 cursor-help">
                  ℹ️ What makes it ATS-friendly?
                </span>
              </InfoTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-surface/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-text">Apply to Multiple Jobs</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
            One {terms.Resume}, <span className="text-gradient">Unlimited Tailored Versions</span>
          </h2>
          
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Stop sending the same generic {terms.resume} to every job. Create a perfectly matched application for each position by simply pasting the job description. The more jobs you apply to, the better your chances!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.1s'}}>
              <div className="text-2xl font-bold text-blue-600 mb-2">AI</div>
              <div className="text-sm text-muted">Powered Customization</div>
            </div>
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.2s'}}>
              <div className="text-2xl font-bold text-purple-600 mb-2">ATS</div>
              <div className="text-sm text-muted">Optimized Format</div>
            </div>
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.3s'}}>
              <div className="text-2xl font-bold text-green-600 mb-2">PDF</div>
              <div className="text-sm text-muted">Professional Output</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              className="btn btn-primary btn-lg group" 
              onClick={()=>fileRef.current?.click()} 
              disabled={loading || !canGenerate()}
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Tailoring Now
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              className="btn btn-secondary btn-lg group" 
              onClick={handleCreateNew} 
              disabled={loading || !canGenerate()}
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Build From Scratch
            </button>
          </div>
        </div>
      </div>

      {/* Modern Loading Screen */}
      {(loading || checkingResume) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 max-w-sm w-full text-center space-y-6 animate-scale-in">
            <div className="loading-spinner w-12 h-12 mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-text">
                {checkingResume ? `Loading Your ${terms.Resume}` : `Processing Your ${terms.Resume}`}
              </h3>
              <p className="text-muted">{loadingMessage}</p>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      {/* First-time user guide */}
      <FirstTimeUserGuide />
      
      {/* Manual tour trigger (only show after first-time guide is dismissed) */}
      {showTourTrigger && !session && (
        <TourTrigger onStartTour={() => console.log('Starting tour')} />
      )}
      
      {/* Onboarding Tour - now manual only */}
      <OnboardingTourFixed 
        onComplete={() => console.log('Tour completed')}
        storageKey="hero_onboarding_completed"
      />

    </div>
  );
}
