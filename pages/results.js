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

  useEffect(() => {
    // Load user data from localStorage
    try {
      const data = localStorage.getItem('resumeResult');
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
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
  const renderCoverLetterPreview = () => (
    <div className="PreviewCard">
      <div className="PreviewHeader">Cover Letter Preview</div>
      <div className="A4Preview">
        <div style={{ padding: '15px', fontSize: '10px', fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
          {userData ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '14px', marginBottom: '4px', color: accent, fontWeight: 'bold' }}>
                  {userData.resumeData?.name || userData.name || 'Your Name'}
                </h1>
                <p style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>
                  {userData.resumeData?.email || userData.email || 'your.email@example.com'}
                </p>
                <p style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>
                  {userData.resumeData?.phone || userData.phone || 'Your Phone'}
                </p>
              </div>

              <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                <p style={{ fontSize: '9px', color: '#666' }}>
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                {userData.coverLetter ? (
                  limitCoverLetter(userData.coverLetter).map((paragraph, i) => (
                    <p key={i} style={{ fontSize: '9px', marginBottom: '8px', textAlign: 'justify' }}>
                      {paragraph.trim()}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: '9px', textAlign: 'justify' }}>
                    Dear Hiring Manager,<br/><br/>
                    I am writing to express my interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.<br/><br/>
                    Thank you for considering my application. I look forward to hearing from you.
                  </p>
                )}
              </div>

              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '9px' }}>Sincerely,</p>
                <p style={{ fontSize: '9px', marginTop: '15px', fontWeight: 'bold' }}>
                  {userData.resumeData?.name || userData.name || 'Your Name'}
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '100px', fontSize: '10px' }}>
              No data available. Please generate a resume first.
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
            <button className="Button" onClick={() => router.push('/')}>
              ← Back to Wizard
            </button>
            <div style={{height:10}} />
            <button className="Button" onClick={downloadCV}>
              Download CV PDF
            </button>
            <div style={{height:10}} />
            <button className="Button secondary" onClick={downloadCoverLetter}>
              Download Cover Letter PDF
            </button>
          </div>
        </aside>

        {/* Right side previews */}
        <section className="PreviewsSection">
          <h2 className="PanelTitle">Previews</h2>
          <div className="Previews">
            {renderCVPreview()}
            {renderCoverLetterPreview()}
          </div>
        </section>
      </div>
    </>
  );
}