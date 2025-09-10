import React from 'react';
import { limitExperience, limitEducation } from '../lib/renderUtils';

const ProfessionalTemplate = ({ userData, accent }) => (
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
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{exp.title}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{exp.company}</div>
                  </div>
                  <div style={{ fontSize: '8px', color: '#666' }}>{exp.start} - {exp.end}</div>
                </div>
                {exp.bullets && exp.bullets.map((bullet, j) => (
                  <div key={j} style={{ fontSize: '8px', marginLeft: '8px', marginTop: '2px' }}>▪ {bullet}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
          <div>
            <h2 style={{ fontSize: '11px', color: accent, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Education</h2>
            {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
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

const ModernTemplate = ({ userData, accent }) => (
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
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
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
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} style={{ marginBottom: '10px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: accent }}>{exp.title}</div>
                  <div style={{ fontSize: '8px', color: '#666', backgroundColor: '#f0f0f0', padding: '1px 4px', borderRadius: '2px' }}>{exp.start} - {exp.end}</div>
                </div>
                <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>{exp.company}</div>
                {exp.bullets && exp.bullets.map((bullet, j) => (
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

const CreativeTemplate = ({ userData, accent }) => (
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
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} style={{ marginBottom: '10px', position: 'relative', paddingLeft: '12px' }}>
                <div style={{ position: 'absolute', left: '0', top: '2px', width: '4px', height: '4px', backgroundColor: accent, borderRadius: '50%' }}></div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: accent }}>{exp.title}</div>
                <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>{exp.company} • {exp.start} - {exp.end}</div>
                {exp.bullets && exp.bullets.map((bullet, j) => (
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
              {limitEducation(userData.resumeData.education, 1).map((edu, i) => (
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

export default function ResumeTemplate({ userData, template, accent }) {
  switch (template) {
    case 'modern':
      return <ModernTemplate userData={userData} accent={accent} />;
    case 'creative':
      return <CreativeTemplate userData={userData} accent={accent} />;
    case 'professional':
    default:
      return <ProfessionalTemplate userData={userData} accent={accent} />;
  }
}

export const resumeBaseStyles = `
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    body {
      margin: 0;
    }
    .a4-scope * { box-sizing: border-box; }
    .a4-scope img,
    .a4-scope canvas,
    .a4-scope svg,
    .a4-scope iframe,
    .a4-scope video {
      max-width: none !important;
      width: auto;
      height: auto;
    }
    @media print {
      .a4-outer {
        width: 794px !important;
        height: 1123px !important;
        overflow: visible !important;
      }
    }
  </style>
`;
