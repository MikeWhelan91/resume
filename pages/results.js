import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { limitCoverLetter } from '../lib/renderUtils';
import ResumeTemplate from '../components/ResumeTemplate';
import { FileText, Download, ArrowLeft, Sparkles, Palette, Zap, FileDown } from 'lucide-react';

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'];

const TEMPLATES = [
  { id: 'professional', name: 'Professional' },
  { id: 'modern', name: 'Modern' },
  { id: 'creative', name: 'Creative' }
];

export default function ResultsPage() {
  const router = useRouter();
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [userData, setUserData] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userGoal, setUserGoal] = useState('both');


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

    try {
      await triggerDownload('/api/download-cv', 'cv.pdf', {
        template,
        accent,
        data: userData,
      });
    } catch (error) {
      console.error('Download error:', error);
      // Silently handle download errors
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

  const generateTailoredContent = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
      return;
    }

    if (!jobDescription.trim()) {
      alert('Please enter a job description.');
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
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const tailoredData = await response.json();
      setUserData(tailoredData);
      
      // Save updated data to localStorage
      localStorage.setItem('resumeResult', JSON.stringify(tailoredData));
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
        console.log('Loaded user data:', parsed);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }, []);



    // CV Preview
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
          <ResumeTemplate userData={userData} accent={accent} template={template} />
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
        <title>{headerContent.title} – TailorCV</title>
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
                  <label className="text-sm font-medium text-gray-700" htmlFor="templateSelect">Template Style</label>
                  <select 
                    id="templateSelect" 
                    className="form-select" 
                    value={template} 
                    onChange={(e) => setTemplate(e.target.value)}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Theme Color</h3>
                <div className="grid grid-cols-6 gap-2">
                  {ACCENTS.map(c => (
                    <button
                      key={c}
                      className="w-8 h-8 rounded-lg shadow-sm border-2 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: c, 
                        borderColor: c === accent ? c : 'rgb(229 231 235)',
                        boxShadow: c === accent ? `0 0 0 2px ${c}40` : 'none'
                      }}
                      onClick={() => setAccent(c)}
                      aria-label={`Accent ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700" htmlFor="jobDescription">Job Description</label>
                <textarea 
                  id="jobDescription"
                  className="form-textarea h-32 resize-none"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to tailor your documents..."
                />
                <button 
                  className="btn btn-primary w-full flex items-center gap-2 justify-center" 
                  onClick={generateTailoredContent}
                  disabled={isGenerating || !jobDescription.trim()}
                >
                  {isGenerating ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Tailored Content'}
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  className="btn btn-secondary w-full flex items-center gap-2 justify-center" 
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Wizard
                </button>
                
                <div className="space-y-2">
                  {(userGoal === 'cv' || userGoal === 'both') && (
                    <>
                      <button 
                        className="btn btn-primary w-full flex items-center gap-2 justify-center" 
                        onClick={downloadCV}
                      >
                        <Download className="w-4 h-4" />
                        Download Resume PDF
                      </button>
                      
                      <button 
                        className="btn btn-secondary w-full flex items-center gap-2 justify-center"
                        onClick={downloadResumeDocx}
                      >
                        <FileDown className="w-4 h-4" />
                        Download Resume DOCX
                      </button>
                    </>
                  )}
                  
                  {(userGoal === 'cover-letter' || userGoal === 'both') && (
                    <>
                      <button 
                        className="btn btn-primary w-full flex items-center gap-2 justify-center"
                        onClick={downloadCoverLetter}
                      >
                        <Download className="w-4 h-4" />
                        Download Cover Letter PDF
                      </button>
                      
                      <button 
                        className="btn btn-secondary w-full flex items-center gap-2 justify-center"
                        onClick={downloadCoverLetterDocx}
                      >
                        <FileDown className="w-4 h-4" />
                        Download Cover Letter DOCX
                      </button>
                    </>
                  )}
                </div>
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