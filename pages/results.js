import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { limitCoverLetter } from '../lib/renderUtils';
import ResumeTemplate from '../components/ResumeTemplate';
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
  Target
} from 'lucide-react';

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'];

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
  const [resumeFormat, setResumeFormat] = useState('pdf');
  const [coverLetterFormat, setCoverLetterFormat] = useState('pdf');
  const [tone, setTone] = useState('professional');

  // Credit system helpers
  const getCreditsRemaining = () => {
    if (userPlan === 'free' && entitlement) {
      return entitlement.freeWeeklyCreditsRemaining || 0;
    }
    return null; // Pro users have unlimited/different limits
  };

  const canDownload = () => {
    if (userPlan === 'free') {
      return (entitlement?.freeWeeklyCreditsRemaining || 0) > 0;
    }
    return true; // Pro users can download (subject to their own limits)
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

  // Download functions
  const triggerDownload = async (endpoint, filename, payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadCV = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
      return;
    }

    if (!canDownload()) {
      const credits = getCreditsRemaining();
      showUpgradeAlert(`You've used all your weekly credits (${credits}/10). Your credits reset every Monday at midnight Dublin time. Upgrade to Pro for unlimited downloads!`);
      return;
    }

    try {
      await triggerDownload('/api/download-cv', 'resume.pdf', {
        template,
        accent,
        data: userData,
      });
      
      // Refresh entitlement data after successful download
      const entitlementResponse = await fetch('/api/entitlements');
      if (entitlementResponse.ok) {
        const entitlementData = await entitlementResponse.json();
        setEntitlement(entitlementData);
        setUserPlan(entitlementData.plan);
      }
    } catch (error) {
      console.error('Download error:', error);
      if (error.message && error.message.includes('429')) {
        showUpgradeAlert('You have reached your limit. Upgrade to Pro for unlimited downloads.');
      } else {
        alert('Failed to download PDF file. Please try again.');
      }
    }
  };

  const downloadCoverLetter = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
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
      alert('No data available. Please generate a resume first.');
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
      alert('Failed to download DOCX file. Please try again.');
    }
  };

  const downloadCoverLetterDocx = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
      return;
    }

    try {
      await triggerDownload('/api/export-cover-letter-docx', `${(userData.resumeData?.name || userData.name || 'cover_letter').replace(/\s+/g, '_')}_cover_letter.docx`, {
        userData,
        accent
      });
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download cover letter DOCX file. Please try again.');
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
      alert('No data available. Please generate a resume first.');
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
      
      alert('Resume optimized for ATS systems! Your resume has been enhanced with ATS-friendly formatting and keywords.');
      
    } catch (error) {
      console.error('ATS optimization error:', error);
      alert('Failed to optimize resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTailoredContent = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
      return;
    }

    if (!jobDescription.trim()) {
      alert('Please enter a job description.');
      return;
    }

    if (!canDownload()) {
      const credits = getCreditsRemaining();
      showUpgradeAlert(`You've used all your weekly credits (${credits}/10). Your credits reset every Monday at midnight Dublin time. Upgrade to Pro for unlimited generations!`);
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
      
      // Refresh entitlement data after successful generation (credit consumed)
      const entitlementResponse = await fetch('/api/entitlements');
      if (entitlementResponse.ok) {
        const entitlementData = await entitlementResponse.json();
        setEntitlement(entitlementData);
        setUserPlan(entitlementData.plan);
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

  // Fetch user entitlement and usage
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
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
      }
      setEntitlementLoading(false);
      setUsageLoading(false);
    };

    if (status !== 'loading') {
      fetchUserData();
    }
  }, [session, status]);



    // Resume Preview
    const renderCVPreview = () => (
      <div className="card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Resume Preview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>PDF Ready</span>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border" style={{aspectRatio: '210/297', minHeight: '400px'}}>
          <ResumeTemplate userData={userData} accent={accent} template={template} userPlan={userPlan} />
        </div>
      </div>
    );

  // Cover Letter Preview
  const renderCoverLetterPreview = () => {
    const scale = 1; // Preview uses 1x scale, PDF will use 1.75x
    
    return (
      <div className="card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Cover Letter Preview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>PDF Ready</span>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border" style={{aspectRatio: '210/297', minHeight: '400px'}}>
          <div style={{ padding: `${25 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
            {userData ? (
              <>
                <div style={{ marginBottom: `${15 * scale}px`, textAlign: 'right' }}>
                  <p style={{ fontSize: `${9 * scale}px`, color: '#666' }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div style={{ marginBottom: `${15 * scale}px` }}>
                  {userData.coverLetter ? (
                    limitCoverLetter(userData.coverLetter).map((paragraph, i) => (
                      <p key={i} style={{ fontSize: `${9 * scale}px`, marginBottom: `${8 * scale}px`, textAlign: 'justify' }}>
                        {paragraph.trim()}
                      </p>
                    ))
                  ) : (
                    <p style={{ fontSize: `${9 * scale}px`, textAlign: 'justify' }}>
                      Dear Hiring Manager,<br/><br/>
                      I am writing to express my interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.<br/><br/>
                      Thank you for considering my application. I look forward to hearing from you.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: `${20 * scale}px` }}>
                  <p style={{ fontSize: `${9 * scale}px` }}>Sincerely,</p>
                  <p style={{ fontSize: `${9 * scale}px`, marginTop: `${15 * scale}px`, fontWeight: 'bold' }}>
                    {userData.resumeData?.name || userData.name || 'Your Name'}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', marginTop: `${100 * scale}px`, fontSize: `${10 * scale}px` }}>
                No data available. Please generate a resume first.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dynamic content based on user goal
  const getHeaderContent = () => {
    switch(userGoal) {
      case 'cv':
        return {
          title: 'Your Tailored Resume',
          description: 'Review and download your ATS-optimized resume, customized for the job description.'
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
          description: 'Review and download your complete application package - resume and cover letter optimized for the job.'
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <>
      <Head>
        <title>{headerContent.title} – TailoredCV.app</title>
        <meta name="description" content={headerContent.description}/>
      </Head>
      
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {userGoal === 'cv' && 'Resume Generated'}
                {userGoal === 'cover-letter' && 'Cover Letter Generated'}
                {userGoal === 'both' && 'Complete Package Generated'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-slide-up">{headerContent.title}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>{headerContent.description}</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar controls */}
          <aside className="lg:col-span-1">
            <div className="card p-6 space-y-6 sticky top-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Customization</h2>
              </div>
          
              {(userGoal === 'cv' || userGoal === 'both') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Template Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(t => {
                      const isProTemplate = t.id !== 'professional';
                      const isLocked = isProTemplate && userPlan === 'free';
                      const isSelected = template === t.id;
                      
                      return (
                        <button
                          key={t.id}
                          className={`relative p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : isLocked 
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => !isLocked && setTemplate(t.id)}
                          disabled={isLocked}
                        >
                          <div className="flex items-center justify-between">
                            <span>{t.name}</span>
                            {isLocked && <Lock className="w-4 h-4" />}
                          </div>
                          {isProTemplate && userPlan === 'free' && (
                            <div className="text-xs text-gray-400 mt-1">Pro only</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {userPlan === 'free' && (
                    <>
                      <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <strong>Free Plan:</strong> Only Professional template available. <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleUpgradeClick}>Upgrade to Pro</span> for all templates.
                      </div>
                      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <strong>Weekly Credits:</strong> {getCreditsRemaining() || 0}/10 remaining. Credits reset every Monday at midnight Dublin time.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Theme Colors - Only for CV/Resume users */}
              {(userGoal === 'cv' || userGoal === 'both') && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Theme Color
                    {userPlan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {ACCENTS.map((c, index) => {
                      const isFirstColor = index === 0;
                      const isLocked = userPlan === 'free' && !isFirstColor;
                      const isSelected = accent === c;
                      
                      return (
                        <button
                          key={c}
                          className={`w-8 h-8 rounded-lg shadow-sm border-2 transition-all duration-200 relative ${
                            !isLocked ? 'hover:scale-110' : 'cursor-not-allowed opacity-50'
                          }`}
                          style={{
                            backgroundColor: c, 
                            borderColor: isSelected ? c : 'rgb(229 231 235)',
                            boxShadow: isSelected ? `0 0 0 2px ${c}40` : 'none'
                          }}
                          onClick={() => !isLocked && setAccent(c)}
                          disabled={isLocked}
                          aria-label={`Accent ${c}`}
                        >
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {userPlan === 'free' && (
                    <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <strong>Free Plan:</strong> Only default color available. <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleUpgradeClick}>Upgrade to Pro</span> for all color themes.
                    </div>
                  )}
                </div>
              )}

              {/* Hide tone dropdown for CV-only results */}
              {userGoal !== 'cv' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Cover Letter Tone</label>
                  <select 
                    className="form-select w-full"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Select your preferred tone. Click "Generate" to apply changes (consumes 1 credit).
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700" htmlFor="jobDescription">Job Description</label>
                  {jobDescription.trim() && (
                    <button
                      onClick={() => {
                        setJobDescription('');
                        localStorage.removeItem('jobDescription');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
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
                    className={`btn btn-primary flex items-center gap-2 justify-center ${
                      (isGenerating || !jobDescription.trim() || !canDownload()) 
                        ? 'cursor-not-allowed opacity-50' 
                        : ''
                    }`}
                    onClick={generateTailoredContent}
                    disabled={isGenerating || !jobDescription.trim() || !canDownload()}
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

                {/* ATS Optimization Button - Pro Only - Only for CV/Resume users */}
                {(userGoal === 'cv' || userGoal === 'both') && (
                  <>
                    <div className="relative">
                      <button 
                        className={`btn flex items-center gap-3 justify-center w-full text-lg font-semibold py-4 rounded-xl transition-all duration-300 ${
                          userPlan !== 'free'
                            ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white transform hover:scale-105 hover:shadow-xl animate-pulse shadow-lg'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300 shadow-inner'
                        } ${isGenerating ? 'cursor-not-allowed opacity-50 animate-none' : ''}`}
                        onClick={optimizeForATS}
                        disabled={isGenerating || userPlan === 'free'}
                      >
                        <div className="flex items-center gap-3">
                          <Target className={`w-5 h-5 ${userPlan !== 'free' && !isGenerating ? 'animate-bounce' : 'text-gray-400'}`} />
                          <span className={userPlan === 'free' ? 'text-gray-500' : ''}>
                            {userPlan === 'free' ? '🔒' : '🚀'} ATS Optimize
                          </span>
                          {userPlan === 'free' && <Lock className="w-5 h-5 ml-1 text-gray-400" />}
                        </div>
                      </button>
                      
                      {userPlan !== 'free' && !isGenerating && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                          HOT
                        </div>
                      )}
                    </div>

                    {userPlan === 'free' && (
                      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                        <strong>Note:</strong> Generating tailored content consumes 1 credit.
                      </div>
                    )}

                    {userPlan === 'free' && (
                      <div className="text-xs text-gray-500 bg-orange-50 border border-orange-200 rounded-lg p-2">
                        <strong>Pro Feature:</strong> ATS Optimization enhances your resume for Applicant Tracking Systems. <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleUpgradeClick}>Upgrade to Pro</span> to unlock this feature.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className={`grid gap-4 ${userGoal === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {(userGoal === 'cv' || userGoal === 'both') && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Resume Format</label>
                      <div className="relative">
                        <select
                          value={resumeFormat}
                          onChange={(e) => setResumeFormat(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pdf">PDF</option>
                          <option value="docx" disabled={!canUseDocx()}>
                            DOCX {!canUseDocx() && '(Pro only)'}
                          </option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <button 
                        className={`btn btn-primary w-full flex items-center gap-2 justify-center relative ${
                          !canDownloadResumeFormat() 
                            ? 'cursor-not-allowed opacity-50' 
                            : ''
                        }`}
                        onClick={downloadResume}
                        disabled={!canDownloadResumeFormat()}
                      >
                        <Download className="w-4 h-4" />
                        Download ({resumeFormat.toUpperCase()})
                        {resumeFormat === 'docx' && !canUseDocx() && <Lock className="w-4 h-4 ml-1" />}
                      </button>
                    </div>
                  )}
                  
                  {(userGoal === 'cover-letter' || userGoal === 'both') && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Cover Letter Format</label>
                      <div className="relative">
                        <select
                          value={coverLetterFormat}
                          onChange={(e) => setCoverLetterFormat(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pdf">PDF</option>
                          <option value="docx" disabled={!canUseDocx()}>
                            DOCX {!canUseDocx() && '(Pro only)'}
                          </option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <button 
                        className={`btn btn-primary w-full flex items-center gap-2 justify-center relative ${
                          !canDownloadCoverLetterFormat() 
                            ? 'cursor-not-allowed opacity-50' 
                            : ''
                        }`}
                        onClick={downloadCoverLetterConsolidated}
                        disabled={!canDownloadCoverLetterFormat()}
                      >
                        <Download className="w-4 h-4" />
                        Download ({coverLetterFormat.toUpperCase()})
                        {coverLetterFormat === 'docx' && !canUseDocx() && <Lock className="w-4 h-4 ml-1" />}
                      </button>
                    </div>
                  )}
                </div>
                
                {userPlan === 'free' && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">
                        {getCreditsRemaining() || 0}/10 credits remaining
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Credits reset every Monday at midnight Dublin time
                    </p>
                  </div>
                )}

                {userPlan === 'day_pass' && dayPassUsage && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium bg-gradient-to-r from-orange-700 to-pink-700 bg-clip-text text-transparent">
                        {dayPassUsage.generationsUsed}/{dayPassUsage.generationsLimit} generations used today
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Day pass expires in {Math.max(0, Math.ceil((new Date(dayPassUsage.expiresAt) - new Date()) / (1000 * 60 * 60)))} hours
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right side previews */}
          <section className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Document Previews</h2>
            </div>
            
            <div className={`grid gap-6 ${userGoal === 'both' ? 'xl:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
              {(userGoal === 'cv' || userGoal === 'both') && renderCVPreview()}
              {(userGoal === 'cover-letter' || userGoal === 'both') && renderCoverLetterPreview()}
            </div>
          </section>
        </div>
      </div>

    </>
  );
}