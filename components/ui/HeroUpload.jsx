import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, Sparkles, ArrowRight, Zap, Shield, Star, Clock, Info, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { InfoTooltip, HelpTooltip } from './TooltipPortal';
import OnboardingTourFixed from './OnboardingTourFixed';
import FirstTimeUserGuide from './FirstTimeUserGuide';
import TourTrigger from './TourTrigger';

export default function HeroUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const { getTerminology } = useLanguage();
  const terms = getTerminology();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [checkingResume, setCheckingResume] = useState(false);
  const [showNewUserHelp, setShowNewUserHelp] = useState(false);
  const [showTourTrigger, setShowTourTrigger] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkForLatestResume();
    } else {
      // Show help for new users after a short delay
      const timer = setTimeout(() => {
        const hasSeenHelp = localStorage.getItem('hero_help_shown') === 'true';
        if (!hasSeenHelp) {
          setShowNewUserHelp(true);
          localStorage.setItem('hero_help_shown', 'true');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
    
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
        alert(`Failed to load your most recent ${terms.resume}. Please try again.`);
      }
    } catch (error) {
      console.error('Error loading latest resume:', error);
      alert(`Failed to load your most recent ${terms.resume}. Please try again.`);
    } finally {
      setCheckingResume(false);
      setLoadingMessage('');
    }
  };

  async function handleFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    setLoading(true);
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
        alert(data.error || `Failed to process ${terms.resume}`);
      }
    } catch(err) {
      alert(`Failed to process ${terms.resume}. Please try again.`);
    } finally{ 
      setLoading(false); 
      setLoadingMessage('');
    }
  }

  function handleCreateNew(){
    // Clear any existing draft and go directly to wizard
    localStorage.removeItem('resumeWizardDraft');
    router.push('/wizard');
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-900">
        {/* Minimal background accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-24 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100 to-transparent rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start min-h-[85vh] py-6 lg:py-12">
            
            {/* Left Column - Content */}
            <div className="flex-1 lg:pr-16 text-center max-w-2xl lg:max-w-none">
              

              {/* Clean headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Your {terms.resume},
                <br />
                <span className="text-blue-600 dark:text-blue-400">perfectly matched</span>
                <br />
                to every job
              </h1>

              {/* Clear value prop */}
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-10 max-w-lg">
                Upload your {terms.resume}, paste any job description, and get a tailored application package that beats ATS systems and lands interviews.
              </p>


              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16 items-center justify-center" data-tour="upload-options">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
              
                {/* Primary CTA - Upload */}
                <InfoTooltip 
                  content={`Upload your existing ${terms.resume} (PDF, DOCX, or TXT) and we'll extract all your information automatically.`}
                  position="bottom"
                  size="lg"
                >
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center group"
                    onClick={()=>fileRef.current?.click()} 
                    disabled={loading || checkingResume}
                  >
                    <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Upload {terms.resume}
                  </button>
                </InfoTooltip>

                {/* Secondary CTA */}
                <InfoTooltip 
                  content="Build your resume from scratch using our step-by-step wizard."
                  position="bottom"
                >
                  <button 
                    className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center group"
                    onClick={handleCreateNew} 
                    disabled={loading || checkingResume}
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Start Fresh
                  </button>
                </InfoTooltip>

                {/* Recent resume option for logged-in users */}
                {session?.user && hasLatestResume && (
                  <InfoTooltip 
                    content="Continue editing your previously saved resume."
                    position="bottom"
                  >
                    <button 
                      className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center group"
                      onClick={loadLatestResume}
                      disabled={loading || checkingResume}
                    >
                      <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Use Recent
                    </button>
                  </InfoTooltip>
                )}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="flex-1 lg:pl-16 max-w-xl lg:max-w-none mt-2 lg:mt-0">
              <div className="relative">
                {/* Main demo card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Resume Upload</div>
                        <div className="text-xs text-gray-500">Instant AI Analysis</div>
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
                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                    <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700 mb-1 transition-colors">Drop your {terms.resume.toLowerCase()} here</div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">PDF, DOCX, or TXT • Up to 10MB</div>
                  </div>
                  
                  {/* Steps preview */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">AI extracts your information</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">Paste job description</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      </div>
                      <span className="text-gray-600">Get tailored documents</span>
                    </div>
                  </div>
                </div>

                {/* Background accent cards */}
                <div className="absolute top-4 -right-4 w-48 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl opacity-10 -z-10"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-24 bg-gradient-to-tr from-green-500 to-blue-500 rounded-xl opacity-10 -z-10"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* First-time user help callout */}
        {!session && showNewUserHelp && (
          <div className="bg-gray-50 border-t">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 relative max-w-2xl mx-auto">
                  <button 
                    onClick={() => setShowNewUserHelp(false)}
                    className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">
                        👋 New to TailoredCV? Here's how it works:
                      </h3>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Upload your existing resume or build one from scratch</li>
                        <li>Paste any job description you want to apply for</li>
                        <li>Get a perfectly tailored resume + cover letter in seconds!</li>
                      </ol>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-blue-600">
                          ✨ Try it free - no signup required for your first resume!
                        </p>
                        <p className="text-xs text-green-600">
                          📈 Sign up for 10 personalized CVs & cover letters per week + premium templates
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">From Job Description to Perfect Match</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform any job posting into a winning application in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8" data-tour="process-steps">
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Your {terms.Resume}</h3>
              <p className="text-gray-600">
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
            
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Paste Job Description</h3>
              <p className="text-gray-600">
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
            
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Tailor Documents</h3>
              <p className="text-gray-600">
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
      <div className="py-20 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Apply to Multiple Jobs</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            One {terms.Resume}, <span className="text-gradient">Unlimited Tailored Versions</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop sending the same generic {terms.resume} to every job. Create a perfectly matched application for each position by simply pasting the job description. The more jobs you apply to, the better your chances!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-blue-600 mb-2">10x</div>
              <div className="text-sm text-gray-600">Faster Application Process</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">ATS Compatibility Rate</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-green-600 mb-2">3x</div>
              <div className="text-sm text-gray-600">More Interview Callbacks</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              className="btn btn-primary btn-lg group" 
              onClick={()=>fileRef.current?.click()} 
              disabled={loading}
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Tailoring Now
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              className="btn btn-secondary btn-lg group" 
              onClick={handleCreateNew} 
              disabled={loading}
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
              <h3 className="text-xl font-semibold text-gray-900">
                {checkingResume ? `Loading Your ${terms.Resume}` : `Processing Your ${terms.Resume}`}
              </h3>
              <p className="text-gray-600">{loadingMessage}</p>
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
