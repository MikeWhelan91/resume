import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { limitCoverLetter } from '../lib/renderUtils';
import ResumeTemplate from '../components/ResumeTemplate';
import SeoHead from '../components/SeoHead';
import { useLanguage } from '../contexts/LanguageContext';
import { useError } from '../contexts/ErrorContext';
import TrialSignupModal from '../components/ui/TrialSignupModal';
import {
  FileText,
  Download,
  ArrowLeft,
  Sparkles,
  Palette,
  Zap,
  FileDown,
  Lock,
  ChevronDown,
  Target,
  RefreshCw
} from 'lucide-react';

const ACCENTS = ['#6b7280','#10b39f','#2563eb','#7c3aed','#f97316','#ef4444'];

const TEMPLATES = [
  { id: 'professional', name: 'Professional' },
  { id: 'modern', name: 'Modern' },
  { id: 'creative', name: 'Creative' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'two-column', name: 'Two Column' },
  { id: 'executive', name: 'Executive' }
];

export default function ResultsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTerminology } = useLanguage();
  const { showError, showSuccess } = useError();
  const terms = getTerminology();
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [userData, setUserData] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userGoal, setUserGoal] = useState('both');
  const [userPlan, setUserPlan] = useState('free');
  const [entitlement, setEntitlement] = useState(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);
  const [usage, setUsage] = useState({ usage: {} });
  const [usageLoading, setUsageLoading] = useState(true);
  const [dayPassUsage, setDayPassUsage] = useState(null);
  const [trialUsage, setTrialUsage] = useState(null);
  const [trialUsageLoading, setTrialUsageLoading] = useState(true);
  const [resumeFormat, setResumeFormat] = useState('pdf');
  const [coverLetterFormat, setCoverLetterFormat] = useState('pdf');
  const [tone, setTone] = useState('professional');
  const [showTrialSignup, setShowTrialSignup] = useState(false);
  const [signupType, setSignupType] = useState('post_generation');
  const [atsAnalysis, setAtsAnalysis] = useState(null);

  // Credit system helpers for authenticated users
  const getCreditsRemaining = () => {
    if (session && userPlan === 'free' && entitlement) {
      return entitlement.freeWeeklyCreditsRemaining || 0;
    }
    return null; // Pro users have unlimited/different limits
  };

  // Trial system helpers for signed-out users
  const getTrialGenerationsRemaining = () => {
    if (!session && trialUsage) {
      return Math.max(0, trialUsage.generationsLimit - trialUsage.generationsUsed);
    }
    return 0;
  };

  const getTrialDownloadsRemaining = () => {
    if (!session && trialUsage) {
      return Math.max(0, trialUsage.downloadsLimit - trialUsage.downloadsUsed);
    }
    return 0;
  };

  const canDownload = () => {
    if (session) {
      // Authenticated users
      if (userPlan === 'free') {
        return (entitlement?.freeWeeklyCreditsRemaining || 0) > 0;
      }
      return true; // Pro users can download (subject to their own limits)
    } else {
      // Trial users
      return trialUsage ? trialUsage.canDownload : false;
    }
  };

  const canGenerate = () => {
    if (session) {
      // Authenticated users
      if (userPlan === 'free') {
        return (entitlement?.freeWeeklyCreditsRemaining || 0) > 0;
      } else if (userPlan === 'day_pass') {
        // Day pass users have generation limits
        return dayPassUsage ? (dayPassUsage.generationsUsed < dayPassUsage.generationsLimit) : false;
      }
      return true; // Pro users can generate (unlimited)
    } else {
      // Trial users - need at least 2 generations remaining (since each generation uses 2)
      return trialUsage ? (trialUsage.generationsRemaining >= 2) : false;
    }
  };

  const canUseDocx = () => {
    return userPlan !== 'free';
  };

  const canDownloadResumeFormat = () => {
    if (resumeFormat === 'docx' && !canUseDocx()) {
      return false;
    }
    return canDownload();
  };

  const canDownloadCoverLetterFormat = () => {
    if (coverLetterFormat === 'docx' && !canUseDocx()) {
      return false;
    }
    return canDownload();
  };

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  const showUpgradeAlert = (message) => {
    if (confirm(`${message}\n\nWould you like to view our pricing plans?`)) {
      router.push('/pricing');
    }
  };

  const showSignUpPrompt = (message, type = 'no_credits') => {
    setSignupType(type);
    setShowTrialSignup(true);
  };

  // Mobile-friendly download function
  const triggerDownload = async (endpoint, filename, payload) => {
    // Fetch and validate the response
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const blob = await response.blob();
    
    // If we get this far, the server-side generation was successful
    // Now handle the client-side download with mobile considerations
    const url = window.URL.createObjectURL(blob);
    
    // Detect if we're likely on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile devices, use a more reliable approach
      try {
        // Try direct navigation for mobile
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        
        // Mobile browsers often work better with direct click without setTimeout
        link.click();
        
        // Cleanup after a delay to ensure download started
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 1000);
        
      } catch (mobileError) {
        // Final fallback for mobile: open in new tab
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } else {
      // Desktop approach
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    
    // Function completes successfully if we reach here
    return true;
  };

  const downloadCV = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    if (!canDownload()) {
      if (session) {
        if (userPlan === 'free') {
          const remaining = getCreditsRemaining();
          showUpgradeAlert(`You've used all your weekly credits. You have ${remaining} credits remaining. Your credits reset every Monday at midnight Dublin time. Upgrade to Pro for unlimited downloads!`);
        } else if (userPlan === 'day_pass') {
          // Day pass users should have unlimited downloads, so this shouldn't happen
          showUpgradeAlert('Unable to download at this time. Please try again or contact support if the issue persists.');
        }
        // Pro users should never hit this condition, but if they do, show generic message
        else {
          showUpgradeAlert('Unable to download at this time. Please try again or contact support if the issue persists.');
        }
      } else {
        const remaining = getTrialDownloadsRemaining();
        showSignUpPrompt(`You've used all your trial downloads. You have ${remaining} downloads remaining. Sign up for unlimited downloads!`);
      }
      return;
    }

    try {
      // Start the download process
      await triggerDownload('/api/download-cv', 'resume.pdf', {
        template,
        accent,
        data: userData,
      });
      
      // Update usage tracking after download initiation
      // Note: We update usage even if download UI quirks occur on mobile
      try {
        if (session) {
          const entitlementResponse = await fetch('/api/entitlements');
          if (entitlementResponse.ok) {
            const entitlementData = await entitlementResponse.json();
            setEntitlement(entitlementData);
            setUserPlan(entitlementData.plan);
          }
        } else {
          // Refresh trial usage for anonymous users
          const trialResponse = await fetch('/api/trial-usage');
          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            setTrialUsage(trialData);
          }
        }
      } catch (usageError) {
        // Don't show error for usage tracking failures
        console.warn('Usage tracking update failed:', usageError);
      }
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Only show error alerts for actual server/network failures
      if (error.message && error.message.includes('429')) {
        showUpgradeAlert('You have reached your limit. Upgrade to Pro for unlimited downloads.');
      } else if (error.message && error.message.includes('Network response was not ok')) {
        showError('Failed to generate PDF file. Please try again.');
      } else if (error.name === 'TypeError' || error.message.includes('fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        // For other errors (likely mobile browser quirks), just log them
        console.warn('Download may have succeeded despite error:', error);
      }
    }
  };

  const downloadCoverLetter = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    try {
      await triggerDownload('/api/download-cover-letter', 'cover-letter.pdf', {
        accent,
        data: userData,
      });
    } catch (error) {
      console.error('Download error:', error);
      // Silently handle download errors
    }
  };

  const downloadResumeDocx = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    try {
      await triggerDownload('/api/export-resume-docx', `${(userData.resumeData?.name || userData.name || 'resume').replace(/\s+/g, '_')}_resume.docx`, {
        userData,
        template,
        accent
      });
    } catch (error) {
      console.error('Download error:', error);
      
      // Only show error alerts for actual server/network failures (not mobile browser quirks)  
      if (error.message && error.message.includes('Network response was not ok')) {
        showError('Failed to generate resume file. Please try again.');
      } else if (error.name === 'TypeError' || error.message.includes('fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        console.warn('Download may have succeeded despite error:', error);
      }
    }
  };

  const downloadCoverLetterDocx = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    try {
      await triggerDownload('/api/export-cover-letter-docx', `${(userData.resumeData?.name || userData.name || 'cover_letter').replace(/\s+/g, '_')}_cover_letter.docx`, {
        userData,
        accent
      });
    } catch (error) {
      console.error('Download error:', error);
      
      // Only show error alerts for actual server/network failures (not mobile browser quirks)
      if (error.message && error.message.includes('Network response was not ok')) {
        showError('Failed to generate cover letter file. Please try again.');
      } else if (error.name === 'TypeError' || error.message.includes('fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        console.warn('Download may have succeeded despite error:', error);
      }
    }
  };

  // Consolidated download functions
  const downloadResume = async () => {
    if (resumeFormat === 'pdf') {
      await downloadCV();
    } else {
      await downloadResumeDocx();
    }
  };

  const downloadCoverLetterConsolidated = async () => {
    if (coverLetterFormat === 'pdf') {
      await downloadCoverLetter();
    } else {
      await downloadCoverLetterDocx();
    }
  };

  const optimizeForATS = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    if (userPlan === 'free') {
      showUpgradeAlert('ATS optimization is a Pro feature. Upgrade to access this functionality.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ats-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: userData,
          jobDescription: jobDescription
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const optimizedData = await response.json();
      setUserData(optimizedData);
      
      // Save updated data to localStorage
      localStorage.setItem('resumeResult', JSON.stringify(optimizedData));
      
      // Refresh day pass usage data
      if (userPlan === 'day_pass') {
        try {
          const dayPassResponse = await fetch('/api/day-pass-usage');
          if (dayPassResponse.ok) {
            const dayPassData = await dayPassResponse.json();
            setDayPassUsage(dayPassData);
          }
        } catch (error) {
          console.error('Error refreshing day pass usage:', error);
        }
      }
      
      showSuccess(`${terms.Resume} optimized for ATS systems! Your ${terms.resume} has been enhanced with ATS-friendly formatting and keywords.`);
      
    } catch (error) {
      console.error('ATS optimization error:', error);
      showError(`Failed to optimize ${terms.resume}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTailoredContent = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    if (!jobDescription.trim()) {
      showError('Please enter a job description.');
      return;
    }

    if (!canGenerate()) {
      if (session) {
        if (userPlan === 'free') {
          const remaining = getCreditsRemaining();
          showUpgradeAlert(`You've used all your weekly credits. You have ${remaining} credits remaining. Your credits reset every Monday at midnight Dublin time. Upgrade to Pro for unlimited generations!`);
        } else if (userPlan === 'day_pass') {
          showUpgradeAlert(`You've reached your day pass generation limit. Upgrade to Pro for unlimited generations or purchase another day pass!`);
        }
        // Pro users should never hit this condition, but if they do, show generic message
        else {
          showUpgradeAlert('Unable to generate at this time. Please try again or contact support if the issue persists.');
        }
      } else {
        const remaining = getTrialGenerationsRemaining();
        showSignUpPrompt(`You've used all your trial generations. You have ${remaining} generations remaining. Sign up for unlimited generations!`);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/tailor-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData,
          jobDescription: jobDescription.trim(),
          tone,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const tailoredData = await response.json();
      setUserData(tailoredData);
      
      // Save updated data to localStorage
      localStorage.setItem('resumeResult', JSON.stringify(tailoredData));
      
      // Refresh usage data after successful generation
      if (session) {
        const entitlementResponse = await fetch('/api/entitlements');
        if (entitlementResponse.ok) {
          const entitlementData = await entitlementResponse.json();
          setEntitlement(entitlementData);
          setUserPlan(entitlementData.plan);
        }
      } else {
        // Refresh trial usage for anonymous users
        const trialResponse = await fetch('/api/trial-usage');
        if (trialResponse.ok) {
          const trialData = await trialResponse.json();
          setTrialUsage(trialData);
          
          // Show post-generation signup modal for trial users who still have credits
          const remainingCredits = Math.max(0, trialData.generationsLimit - trialData.generationsUsed);
          if (remainingCredits > 0) {
            setTimeout(() => {
              setSignupType('post_generation');
              setShowTrialSignup(true);
            }, 1500); // Small delay to let user see the results first
          }
        }
      }
    } catch (error) {
      console.error('Generate error:', error);
      // Silently handle errors - user can try again if needed
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Load user data from localStorage
    try {
      const data = localStorage.getItem('resumeResult');
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        // Check if userGoal was saved with the data
        if (parsed.userGoal) {
          setUserGoal(parsed.userGoal);
        }
        // Load job description from localStorage if available
        if (parsed.jobDescription) {
          setJobDescription(parsed.jobDescription);
        }
        // Load ATS analysis if available from generation
        if (parsed.atsAnalysis) {
          setAtsAnalysis(parsed.atsAnalysis);
        }
        console.log('Loaded user data:', parsed);
      }
      
      // Also check for standalone job description in localStorage
      const jobDesc = localStorage.getItem('jobDescription');
      if (jobDesc && !jobDescription) {
        setJobDescription(jobDesc);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }, []);

  // Fetch user entitlement and usage (authenticated) or trial usage (anonymous)
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        // Authenticated user - fetch entitlements and usage
        try {
          // Fetch entitlement, usage, and day pass usage in parallel
          const [entitlementResponse, usageResponse, dayPassResponse] = await Promise.all([
            fetch('/api/entitlements'),
            fetch('/api/usage'),
            fetch('/api/day-pass-usage')
          ]);
          
          if (entitlementResponse.ok) {
            const entitlementData = await entitlementResponse.json();
            setEntitlement(entitlementData);
            setUserPlan(entitlementData.plan);
          }
          
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsage(usageData);
          }
          
          if (dayPassResponse.ok) {
            const dayPassData = await dayPassResponse.json();
            setDayPassUsage(dayPassData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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
      }
      setEntitlementLoading(false);
      setUsageLoading(false);
      setTrialUsageLoading(false);
    };

    if (status !== 'loading') {
      fetchUserData();
    }
  }, [session, status]);



    // Resume Preview
    const renderCVPreview = () => (
      <div className="card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">{terms.Resume} Preview</h3>
          <div className="flex items-center space-x-2 text-sm text-muted">
            <FileText className="w-4 h-4" />
            <span>PDF Ready</span>
          </div>
        </div>
        <div className="bg-surface text-text shadow-lg rounded-lg overflow-hidden border border-border" style={{aspectRatio: '210/297', height: '400px', overflow: 'auto'}}>
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%' }}>
            <ResumeTemplate userData={userData} accent={accent} template={template} userPlan={userPlan} />
          </div>
        </div>

        {/* Download buttons inside CV preview - only show when both documents */}
        {userGoal === 'both' && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-semibold text-text">Download Resume</h4>
            <div className="space-y-2">
              <select
                value={resumeFormat}
                onChange={(e) => setResumeFormat(e.target.value)}
                className="w-full bg-surface text-text border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX (Word)</option>
              </select>
              <button
                className={`w-full btn btn-primary ${!canDownload() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => resumeFormat === 'pdf' ? downloadCV() : downloadResumeDocx()}
                disabled={!canDownload()}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Resume ({resumeFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </div>
    );

  // Cover Letter Preview
  const renderCoverLetterPreview = () => {
    const scale = 1; // Preview uses 1x scale, PDF will use 1.75x
    
    return (
      <div className="card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">Cover Letter Preview</h3>
          <div className="flex items-center space-x-2 text-sm text-muted">
            <FileText className="w-4 h-4" />
            <span>PDF Ready</span>
          </div>
        </div>
        <div className="bg-surface text-text shadow-lg rounded-lg overflow-hidden border border-border" style={{aspectRatio: '210/297', height: '400px', overflow: 'auto'}}>
          <div style={{ padding: `${25 * scale}px`, fontSize: `${7 * scale}px`, fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
            {userData ? (
              <>
                <div style={{ marginBottom: `${12 * scale}px`, textAlign: 'right' }}>
                  <p style={{ fontSize: `${8 * scale}px`, color: '#666' }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div style={{ marginBottom: `${12 * scale}px` }}>
                  {userData.coverLetter ? (
                    limitCoverLetter(userData.coverLetter).map((paragraph, i) => (
                      <p key={i} style={{ fontSize: `${8 * scale}px`, marginBottom: `${6 * scale}px`, textAlign: 'justify' }}>
                        {paragraph.trim()}
                      </p>
                    ))
                  ) : (
                    <p style={{ fontSize: `${8 * scale}px`, textAlign: 'justify' }}>
                      Dear Hiring Manager,<br/><br/>
                      I am writing to express my interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.<br/><br/>
                      Thank you for considering my application. I look forward to hearing from you.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: `${15 * scale}px` }}>
                  <p style={{ fontSize: `${8 * scale}px` }}>Sincerely,</p>
                  <p style={{ fontSize: `${8 * scale}px`, marginTop: `${10 * scale}px`, fontWeight: 'bold' }}>
                    {userData.resumeData?.name || userData.name || 'Your Name'}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', marginTop: `${80 * scale}px`, fontSize: `${9 * scale}px` }}>
                {`No data available. Please generate a ${terms.resume} first.`}
              </div>
            )}
          </div>
        </div>

        {/* Download buttons inside Cover Letter preview - only show when both documents */}
        {userGoal === 'both' && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-semibold text-text">Download Cover Letter</h4>
            <div className="space-y-2">
              <select
                value={coverLetterFormat}
                onChange={(e) => setCoverLetterFormat(e.target.value)}
                className="w-full bg-surface text-text border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX (Word)</option>
              </select>
              <button
                className={`w-full btn btn-primary ${!canDownload() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => coverLetterFormat === 'pdf' ? downloadCoverLetter() : downloadCoverLetterDocx()}
                disabled={!canDownload()}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Cover Letter ({coverLetterFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Dynamic content based on user goal
  const getHeaderContent = () => {
    switch(userGoal) {
      case 'cv':
        return {
          title: `Your Tailored ${terms.Resume}`,
          description: `Review and download your ATS-optimized ${terms.resume}, customized for the job description.`
        };
      case 'cover-letter':
        return {
          title: 'Your Tailored Cover Letter',
          description: 'Review and download your personalized cover letter, crafted for the specific role.'
        };
      case 'both':
      default:
        return {
          title: 'Your Tailored Documents',
          description: `Review and download your complete application package - ${terms.resume} and cover letter optimized for the job.`
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <>
      <SeoHead
        title={`${headerContent.title} – TailoredCV.app`}
        description={headerContent.description}
        canonical="https://tailoredcv.app/results"
        robots="noindex,nofollow"
      />
      
      {/* Simple Header */}
      <div className="bg-surface text-text border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">Your Tailored Results</h1>
              <p className="text-muted mt-1">Download, customize, and apply with confidence.</p>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar controls */}
          <aside className="lg:col-span-1">
            <div className="card p-6 space-y-6 sticky top-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-text">Customization</h2>
              </div>
          
              {(userGoal === 'cv' || userGoal === 'both') && (
                <div className="space-y-4">
                  {/* Template Style and Theme Color on same line */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Template Style */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted">Template Style</label>
                      <div className="relative">
                        <select
                          value={template}
                          onChange={(e) => setTemplate(e.target.value)}
                          className="appearance-none w-full bg-surface text-text border border-border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
                        >
                          {TEMPLATES.map(t => {
                            const isProTemplate = t.id !== 'professional';
                            const isLocked = isProTemplate && userPlan === 'free';

                            return (
                              <option
                                key={t.id}
                                value={t.id}
                                disabled={isLocked}
                              >
                                {t.name}{isLocked ? ' (Pro Only)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Theme Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted flex items-center gap-2">
                        Theme Color
                        {userPlan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={accent}
                            onChange={(e) => userPlan !== 'free' && setAccent(e.target.value)}
                            disabled={userPlan === 'free'}
                            className={`w-10 h-8 rounded border border-border cursor-pointer ${
                              userPlan === 'free' ? 'cursor-not-allowed opacity-50' : 'hover:border-accent'
                            }`}
                            style={{ backgroundColor: accent }}
                          />
                          {userPlan === 'free' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-text font-medium">{accent}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pro plan messages */}
                  {userPlan === 'free' && (
                    <>
                      <div className="text-xs text-muted bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                        <strong>Free Plan:</strong> Only Professional template available. <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleUpgradeClick}>Upgrade to Pro</span> for all templates.
                      </div>
                      <div className="text-xs text-muted bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                        <strong>Weekly Credits:</strong> {getCreditsRemaining() || 0} remaining. Credits reset every Monday at midnight Dublin time.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Hide tone dropdown for CV-only results */}
              {userGoal !== 'cv' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted">Cover Letter Tone</label>
                  <select 
                    className="form-select w-full"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise</option>
                  </select>
                  <p className="text-xs text-muted">
                    Select your preferred tone. Click "Generate" to apply changes (consumes 1 credit).
                  </p>
                </div>
              )}

              {/* New Job CTA Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1 mb-2">
                    <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      New Opportunity?
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text mb-1">
                    {userGoal === 'cv' ? `Ready to tailor another ${terms.Resume}?` :
                     userGoal === 'cover-letter' ? 'Ready to tailor another Cover Letter?' :
                     `Ready to tailor another ${terms.Resume} and Cover Letter?`}
                  </h3>
                  <p className="text-xs text-muted">
                    Add another job description below!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted" htmlFor="jobDescription">Job Description</label>
                  {jobDescription.trim() && (
                    <button
                      onClick={() => {
                        setJobDescription('');
                        localStorage.removeItem('jobDescription');
                      }}
                      className="text-xs text-muted hover:text-text underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea 
                  id="jobDescription"
                  className="form-textarea h-32 resize-none"
                  value={jobDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJobDescription(value);
                    // Save to localStorage for persistence
                    if (value.trim()) {
                      localStorage.setItem('jobDescription', value);
                    } else {
                      localStorage.removeItem('jobDescription');
                    }
                  }}
                  placeholder="Paste the job description here to tailor your documents..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`btn flex items-center gap-2 justify-center ${
                      (isGenerating || !jobDescription.trim() || !canGenerate()) 
                        ? 'bg-border text-muted cursor-not-allowed border border-border' 
                        : 'btn-primary'
                    }`}
                    onClick={generateTailoredContent}
                    disabled={isGenerating || !jobDescription.trim() || !canGenerate()}
                  >
                    {isGenerating ? (
                      <div className="loading-spinner w-4 h-4"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                  <button 
                    className="btn btn-secondary flex items-center justify-center" 
                    onClick={() => router.push('/?step=1')}
                  >
                    Back to Wizard
                  </button>
                </div>
              </div>

                {session && userPlan === 'free' && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">
                        {getCreditsRemaining() || 0} credits remaining
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      Credits reset every Monday at midnight Dublin time
                    </p>
                  </div>
                )}

                {userPlan === 'day_pass' && dayPassUsage && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-700">
                        {dayPassUsage.generationsUsed}/{dayPassUsage.generationsLimit} generations used today
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      Day pass expires in {Math.max(0, Math.ceil((new Date(dayPassUsage.expiresAt) - new Date()) / (1000 * 60 * 60)))} hours
                    </p>
                  </div>
                )}

                {!session && trialUsage && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">
                        🎯 FREE TRIAL - {getTrialDownloadsRemaining()} downloads remaining
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      Sign up for unlimited access!
                    </p>
                    <button 
                      onClick={() => router.push('/auth/signup')}
                      className="text-xs text-green-600 hover:text-green-700 font-medium underline mt-1"
                    >
                      Create Free Account
                    </button>
                  </div>
                )}
            </div>
          </aside>

          {/* Right side previews */}
          <section className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-text">Document Previews</h2>
            </div>
            
            <div className={`grid gap-6 ${userGoal === 'both' ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl mx-auto'}`}>
              {(userGoal === 'cv' || userGoal === 'both') && renderCVPreview()}
              {(userGoal === 'cover-letter' || userGoal === 'both') && renderCoverLetterPreview()}
            </div>

            {/* Download Section for Single Document Views */}
            {userGoal !== 'both' && (
              <div className="mt-8">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-surface rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                      <Download className="w-5 h-5 mr-2 text-indigo-600" />
                      Download Your {userGoal === 'cv' ? terms.Resume : 'Cover Letter'}
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">File Format</label>
                        <select
                          value={userGoal === 'cv' ? resumeFormat : coverLetterFormat}
                          onChange={(e) => userGoal === 'cv' ? setResumeFormat(e.target.value) : setCoverLetterFormat(e.target.value)}
                          className="w-full bg-surface text-text border border-border rounded-lg px-4 py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
                        >
                          <option value="pdf">PDF</option>
                          <option value="docx">DOCX (Word)</option>
                        </select>
                      </div>
                      <button
                        className={`w-full btn btn-primary btn-lg ${!canDownload() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (userGoal === 'cv') {
                            resumeFormat === 'pdf' ? downloadCV() : downloadResumeDocx();
                          } else {
                            coverLetterFormat === 'pdf' ? downloadCoverLetter() : downloadCoverLetterDocx();
                          }
                        }}
                        disabled={!canDownload()}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download {userGoal === 'cv' ? terms.Resume : 'Cover Letter'} ({(userGoal === 'cv' ? resumeFormat : coverLetterFormat).toUpperCase()})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ATS Score Display Under Everything */}
            {atsAnalysis && (userGoal === 'cv' || userGoal === 'both') && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text">ATS Compatibility Analysis</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`text-3xl font-bold ${
                        atsAnalysis.overallScore >= 80 ? 'text-green-600' :
                        atsAnalysis.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {atsAnalysis.overallScore}%
                      </div>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        atsAnalysis.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                        atsAnalysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {atsAnalysis.overallScore >= 80 ? 'Excellent' :
                         atsAnalysis.overallScore >= 60 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>

                  {atsAnalysis.categories && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{atsAnalysis.categories.keywordMatch?.score || 0}%</div>
                        <div className="text-sm text-muted">Keywords</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{atsAnalysis.categories.contentDepth?.score || 0}%</div>
                        <div className="text-sm text-muted">Content Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{atsAnalysis.categories.relevance?.score || 0}%</div>
                        <div className="text-sm text-muted">Relevance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{atsAnalysis.categories.completeness?.score || 0}%</div>
                        <div className="text-sm text-muted">Completeness</div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Content Gaps */}
                    {atsAnalysis.contentGaps && atsAnalysis.contentGaps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3">🎯 Content Gaps to Address</h4>
                          <ul className="space-y-2">
                          {atsAnalysis.contentGaps.map((gap, index) => (
                            <li key={index} className="text-sm text-orange-600 dark:text-orange-400">
                              • {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {atsAnalysis.missingKeywords && atsAnalysis.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">🔍 Missing Keywords from Job</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsAnalysis.missingKeywords.map((keyword, index) => (
                            <span key={index} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {atsAnalysis.recommendations && atsAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">💡 Actionable Improvements</h4>
                        <ul className="space-y-2">
                          {atsAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-green-600 dark:text-green-400">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-center text-sm text-blue-700 dark:text-blue-300">
                    ✨ This analysis was automatically generated based on your job description
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Trial Signup Modal */}
      <TrialSignupModal 
        isOpen={showTrialSignup}
        onClose={() => setShowTrialSignup(false)}
        type={signupType}
        remainingCredits={getTrialGenerationsRemaining()}
      />
    </>
  );
}
