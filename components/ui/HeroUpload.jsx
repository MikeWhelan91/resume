import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, Sparkles, ArrowRight, Zap, Shield, Star, Clock, Info, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useError } from '../../contexts/ErrorContext';
import { InfoTooltip } from './TooltipPortal';
import OnboardingTourFixed from './OnboardingTourFixed';
import FirstTimeUserGuide from './FirstTimeUserGuide';

// Single Carousel Component
function SingleCarousel({ features, offset = 0, colorTheme = 'default' }) {
  const [currentFeature, setCurrentFeature] = useState(offset);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Set initial offset
    setCurrentFeature(offset);

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [features.length, offset]);

  const itemHeight = isMobile ? 64 : 40;

  // Color theme configurations
  const colorThemes = {
    blue: {
      glow: 'from-blue-500/20 via-blue-400/10 to-blue-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-600'
    },
    purple: {
      glow: 'from-purple-500/20 via-purple-400/10 to-purple-600/20',
      border: 'border-purple-500/30',
      text: 'text-purple-600'
    },
    green: {
      glow: 'from-green-500/20 via-green-400/10 to-green-600/20',
      border: 'border-green-500/30',
      text: 'text-green-600'
    },
    default: {
      glow: 'from-primary/10 via-accent/10 to-primary/10',
      border: 'border-border/20',
      text: 'text-text'
    }
  };

  const theme = colorThemes[colorTheme] || colorThemes.default;

  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.glow} rounded-xl blur-xl`}></div>

      <div className={`relative text-center overflow-hidden h-16 sm:h-10 bg-surface/30 backdrop-blur-sm rounded-lg ${theme.border} shadow-lg`}>
        <div
          className="transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateY(-${currentFeature * itemHeight}px)`
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="h-16 sm:h-10 flex items-center justify-center px-6 relative group"
            >
              <div className="flex items-center justify-center relative z-10">
                {/* Text without gradient effect */}
                <div className="text-center">
                  <div className={`text-sm sm:text-base font-bold ${theme.text} transition-all duration-500`}>
                    {feature.text}
                  </div>
                  <div className="text-sm text-muted/80 hidden sm:block">
                    {feature.subtext}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Triple Rotating Features Component
function RotatingFeatures() {
  const features = [
    { text: 'ATS-Optimized', subtext: 'Beats applicant tracking systems' },
    { text: '5+ Premium Templates', subtext: 'Professional to creative designs' },
    { text: 'DOCX + PDF Downloads', subtext: 'Multiple format support' },
    { text: 'Cover Letter Generation', subtext: 'Perfectly matched to your resume' },
    { text: 'Skill Cross-Referencing', subtext: 'No fabricated experience' },
    { text: '24-Hour Day Pass', subtext: 'Perfect for urgent applications' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {/* Left carousel - offset by 0 - Blue theme */}
      <div className="hidden md:block">
        <SingleCarousel features={features} offset={0} colorTheme="blue" />
      </div>

      {/* Center carousel - offset by 2 - Purple theme */}
      <div>
        <SingleCarousel features={features} offset={2} colorTheme="purple" />
      </div>

      {/* Right carousel - offset by 4 - Green theme */}
      <div className="hidden md:block">
        <SingleCarousel features={features} offset={4} colorTheme="green" />
      </div>
    </div>
  );
}

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
      } else {
        // Provide fallback trial usage data
        setTrialUsage({
          generationsUsed: 0,
          generationsRemaining: 2,
          generationsLimit: 2,
          canGenerate: true,
          canDownload: true
        });
      }
    } catch (error) {
      console.error('Error fetching trial usage:', error);
      // Provide fallback trial usage data
      setTrialUsage({
        generationsUsed: 0,
        generationsRemaining: 2,
        generationsLimit: 2,
        canGenerate: true,
        canDownload: true
      });
    } finally {
      setTrialUsageLoading(false);
    }
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth-check');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setAuthCheck(data);
    } catch (error) {
      console.error('Error checking auth status:', error);
      // If check fails, assume limited access for trial users
      setAuthCheck({
        authenticated: false,
        canAccess: !session, // Trial users get basic access if API fails
        reason: error.message.includes('NetworkError') ? 'Connection error' : 'Unable to verify access',
        generationsRemaining: !session ? 2 : 0,
        generationsLimit: 2
      });
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

    // Go to wizard entry screen where user can choose their path
    router.push('/wizard');
  }

  return (
    <div className="relative">
      {/* Trial Exhausted Banner */}
      {!session && authCheck && !authCheck.canAccess && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-4 py-3 text-center">
          <div className="max-w-4xl mx-auto">
            <span className="font-medium">
              You've used all {authCheck.generationsLimit} free generations.
            </span>
            <span className="ml-2">
              <a href="/auth/signup" className="text-blue-600 hover:text-blue-700 underline font-semibold">
                Sign up free
              </a> for 10 generations per week, or{' '}
              <a href="/pricing" className="text-blue-600 hover:text-blue-700 underline font-semibold">
                upgrade to Pro
              </a> for unlimited access!
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-bg">
        {/* Hero background image with color accents */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main background image with reduced greyscale */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/heroalt3.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'grayscale(15%)',
            }}
          ></div>
          {/* Brand color overlay removed per user request */}
          {/* Subtle readability overlay */}
          <div className="absolute inset-0 bg-bg/25"></div>
          {/* Enhanced brand color accents */}
          <div className="absolute top-16 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/12 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/6 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative tc-container">
          <div className="flex flex-col lg:flex-row items-center lg:items-start py-4 lg:py-6">

            {/* Left Column - Content */}
            <div className="flex-1 lg:pr-20 text-center max-w-2xl lg:max-w-none">
              {/* Content container with shared background */}
              <div className="bg-surface/70 backdrop-blur-sm rounded-2xl p-8 border border-border/20">
                {/* Clean headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text leading-tight mb-8">
                  Your {terms.resume},
                  <br />
                  <span style={{color: '#2840A7'}}>perfectly matched</span>
                  <br />
                  to every job
                </h1>

                {/* Clear value prop */}
                <p className="text-xl text-text font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
                  Upload your {terms.resume}, paste any job description, and get a tailored application package that beats ATS systems and lands interviews.
                </p>
              </div>


              <div className="mb-16">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="flex-1 lg:pl-20 max-w-xl lg:max-w-none mt-12 lg:mt-0">
              <div className="relative">
                {/* Main demo card */}
                <div className="tc-card-elevated tc-card-hover relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-text">{terms.Resume} Upload</div>
                        <div className="text-sm text-muted">Instant AI Analysis</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clickable upload interface */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 transition-all duration-250 flex items-center justify-center min-h-[120px] ${
                      canGenerate() 
                        ? "border-border dark:border-border-strong cursor-pointer hover:border-primary hover:bg-primary/5 group" 
                        : "border-gray-300 dark:border-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800 opacity-60"
                    }`}
                    onClick={() => canGenerate() && router.push('/wizard')}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="space-y-2">
                        <div className={`text-base font-medium transition-colors duration-250 ${
                          canGenerate() 
                            ? "text-text group-hover:text-primary" 
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {canGenerate() ? 'Click to Start' : `Upload ${authCheck?.authenticated ? 'Disabled' : 'Limited'}`}
                        </div>
                        <div className={`text-sm transition-colors duration-250 ${
                          canGenerate() 
                            ? "text-muted group-hover:text-primary/80" 
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {canGenerate()
                            ? "Start your tailored application"
                            : authCheck?.authenticated
                              ? "Please upgrade to get started"
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

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <InfoTooltip
                    content="Start creating your tailored resume and cover letter with our step-by-step wizard."
                    position="bottom"
                  >
                    <button
                      className="btn btn-primary btn-xl w-full sm:w-auto group"
                      onClick={handleCreateNew}
                      disabled={loading || checkingResume || !canGenerate()}
                    >
                      <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                      Start Now
                    </button>
                  </InfoTooltip>

                </div>

                {/* Subtle accent elements */}
                <div className="absolute top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full -z-10"></div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary/8 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Section Break - Rotating Features */}
      <div className="py-6 bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <RotatingFeatures />
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="relative py-20 bg-surface overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url(/2herobg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(30%)',
          }}
        ></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-surface/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-text">Apply to Multiple Jobs</span>
          </div>
          
          <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-8 border border-border/20 max-w-4xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
              One {terms.Resume}, <span style={{color: '#2840A7'}}>Unlimited Tailored Versions</span>
            </h2>

            <p className="text-xl text-muted">
              Stop sending the same generic {terms.resume} to every job. Create a perfectly matched application for each position by simply pasting the job description. The more jobs you apply to, the better your chances!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.1s'}}>
              <div className="text-2xl font-bold text-blue-600 mb-2">AI</div>
              <div className="text-sm text-muted">Powered Customization</div>
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
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.2s'}}>
              <div className="text-2xl font-bold text-purple-600 mb-2">ATS</div>
              <div className="text-sm text-muted">Optimized Format</div>
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
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-6 border border-border/20 animate-slide-up hover:scale-105 transition-transform duration-200" style={{animationDelay: '0.3s'}}>
              <div className="text-2xl font-bold text-green-600 mb-2">PDF</div>
              <div className="text-sm text-muted">Professional Output</div>
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
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="btn btn-primary btn-lg group"
              onClick={() => router.push('/wizard')}
              disabled={loading || !canGenerate()}
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Now
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
      
      
      {/* Onboarding Tour - now manual only */}
      <OnboardingTourFixed 
        onComplete={() => console.log('Tour completed')}
        storageKey="hero_onboarding_completed"
      />

    </div>
  );
}
