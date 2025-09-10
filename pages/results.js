import React, { useEffect, useState } from 'react';
import Head from 'next/head';

const ACCENTS = ['#10b39f','#2563eb','#7c3aed','#f97316','#ef4444','#111827'];

const TEMPLATES = [
  { id: 'professional', name: 'Professional' },
  { id: 'modern', name: 'Modern' },
  { id: 'creative', name: 'Creative' }
];

export default function ResultsPage() {
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [userData, setUserData] = useState(null);

  // Download functions
  const downloadCV = async () => {
    if (!userData) {
      alert('No data available. Please generate a resume first.');
      return;
    }

    try {
      const response = await fetch('/api/download-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template,
          accent,
          data: userData
        }),
      });

      const { html } = await response.json();
      
      // Create a new window and print it
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
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
      const response = await fetch('/api/download-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accent,
          data: userData
        }),
      });

      const { html } = await response.json();
      
      // Create a new window and print it
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
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

  // Professional Template
  const renderProfessionalCV = () => (
    <div style={{ padding: '15px', fontSize: '10px', fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
      {userData ? (
        <>
          <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '8px', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '16px', marginBottom: '2px', color: accent, fontWeight: 'bold' }}>
              {userData.resumeData?.name || userData.name || 'Your Name'}
            </h1>
            <p style={{ fontSize: '9px', color: '#666' }}>
              {userData.resumeData?.email || userData.email || 'your.email@example.com'} • 
              {userData.resumeData?.phone || userData.phone || 'Your Phone'}
            </p>
          </div>
          
          {userData.resumeData?.summary && (
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Professional Summary</h2>
              <p style={{ fontSize: '9px', textAlign: 'justify' }}>{userData.resumeData.summary}</p>
            </div>
          )}

          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Core Competencies</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {userData.resumeData.skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: '8px', padding: '2px 6px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Professional Experience</h2>
              {userData.resumeData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{exp.title}</div>
                      <div style={{ fontSize: '9px', color: '#666' }}>{exp.company}</div>
                    </div>
                    <div style={{ fontSize: '8px', color: '#666' }}>{exp.start} - {exp.end}</div>
                  </div>
                  {exp.bullets && exp.bullets.slice(0, 2).map((bullet, j) => (
                    <div key={j} style={{ fontSize: '8px', marginLeft: '8px', marginTop: '2px' }}>▪ {bullet}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Education</h2>
              {userData.resumeData.education.slice(0, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{edu.area || edu.degree}</div>
                      <div style={{ fontSize: '8px', color: '#666' }}>{edu.institution}</div>
                    </div>
                    <div style={{ fontSize: '8px', color: '#666' }}>{edu.start} - {edu.end}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '100px', fontSize: '10px' }}>
          No data available. Please generate a resume first.
        </div>
      )}
    </div>
  );

  // Modern Template
  const renderModernCV = () => (
    <div style={{ padding: '15px', fontSize: '10px', fontFamily: 'Helvetica, sans-serif', lineHeight: '1.4' }}>
      {userData ? (
        <>
          <div style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}10)`, padding: '12px', marginBottom: '12px', borderRadius: '8px' }}>
            <h1 style={{ fontSize: '16px', marginBottom: '2px', color: accent, fontWeight: 'bold' }}>
              {userData.resumeData?.name || userData.name || 'Your Name'}
            </h1>
            <p style={{ fontSize: '9px', color: '#666' }}>
              {userData.resumeData?.email || userData.email || 'your.email@example.com'} • 
              {userData.resumeData?.phone || userData.phone || 'Your Phone'}
            </p>
          </div>
          
          {userData.resumeData?.summary && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f8f9fa', borderLeft: `4px solid ${accent}`, borderRadius: '4px' }}>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold' }}>About</h2>
              <p style={{ fontSize: '9px' }}>{userData.resumeData.summary}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
              <div>
                <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold' }}>Skills</h2>
                {userData.resumeData.skills.slice(0, 6).map((skill, i) => (
                  <div key={i} style={{ fontSize: '8px', marginBottom: '2px', padding: '2px', backgroundColor: '#f0f0f0' }}>{skill}</div>
                ))}
              </div>
            )}
            
            {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
              <div>
                <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold' }}>Education</h2>
                {userData.resumeData.education.slice(0, 2).map((edu, i) => (
                  <div key={i} style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{edu.area || edu.degree}</div>
                    <div style={{ fontSize: '8px', color: '#666' }}>{edu.institution}</div>
                    <div style={{ fontSize: '8px', color: '#666' }}>{edu.start} - {edu.end}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
            <div>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold' }}>Experience</h2>
              {userData.resumeData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} style={{ marginBottom: '10px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: accent }}>{exp.title}</div>
                    <div style={{ fontSize: '8px', color: '#666', backgroundColor: '#f0f0f0', padding: '1px 4px', borderRadius: '2px' }}>{exp.start} - {exp.end}</div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>{exp.company}</div>
                  {exp.bullets && exp.bullets.slice(0, 2).map((bullet, j) => (
                    <div key={j} style={{ fontSize: '8px', marginLeft: '8px', marginTop: '2px' }}>→ {bullet}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '100px', fontSize: '10px' }}>
          No data available. Please generate a resume first.
        </div>
      )}
    </div>
  );

  // Creative Template
  const renderCreativeCV = () => (
    <div style={{ padding: '15px', fontSize: '10px', fontFamily: 'Georgia, serif', lineHeight: '1.4' }}>
      {userData ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '18px', marginBottom: '4px', color: accent, fontWeight: 'bold', letterSpacing: '1px' }}>
              {userData.resumeData?.name || userData.name || 'Your Name'}
            </h1>
            <div style={{ height: '2px', width: '40px', backgroundColor: accent, margin: '4px auto' }}></div>
            <p style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>
              {userData.resumeData?.email || userData.email || 'your.email@example.com'} • 
              {userData.resumeData?.phone || userData.phone || 'Your Phone'}
            </p>
          </div>
          
          {userData.resumeData?.summary && (
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', fontStyle: 'italic' }}>Profile</h2>
              <p style={{ fontSize: '9px', fontStyle: 'italic', maxWidth: '80%', margin: '0 auto' }}>{userData.resumeData.summary}</p>
            </div>
          )}

          {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '11px', color: accent, fontWeight: 'bold', fontStyle: 'italic' }}>Experience</h2>
                <div style={{ height: '1px', width: '30px', backgroundColor: accent, margin: '2px auto' }}></div>
              </div>
              {userData.resumeData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} style={{ marginBottom: '10px', position: 'relative', paddingLeft: '12px' }}>
                  <div style={{ position: 'absolute', left: '0', top: '2px', width: '4px', height: '4px', backgroundColor: accent, borderRadius: '50%' }}></div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: accent }}>{exp.title}</div>
                  <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>{exp.company} • {exp.start} - {exp.end}</div>
                  {exp.bullets && exp.bullets.slice(0, 2).map((bullet, j) => (
                    <div key={j} style={{ fontSize: '8px', marginTop: '2px', color: '#555' }}>• {bullet}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '11px', color: accent, fontWeight: 'bold', fontStyle: 'italic' }}>Skills</h2>
                  <div style={{ height: '1px', width: '20px', backgroundColor: accent, margin: '2px auto' }}></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {userData.resumeData.skills.slice(0, 6).map((skill, i) => (
                    <span key={i} style={{ fontSize: '8px', color: accent, fontWeight: 'bold' }}>
                      {skill}{i < userData.resumeData.skills.slice(0, 6).length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '11px', color: accent, fontWeight: 'bold', fontStyle: 'italic' }}>Education</h2>
                  <div style={{ height: '1px', width: '20px', backgroundColor: accent, margin: '2px auto' }}></div>
                </div>
                {userData.resumeData.education.slice(0, 1).map((edu, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{edu.area || edu.degree}</div>
                    <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>{edu.institution}</div>
                    <div style={{ fontSize: '8px', color: '#666' }}>{edu.start} - {edu.end}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '100px', fontSize: '10px' }}>
          No data available. Please generate a resume first.
        </div>
      )}
    </div>
  );

  // CV Preview with template switching
  const renderCVPreview = () => {
    const getTemplateRenderer = () => {
      switch (template) {
        case 'modern': return renderModernCV();
        case 'creative': return renderCreativeCV();
        case 'professional':
        default: return renderProfessionalCV();
      }
    };

    return (
      <div className="PreviewCard">
        <div className="PreviewHeader">CV Preview</div>
        <div className="A4Preview">
          {getTemplateRenderer()}
        </div>
      </div>
    );
  };

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
                  userData.coverLetter.split('\n\n').filter(p => p.trim()).slice(0, 3).map((paragraph, i) => (
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
        <title>Results Preview – TailorCV</title>
        <meta name="description" content="Preview your resume and cover letter side-by-side."/>
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