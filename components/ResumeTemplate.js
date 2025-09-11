import React from 'react';
import { limitExperience, limitEducation } from '../lib/renderUtils';

// Helper function to safely get values and handle null/undefined
function safeProp(obj, path, fallback = '') {
  const value = path.split('.').reduce((o, p) => o && o[p], obj);
  return (value === null || value === undefined || value === 'null' || value === 'undefined') ? fallback : value;
}

const formatDate = (date) => {
  if (!date || date === 'null' || date === 'undefined') return 'Present';
  return date.toString().trim();
};

const ProfessionalTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
    {userData ? (
      <>
        <div style={{ borderBottom: `${2 * scale}px solid ${accent}`, paddingBottom: `${8 * scale}px`, marginBottom: `${12 * scale}px` }}>
          <h1 style={{ fontSize: `${16 * scale}px`, marginBottom: `${2 * scale}px`, color: accent, fontWeight: 'bold' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <p style={{ fontSize: `${9 * scale}px`, color: '#666' }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} •
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </p>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${12 * scale}px` }}>
            <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>Professional Summary</h2>
            <p style={{ fontSize: `${9 * scale}px`, textAlign: 'justify' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
          <div style={{ marginBottom: `${12 * scale}px` }}>
            <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>Core Competencies</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${4 * scale}px` }}>
              {userData.resumeData.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: `${8 * scale}px`, padding: `${2 * scale}px ${6 * scale}px`, backgroundColor: '#f0f0f0', borderRadius: `${3 * scale}px` }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div className="section-content may-break-page" style={{ marginBottom: `${12 * scale}px` }}>
            <h2 className="section-header may-break-page" style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>Professional Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${10 * scale}px` }}>
                <div>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold' }}>{safeProp(exp, 'title')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666' }}>{safeProp(exp, 'company')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list">
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${8 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${2 * scale}px` }}>▪ {bullet}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
          <div className="section-content may-break-page">
            <h2 className="section-header may-break-page" style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>Education</h2>
            {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
              <div key={i} className="education-item" style={{ marginBottom: `${4 * scale}px` }}>
                <div>
                  <div style={{ fontSize: `${9 * scale}px`, fontWeight: 'bold' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
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

const ModernTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Helvetica, sans-serif', lineHeight: '1.4' }}>
    {userData ? (
      <>
        <div style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}10)`, padding: `${12 * scale}px`, marginBottom: `${12 * scale}px`, borderRadius: `${8 * scale}px` }}>
          <h1 style={{ fontSize: `${16 * scale}px`, marginBottom: `${2 * scale}px`, color: accent, fontWeight: 'bold' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <p style={{ fontSize: `${9 * scale}px`, color: '#666' }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} •
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </p>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${12 * scale}px`, padding: `${8 * scale}px`, backgroundColor: '#f8f9fa', borderLeft: `${4 * scale}px solid ${accent}`, borderRadius: `${4 * scale}px` }}>
            <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold' }}>About</h2>
            <p style={{ fontSize: `${9 * scale}px` }}>{userData.resumeData.summary}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${12 * scale}px`, marginBottom: `${12 * scale}px` }}>
          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold' }}>Skills</h2>
              {userData.resumeData.skills.slice(0, 6).map((skill, i) => (
                <div key={i} style={{ fontSize: `${8 * scale}px`, marginBottom: `${2 * scale}px`, padding: `${2 * scale}px`, backgroundColor: '#f0f0f0' }}>{skill}</div>
              ))}
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold' }}>Education</h2>
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${6 * scale}px` }}>
                  <div style={{ fontSize: `${9 * scale}px`, fontWeight: 'bold' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div>
            <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold' }}>Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${10 * scale}px`, padding: `${6 * scale}px`, border: `${1 * scale}px solid #e0e0e0`, borderRadius: `${4 * scale}px` }}>
                <div style={{ marginBottom: `${3 * scale}px` }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold', color: accent }}>{safeProp(exp, 'title')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666' }}>{safeProp(exp, 'company')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666', backgroundColor: '#f0f0f0', padding: `${1 * scale}px ${4 * scale}px`, borderRadius: `${2 * scale}px`, display: 'inline-block', marginTop: `${2 * scale}px` }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list">
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${8 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${2 * scale}px` }}>→ {bullet}</div>
                    ))}
                  </div>
                )}
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

const CreativeTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Georgia, serif', lineHeight: '1.4' }}>
    {userData ? (
      <>
        <div style={{ textAlign: 'center', marginBottom: `${15 * scale}px` }}>
          <h1 style={{ fontSize: `${18 * scale}px`, marginBottom: `${4 * scale}px`, color: accent, fontWeight: 'bold', letterSpacing: '1px' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <div style={{ height: `${2 * scale}px`, width: `${40 * scale}px`, backgroundColor: accent, margin: `${4 * scale}px auto` }}></div>
          <p style={{ fontSize: `${9 * scale}px`, color: '#666', fontStyle: 'italic' }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} •
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </p>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${12 * scale}px`, textAlign: 'center' }}>
            <h2 style={{ fontSize: `${11 * scale}px`, color: accent, marginBottom: `${4 * scale}px`, fontWeight: 'bold', fontStyle: 'italic' }}>Profile</h2>
            <p style={{ fontSize: `${9 * scale}px`, fontStyle: 'italic', maxWidth: '80%', margin: '0 auto' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div style={{ marginBottom: `${12 * scale}px` }}>
            <div style={{ textAlign: 'center', marginBottom: `${8 * scale}px` }}>
              <h2 style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: 'bold', fontStyle: 'italic', margin: '0' }}>Experience</h2>
              <div style={{ height: `${1 * scale}px`, width: `${30 * scale}px`, backgroundColor: accent, margin: `${2 * scale}px auto` }}></div>
            </div>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${10 * scale}px`, position: 'relative', paddingLeft: `${12 * scale}px` }}>
                <div style={{ position: 'absolute', left: '0', top: `${2 * scale}px`, width: `${4 * scale}px`, height: `${4 * scale}px`, backgroundColor: accent, borderRadius: '50%' }}></div>
                <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold', color: accent }}>{safeProp(exp, 'title')}</div>
                <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontStyle: 'italic' }}>{safeProp(exp, 'company')}</div>
                <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list">
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${8 * scale}px`, marginTop: `${2 * scale}px`, color: '#555' }}>• {bullet}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${12 * scale}px` }}>
          <div>
            {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
              <>
                <div style={{ textAlign: 'center', marginBottom: `${6 * scale}px` }}>
                  <h2 style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: 'bold', fontStyle: 'italic', margin: '0' }}>Skills</h2>
                  <div style={{ height: `${1 * scale}px`, width: `${20 * scale}px`, backgroundColor: accent, margin: `${2 * scale}px auto` }}></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {userData.resumeData.skills.slice(0, 6).map((skill, i) => (
                    <span key={i} style={{ fontSize: `${8 * scale}px`, color: accent, fontWeight: 'bold' }}>
                      {skill}{i < userData.resumeData.skills.slice(0, 6).length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
              <>
                <div style={{ textAlign: 'center', marginBottom: `${6 * scale}px` }}>
                  <h2 style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: 'bold', fontStyle: 'italic', margin: '0' }}>Education</h2>
                  <div style={{ height: `${1 * scale}px`, width: `${20 * scale}px`, backgroundColor: accent, margin: `${2 * scale}px auto` }}></div>
                </div>
                {limitEducation(userData.resumeData.education, 1).map((edu, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: `${9 * scale}px`, fontWeight: 'bold' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                    <div style={{ fontSize: `${8 * scale}px`, color: '#666', fontStyle: 'italic' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                    <div style={{ fontSize: `${8 * scale}px`, color: '#666' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </>
    ) : (
      <div style={{ textAlign: 'center', color: '#666', marginTop: '100px', fontSize: '10px' }}>
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

export default function ResumeTemplate({ userData, template, accent, isPDF = false }) {
  const scale = isPDF ? 1.75 : 1; // Scale up for PDF
  
  switch (template) {
    case 'modern':
      return <ModernTemplate userData={userData} accent={accent} scale={scale} />;
    case 'creative':
      return <CreativeTemplate userData={userData} accent={accent} scale={scale} />;
    case 'professional':
    default:
      return <ProfessionalTemplate userData={userData} accent={accent} scale={scale} />;
  }
}

export const resumeBaseStyles = `
  <style>
    @page {
      margin: 15mm;
      size: A4;
      padding: 0; /* Remove any default padding */
    }
    
    @page :first {
      margin: 15mm; /* Consistent margins on first page */
    }
    
    @page :left, @page :right {
      margin: 15mm; /* Consistent margins on subsequent pages */
    }
    
    body {
      margin: 0;
      padding: 0;
      background: white;
      font-family: Arial, sans-serif;
      width: 794px;
      min-height: 1123px; /* Allow multiple pages */
    }
    .a4-outer {
      width: 794px;
      min-height: 1123px; /* Allow multiple pages */
      background: white;
      margin: 0;
      padding: 0;
    }
    .a4-scope {
      width: 794px;
      min-height: 1123px; /* Allow multiple pages */
      background: white;
      box-sizing: border-box;
      overflow: visible; /* Allow content to flow to next page */
      margin: 0; /* No margin */
      padding: 0; /* No padding at container level */
      /* Add default spacing that works across page breaks */
      line-height: 1.4;
    }
    .a4-scope * { 
      box-sizing: border-box; 
    }
    
    /* Page break rules for PDF generation */
    
    /* Force padding on elements that start new pages */
    .experience-item:nth-child(n+3), 
    .education-item:nth-child(n+3),
    h2:nth-of-type(n+2) {
      margin-top: 40px !important;
    }
    
    /* Avoid breaking inside experience/education items */
    .experience-item, .education-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 1.5em;
      padding-bottom: 0.5em;
    }
    
    /* Ensure bullets stay with their parent */
    .bullet-list {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-top: 0.3em;
    }
    
    /* Add proper spacing for new pages */
    h1, h2 {
      page-break-after: avoid;
      break-after: avoid;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
    }
    
    /* First heading shouldn't have top margin */
    h1:first-of-type, h2:first-of-type {
      margin-top: 0;
    }
    
    /* Ensure sections don't break badly */
    .section-content {
      orphans: 2;
      widows: 2;
    }
    
    /* Alternative: Add spacing to any element that appears after a page break */
    * {
      page-break-before: auto;
    }
    
    /* Add a specific class for elements that should have top spacing when they start a new page */
    .may-break-page {
      margin-top: 0;
    }
    
    @media print {
      .may-break-page {
        margin-top: 40px;
      }
    }
  </style>
`;
