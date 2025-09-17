import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Upload,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  Shield,
  Star,
  Clock,
  Info,
  X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useError } from '../../contexts/ErrorContext';
import { useCreditContext } from '../../contexts/CreditContext';
import { InfoTooltip } from './TooltipPortal';
import OnboardingTourFixed from './OnboardingTourFixed';
import FirstTimeUserGuide from './FirstTimeUserGuide';
import { motion } from 'framer-motion';

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

      <div
        className={`relative text-center bg-surface/30 backdrop-blur-sm rounded-lg ${theme.border} shadow-lg`}
        style={{
          overflow: 'hidden',
          height: isMobile ? '64px' : '40px',
          clipPath: 'inset(0px 0px 0px 0px)'
        }}
      >
        <div
          className="transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateY(-${currentFeature * itemHeight}px)`
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{ height: `${itemHeight}px` }}
              className="flex items-center justify-center px-6 relative"
            >
              <div className="flex items-center justify-center text-center">
                <div>
                  <div className={`text-sm sm:text-base font-bold ${theme.text} transition-all duration-500`}>
                    {feature.text}
                  </div>
                  <div className="text-sm text-muted/80 hidden sm:block mt-0.5">
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
    { text: 'AI-Tailored Content', subtext: 'Matches job requirements perfectly' },
    { text: '5+ Premium Templates', subtext: 'Professional to creative designs' },
    { text: 'DOCX + PDF Downloads', subtext: 'Multiple format support' },
    { text: 'Cover Letter Generation', subtext: 'Perfectly matched to your resume' },
    { text: 'Smart Keyword Optimization', subtext: 'Highlights relevant experience' },
    { text: 'Credit Packs Available', subtext: 'Buy more when you need them' }
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
  const { creditStatus } = useCreditContext();
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
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [secondaryImageLoaded, setSecondaryImageLoaded] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkForLatestResume();
    } else {
      // Fetch trial usage for anonymous users
      fetchTrialUsage();
    }

    // Check authentication and access status
    checkAuthStatus();

    // Preload hero images for better performance
    const preloadImages = () => {
      const img1 = new window.Image();
      img1.onload = () => setHeroImageLoaded(true);
      img1.src = '/herocyber.jpg';

      const img2 = new window.Image();
      img2.onload = () => setSecondaryImageLoaded(true);
      img2.src = '/2herobg.jpg';
    };

    preloadImages();

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

  const showCreditModal = () => {
    const creditsRemaining = creditStatus?.credits?.total || 0;

    const modalContent = `
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Credits Remaining</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">You have ${creditsRemaining} credits left. You need credits to create tailored resumes and cover letters.</p>
        <div class="space-y-3">
          <button onclick="window.location.href='/pricing'" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Buy More Credits
          </button>
          <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        ${modalContent}
      </div>
    `;

    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  };

  function handleCreateNew(){
    // Check if user can generate new resumes
    if (!canGenerate()) {
      if (authCheck) {
        if (authCheck.authenticated) {
          // Check if it's a credit issue (same logic as navbar)
          if (creditStatus && creditStatus.needsCredits) {
            showCreditModal();
          } else {
            showError(authCheck.reason || 'You do not have access to create new resumes. Please upgrade your plan.', 'Access Denied');
          }
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
    <><div className="relative">
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
              </a> for monthly free credits, or{' '}
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
          {/* Loading placeholder */}
          {!heroImageLoaded && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 animate-pulse"></div>
          )}

          {/* Main background image with dark overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: heroImageLoaded ? 'url(/herocyber.jpg)' : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          {/* Enhanced brand color accents */}
          <div className="absolute top-16 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/12 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/6 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative tc-container">
            <div className="flex flex-col items-center text-center py-6 lg:py-8">

            {/* Centered Content */}
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Modern badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center space-x-2 bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 text-sm font-medium text-white"
                >
                  <span>AI-Powered Resume Tailoring</span>
                </motion.div>

                {/* Clean headline with better typography */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight"
                >
                  Your {terms.resume},{' '}
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Perfectly Matched
                  </motion.span>
                  <br />
                  To Every Job
                </motion.h1>

                {/* Enhanced value prop */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-xl text-gray-200 font-medium leading-relaxed max-w-2xl mx-auto"
                >
                  Transform your job applications with AI. Upload your {terms.resume}, paste any job description, and get a perfectly tailored application package that matches job requirements and lands interviews.
                </motion.p>

                {/* Enhanced CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <div className="flex items-center space-x-1 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>No credit card required</span>
                  </div>

                  <button
                    className={`group relative overflow-hidden bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${(loading || checkingResume || checkingAuth) ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                    onClick={handleCreateNew}
                    disabled={loading || checkingResume || checkingAuth}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-2">
                      <span>Start for Free</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <div className="flex items-center space-x-1 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>2 free generations</span>
                  </div>
                </motion.div>
              </motion.div>

              <div className="mb-16">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
              </div>
            </div>

          </div>
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
                {checkingResume ? `Loading Your ${terms.resume}` : `Processing Your ${terms.resume}`}
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
    
    </>
  );
}

