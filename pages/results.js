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
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [contentUpdated, setContentUpdated] = useState(false);
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
  const [jobMatchAnalysis, setJobMatchAnalysis] = useState(null);
  const [downloadCooldowns, setDownloadCooldowns] = useState({
    cv: 0,
    cvDocx: 0,
    coverLetter: 0,
    coverLetterDocx: 0
  });
  const [downloadingStates, setDownloadingStates] = useState({
    cv: false,
    cvDocx: false,
    coverLetter: false,
    coverLetterDocx: false
  });

  // Download rate limiting helpers
  const DOWNLOAD_COOLDOWN_MS = 2000; // 2 seconds between downloads

  const setDownloadCooldown = (downloadType) => {
    const now = Date.now();
    setDownloadCooldowns(prev => ({
      ...prev,
      [downloadType]: now + DOWNLOAD_COOLDOWN_MS
    }));
  };

  const isDownloadOnCooldown = (downloadType) => {
    return Date.now() < downloadCooldowns[downloadType];
  };

  const getDownloadCooldownRemaining = (downloadType) => {
    const remaining = downloadCooldowns[downloadType] - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  const setDownloadingState = (downloadType, isDownloading) => {
    setDownloadingStates(prev => ({
      ...prev,
      [downloadType]: isDownloading
    }));
  };

  // Enhanced download availability checks
  const canDownloadResume = () => {
    const formatType = resumeFormat === 'pdf' ? 'cv' : 'cvDocx';
    return canDownload() && !downloadingStates[formatType] && !isDownloadOnCooldown(formatType);
  };

  const canDownloadCoverLetter = () => {
    const formatType = coverLetterFormat === 'pdf' ? 'coverLetter' : 'coverLetterDocx';
    return canDownload() && !downloadingStates[formatType] && !isDownloadOnCooldown(formatType);
  };

  const getDownloadButtonText = (baseText, formatType) => {
    if (downloadingStates[formatType]) {
      return `Downloading...`;
    }
    if (isDownloadOnCooldown(formatType)) {
      const remaining = getDownloadCooldownRemaining(formatType);
      return `Wait ${remaining}s`;
    }
    return baseText;
  };

  // Credit system helpers for authenticated users
  const getCreditsRemaining = () => {
    if (session && entitlement) {
      if (String(userPlan || '').startsWith('pro')) return null;
      const free = entitlement.freeCreditsThisMonth ?? entitlement.freeWeeklyCreditsRemaining ?? 0;
      const purchased = entitlement.creditBalance ?? 0;
      return Math.max(0, free + purchased);
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
      return true; // Authenticated users: downloads not gated by credits
    }
    // Trial users
    return trialUsage ? trialUsage.canDownload : false;
  };

  const canGenerate = () => {
    if (session) {
      if (String(userPlan || '').startsWith('pro')) return true;
      return (getCreditsRemaining() || 0) > 0;
    }
    // Trial users - need at least 2 generations remaining (since each generation uses 2)
    return trialUsage ? (trialUsage.generationsRemaining >= 2) : false;
  };

  const canUseDocx = () => {
    return String(userPlan || '').startsWith('pro');
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

    // Check for rate limiting cooldown
    if (isDownloadOnCooldown('cv')) {
      const remaining = getDownloadCooldownRemaining('cv');
      showError(`Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before downloading again.`);
      return;
    }

    // Check if already downloading
    if (downloadingStates.cv) {
      showError('Download already in progress. Please wait...');
      return;
    }

    if (!canDownload()) {
      if (session) {
        if (userPlan === 'standard') {
          const remaining = getCreditsRemaining();
          showUpgradeAlert(`You've used all your available credits. You have ${remaining} total credits remaining. Free credits reset monthly. Upgrade to Pro for unlimited downloads!`);
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
      // Set downloading state and cooldown
      setDownloadingState('cv', true);
      setDownloadCooldown('cv');

      // Start the download process
      await triggerDownload('/api/download-cv', 'resume.pdf', {
        template: userGoal === 'ats' ? 'ats' : template,
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
            setUserPlan(entitlementData.plan === 'free' ? 'standard' : entitlementData.plan);
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
    } finally {
      // Reset downloading state
      setDownloadingState('cv', false);
    }
  };

  const downloadCoverLetter = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    // Check for rate limiting cooldown
    if (isDownloadOnCooldown('coverLetter')) {
      const remaining = getDownloadCooldownRemaining('coverLetter');
      showError(`Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before downloading again.`);
      return;
    }

    // Check if already downloading
    if (downloadingStates.coverLetter) {
      showError('Download already in progress. Please wait...');
      return;
    }

    try {
      // Set downloading state and cooldown
      setDownloadingState('coverLetter', true);
      setDownloadCooldown('coverLetter');

      await triggerDownload('/api/download-cover-letter', 'cover-letter.pdf', {
        accent,
        data: userData,
      });
    } catch (error) {
      console.error('Download error:', error);
      // Silently handle download errors
    } finally {
      // Reset downloading state
      setDownloadingState('coverLetter', false);
    }
  };

  const downloadResumeDocx = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    // Check for rate limiting cooldown
    if (isDownloadOnCooldown('cvDocx')) {
      const remaining = getDownloadCooldownRemaining('cvDocx');
      showError(`Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before downloading again.`);
      return;
    }

    // Check if already downloading
    if (downloadingStates.cvDocx) {
      showError('Download already in progress. Please wait...');
      return;
    }

    try {
      // Set downloading state and cooldown
      setDownloadingState('cvDocx', true);
      setDownloadCooldown('cvDocx');

      await triggerDownload('/api/export-resume-docx', `${(userData.resumeData?.name || userData.name || 'resume').replace(/\s+/g, '_')}_resume.docx`, {
        userData,
        template: userGoal === 'ats' ? 'ats' : template,
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
    } finally {
      // Reset downloading state
      setDownloadingState('cvDocx', false);
    }
  };

  const downloadCoverLetterDocx = async () => {
    if (!userData) {
      showError(`No data available. Please generate a ${terms.resume} first.`);
      return;
    }

    // Check for rate limiting cooldown
    if (isDownloadOnCooldown('coverLetterDocx')) {
      const remaining = getDownloadCooldownRemaining('coverLetterDocx');
      showError(`Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before downloading again.`);
      return;
    }

    // Check if already downloading
    if (downloadingStates.coverLetterDocx) {
      showError('Download already in progress. Please wait...');
      return;
    }

    try {
      // Set downloading state and cooldown
      setDownloadingState('coverLetterDocx', true);
      setDownloadCooldown('coverLetterDocx');

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
    } finally {
      // Reset downloading state
      setDownloadingState('coverLetterDocx', false);
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

    if (userPlan === 'standard') {
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
      
      // No day pass: nothing to refresh here
      
      showSuccess(`${terms.Resume} optimized for job matching! Your ${terms.resume} has been enhanced with smart keywords and tailored content.`);
      
    } catch (error) {
      console.error('Job matching optimization error:', error);
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
        if (userPlan === 'standard') {
          const remaining = getCreditsRemaining();
          showUpgradeAlert(`You've used all your monthly credits. You have ${remaining} credits remaining. Free credits reset monthly. Upgrade to Pro for unlimited credits!`);
        } else {
          showError('Unable to generate at this time. Please try again.');
        }
      } else {
        setShowAccountPrompt(true);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/tailor-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, jobDescription, tone })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const updated = await response.json();
      setUserData(updated);
      setContentUpdated(true);
    } catch (error) {
      console.error('Generation error:', error);
      showError('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get data from localStorage
        const savedData = localStorage.getItem('resumeResult');
        const savedJobDescription = localStorage.getItem('jobDescription');
        const savedUserGoal = localStorage.getItem('userGoal');

        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // For ATS analysis mode, the actual resume data is nested under resumeData
          if (parsedData.analysisOnly && parsedData.resumeData) {
            console.log('🔍 Results Debug - Full parsedData:', JSON.stringify(parsedData, null, 2));
            console.log('🔍 Results Debug - Extracted resumeData:', JSON.stringify(parsedData.resumeData, null, 2));
            setUserData(parsedData.resumeData);
          } else {
            setUserData(parsedData);
          }
          setContentUpdated(false);

          // Process ATS analysis if it exists
          if (parsedData.atsAnalysis) {
            setAtsAnalysis(parsedData.atsAnalysis);
          }

          // Process job match analysis if it exists
          if (parsedData.jobMatchAnalysis) {
            setJobMatchAnalysis(parsedData.jobMatchAnalysis);
          }
        } else {
          // Redirect if no data
          router.push('/');
          return;
        }

        if (savedJobDescription) {
          setJobDescription(savedJobDescription);
        }

        if (savedUserGoal) {
          setUserGoal(savedUserGoal);
        }

        // Fetch user entitlements and usage data
        if (session) {
          try {
            const [entitlementResponse, usageResponse] = await Promise.all([
              fetch('/api/entitlements'),
              fetch('/api/usage')
            ]);

            if (entitlementResponse.ok) {
              const entitlementData = await entitlementResponse.json();
              setEntitlement(entitlementData);
              setUserPlan(entitlementData.plan === 'free' ? 'standard' : entitlementData.plan);
            }

            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              setUsage(usageData);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          // Fetch trial usage for anonymous users
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
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/');
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
            <ResumeTemplate userData={userData} accent={accent} template={userGoal === 'ats' ? 'ats' : template} userPlan={userPlan} />
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
      case 'ats':
        return {
          title: 'CV Health Check Results',
          description: 'See how ATS systems parse your CV and get specific recommendations to improve compatibility.'
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
                    {isGenerating ? 'Generating...' :
                      userPlan === 'standard' ?
                        (userGoal === 'both' ? 'Generate (2 credits)' : 'Generate (1 credit)') :
                        'Generate'
                    }
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
                        {dayPassUsage.generationsUsed}/{dayPassUsage.generationsLimit} credits used today
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
            
            <div className={`grid gap-6 ${userGoal === 'both' ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl mx-auto'} justify-items-center`}>
              {(userGoal === 'cv' || userGoal === 'both') && renderCVPreview()}
              {(userGoal === 'cover-letter' || userGoal === 'both') && renderCoverLetterPreview()}
              {userGoal === 'ats' && renderCVPreview()}
            </div>

            {/* Download Section for Single Document Views */}
            {userGoal !== 'both' && (
              <div className="mt-8">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-surface rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                      <Download className="w-5 h-5 mr-2 text-indigo-600" />
                      Download Your {userGoal === 'cv' ? terms.Resume : userGoal === 'ats' ? `ATS-Optimized ${terms.Resume}` : 'Cover Letter'}
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">File Format</label>
                        <select
                          value={userGoal === 'cv' || userGoal === 'ats' ? resumeFormat : coverLetterFormat}
                          onChange={(e) => userGoal === 'cv' || userGoal === 'ats' ? setResumeFormat(e.target.value) : setCoverLetterFormat(e.target.value)}
                          className="w-full bg-surface text-text border border-border rounded-lg px-4 py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent"
                        >
                          <option value="pdf">PDF</option>
                          <option value="docx">DOCX (Word)</option>
                        </select>
                      </div>
                      <button
                        className={`w-full btn btn-primary btn-lg ${!(userGoal === 'cv' ? canDownloadResume() : canDownloadCoverLetter()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (userGoal === 'cv') {
                            resumeFormat === 'pdf' ? downloadCV() : downloadResumeDocx();
                          } else {
                            coverLetterFormat === 'pdf' ? downloadCoverLetter() : downloadCoverLetterDocx();
                          }
                        }}
                        disabled={!(userGoal === 'cv' ? canDownloadResume() : canDownloadCoverLetter())}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {(() => {
                          const formatType = userGoal === 'cv'
                            ? (resumeFormat === 'pdf' ? 'cv' : 'cvDocx')
                            : (coverLetterFormat === 'pdf' ? 'coverLetter' : 'coverLetterDocx');
                          const baseText = `Download ${userGoal === 'cv' ? terms.Resume : 'Cover Letter'} (${(userGoal === 'cv' ? resumeFormat : coverLetterFormat).toUpperCase()})`;
                          return getDownloadButtonText(baseText, formatType);
                        })()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Match Analysis Display for CV/Both modes */}
            {jobMatchAnalysis && (userGoal === 'cv' || userGoal === 'both') && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text">Job Match Analysis</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`text-3xl font-bold ${
                        jobMatchAnalysis.overallScore >= 80 ? 'text-green-600' :
                        jobMatchAnalysis.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {jobMatchAnalysis.overallScore}%
                      </div>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        jobMatchAnalysis.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                        jobMatchAnalysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {jobMatchAnalysis.overallScore >= 80 ? 'Excellent' :
                         jobMatchAnalysis.overallScore >= 60 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>

                  {jobMatchAnalysis.categories && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{jobMatchAnalysis.categories.keywordMatch?.score || 0}%</div>
                        <div className="text-sm text-muted">Keywords</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{jobMatchAnalysis.categories.contentDepth?.score || 0}%</div>
                        <div className="text-sm text-muted">Content Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{jobMatchAnalysis.categories.relevance?.score || 0}%</div>
                        <div className="text-sm text-muted">Relevance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{jobMatchAnalysis.categories.completeness?.score || 0}%</div>
                        <div className="text-sm text-muted">Completeness</div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Content Gaps */}
                    {jobMatchAnalysis.contentGaps && jobMatchAnalysis.contentGaps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3">🎯 Content Gaps to Address</h4>
                          <ul className="space-y-2">
                          {jobMatchAnalysis.contentGaps.map((gap, index) => (
                            <li key={index} className="text-sm text-orange-600 dark:text-orange-400">
                              • {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {jobMatchAnalysis.missingKeywords && jobMatchAnalysis.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">🔍 Missing Keywords from Job</h4>
                        <div className="flex flex-wrap gap-2">
                          {jobMatchAnalysis.missingKeywords.map((keyword, index) => (
                            <span key={index} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {jobMatchAnalysis.recommendations && jobMatchAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">💡 Actionable Improvements</h4>
                        <ul className="space-y-2">
                          {jobMatchAnalysis.recommendations.map((rec, index) => (
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

            {/* CV Parsing Results for ATS mode */}
            {userGoal === 'ats' && userData && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text">CV Parsing Results</h3>
                    <div className="text-sm text-blue-600 dark:text-blue-400">What ATS systems extracted from your CV</div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Name:</span>
                          <span className={userData.name ? 'text-green-600' : 'text-red-600'}>
                            {userData.name ? `✅ ${userData.name}` : '❌ Not detected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className={userData.email ? 'text-green-600' : 'text-red-600'}>
                            {userData.email ? `✅ ${userData.email}` : '❌ Not detected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className={userData.phone ? 'text-green-600' : 'text-red-600'}>
                            {userData.phone ? `✅ ${userData.phone}` : '❌ Not detected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className={userData.location ? 'text-green-600' : 'text-yellow-600'}>
                            {userData.location ? `✅ ${userData.location}` : '⚠️ Optional'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sections Detected */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Sections Detected</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Professional Summary:</span>
                          <span className={userData.summary ? 'text-green-600' : 'text-yellow-600'}>
                            {userData.summary ? '✅ Detected' : '⚠️ Missing'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Work Experience:</span>
                          <span className={userData.experience?.length > 0 ? 'text-green-600' : 'text-red-600'}>
                            {userData.experience?.length > 0 ? `✅ ${userData.experience.length} positions` : '❌ Not detected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Skills:</span>
                          <span className={userData.skills?.length > 0 ? 'text-green-600' : 'text-red-600'}>
                            {userData.skills?.length > 0 ? `✅ ${userData.skills.length} skills` : '❌ Not detected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Education:</span>
                          <span className={userData.education?.length > 0 ? 'text-green-600' : 'text-yellow-600'}>
                            {userData.education?.length > 0 ? `✅ ${userData.education.length} entries` : '⚠️ Missing'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                          <span className={userData.projects?.length > 0 ? 'text-green-600' : 'text-yellow-600'}>
                            {userData.projects?.length > 0 ? `✅ ${userData.projects.length} projects` : '⚠️ Optional'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ATS Compatibility Analysis Display for ATS mode */}
            {atsAnalysis && userGoal === 'ats' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
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
                        {atsAnalysis.overallScore >= 80 ? 'ATS Optimized' :
                         atsAnalysis.overallScore >= 60 ? 'Good Compatibility' : 'Needs ATS Work'}
                      </span>
                    </div>
                  </div>

                  {atsAnalysis.categories && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{atsAnalysis.categories.keywordOptimization?.score || 0}%</div>
                        <div className="text-sm text-muted">Keywords</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{atsAnalysis.categories.contentRelevance?.score || 0}%</div>
                        <div className="text-sm text-muted">Relevance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{atsAnalysis.categories.skillsAlignment?.score || 0}%</div>
                        <div className="text-sm text-muted">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{atsAnalysis.categories.completeness?.score || 0}%</div>
                        <div className="text-sm text-muted">Completeness</div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* ATS Issues */}
                    {atsAnalysis.issues && atsAnalysis.issues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3">⚠️ ATS Issues</h4>
                          <ul className="space-y-2">
                          {atsAnalysis.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-orange-600 dark:text-orange-400">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Keyword Gaps */}
                    {atsAnalysis.keywordGaps && atsAnalysis.keywordGaps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">🔍 Keyword Gaps</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsAnalysis.keywordGaps.map((keyword, index) => (
                            <span key={index} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">
                              {keyword.keyword || keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ATS Recommendations */}
                    {atsAnalysis.quickWins && atsAnalysis.quickWins.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">💡 Quick ATS Wins</h4>
                        <ul className="space-y-2">
                          {atsAnalysis.quickWins.map((rec, index) => (
                            <li key={index} className="text-sm text-green-600 dark:text-green-400">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-center text-sm text-purple-700 dark:text-purple-300">
                    🤖 This ATS compatibility analysis helps ensure your resume passes automated screening systems
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


