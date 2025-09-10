import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { limitCoverLetter } from '../lib/renderUtils';
import ResumeTemplate from '../components/ResumeTemplate';

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
  const [userGoal, setUserGoal] = useState('both'); // Track what the user wants to generate

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
      alert('Error generating PDF. Please try again.');
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
      alert('Error generating PDF. Please try again.');
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
      
      alert('CV and cover letter have been tailored to the job description!');
    } catch (error) {
      console.error('Generate error:', error);
      alert('Error generating tailored content. Please try again.');
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
      <div className="PreviewCard">
        <div className="PreviewHeader">CV Preview</div>
        <div className="A4Preview">
          <ResumeTemplate userData={userData} accent={accent} template={template} />
        </div>
      </div>
    );

  // Cover Letter Preview
  const renderCoverLetterPreview = () => {
    const scale = 1; // Preview uses 1x scale, PDF will use 1.75x
    
    return (
      <div className="PreviewCard">
        <div className="PreviewHeader">Cover Letter Preview</div>
        <div className="A4Preview">
          <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
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

  return (
    <>
      <Head>
        <title>Resume & Cover Letter Preview – TailorCV</title>
        <meta name="description" content="Preview resumes and cover letters with consistent formatting and download matching PDFs instantly."/>
      </Head>
      
      <div className="ResultsLayout">
        {/* Left sidebar controls */}
        <aside className="ResultsSidebar">
          <h2 className="PanelTitle">Controls</h2>
          
          {(userGoal === 'cv' || userGoal === 'both') && (
            <div className="Group">
              <label className="Label" htmlFor="templateSelect">Template</label>
              <select 
                id="templateSelect" 
                className="Select" 
                value={template} 
                onChange={(e) => setTemplate(e.target.value)}
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="Group">
            <h3>Theme Colour</h3>
            <div className="Row">
              {ACCENTS.map(c => (
                <button
                  key={c}
                  className="RadioSwatch"
                  style={{background:c, outlineColor: c===accent ? c : 'var(--border)'}}
                  onClick={() => setAccent(c)}
                  aria-label={`Accent ${c}`}

                />
              ))}
            </div>
          </div>

          <div className="Group">
            <label className="Label" htmlFor="jobDescription">Job Description</label>
            <textarea 
              id="jobDescription"
              className="Textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to tailor your CV and cover letter..."
              rows={6}
            />
            <div style={{height:10}} />
            <button 
              className="Button" 
              onClick={generateTailoredContent}
              disabled={isGenerating || !jobDescription.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate Tailored Content'}
            </button>
          </div>

          <div className="Group">
            <button className="Button" onClick={() => router.push('/')}>
              ← Back to Wizard
            </button>
            <div style={{height:10}} />
            {(userGoal === 'cv' || userGoal === 'both') && (
              <>
                <button className="Button" onClick={downloadCV}>
                  Download CV PDF
                </button>
                <div style={{height:10}} />
              </>
            )}
            {(userGoal === 'cover-letter' || userGoal === 'both') && (
              <button className="Button secondary" onClick={downloadCoverLetter}>
                Download Cover Letter PDF
              </button>
            )}
          </div>
        </aside>

        {/* Right side previews */}
        <section className="PreviewsSection">
          <h2 className="PanelTitle">Previews</h2>
          <div className="Previews">
            {(userGoal === 'cv' || userGoal === 'both') && renderCVPreview()}
            {(userGoal === 'cover-letter' || userGoal === 'both') && renderCoverLetterPreview()}
          </div>
        </section>
      </div>
    </>
  );
}