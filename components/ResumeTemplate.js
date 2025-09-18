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

const formatProjectDate = (start, end, present) => {
  const startStr = start && start !== 'null' && start !== 'undefined' ? start.toString().trim() : '';
  const endStr = present ? 'Present' : (end && end !== 'null' && end !== 'undefined' ? end.toString().trim() : '');

  if (!startStr && !endStr) return '';
  if (!startStr) return endStr;
  if (!endStr) return startStr;
  return `${startStr} - ${endStr}`;
};

const ProfessionalTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
    {userData ? (
      <>
        <div style={{ borderBottom: `${2 * scale}px solid ${accent}`, paddingBottom: `${8 * scale}px`, marginBottom: `${16 * scale}px`, borderRadius: `${8 * scale}px ${8 * scale}px 0 0` }}>
          <h1 style={{ fontSize: `${18 * scale}px`, marginBottom: `${4 * scale}px`, color: accent, fontWeight: '600', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <p className="resume-muted" style={{ fontSize: `${9 * scale}px` }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} •
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </p>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${16 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Professional Summary</h2>
            <p style={{ fontSize: `${10 * scale}px`, textAlign: 'justify', lineHeight: '1.6', color: '#374151' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
          <div style={{ marginBottom: `${16 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Core Competencies</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${6 * scale}px` }}>
              {userData.resumeData.skills.map((skill, i) => (
                <span key={i} className="resume-skill-tag" style={{ fontSize: `${9 * scale}px`, padding: `${4 * scale}px ${8 * scale}px`, borderRadius: `${8 * scale}px` }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div className="section-content may-break-page" style={{ marginBottom: `${16 * scale}px` }}>
            <h2 className="section-header may-break-page" style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Professional Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${12 * scale}px`, padding: `${8 * scale}px`, backgroundColor: '#fafafa', borderRadius: `${8 * scale}px`, border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif' }}>{safeProp(exp, 'title')}</div>
                  <div className="resume-muted" style={{ fontSize: `${10 * scale}px`, fontWeight: '500', marginTop: `${2 * scale}px` }}>{safeProp(exp, 'company')}</div>
                  <div className="resume-muted" style={{ fontSize: `${9 * scale}px`, marginTop: `${2 * scale}px` }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list" style={{ marginTop: `${6 * scale}px` }}>
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${9 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${3 * scale}px`, color: '#374151', lineHeight: '1.5' }}>▪ {bullet}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div className="section-content may-break-page" style={{ marginBottom: `${16 * scale}px` }}>
            <h2 className="section-header may-break-page" style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Projects</h2>
            {userData.resumeData.projects.slice(0, 3).map((project, i) => (
              <div key={i} className="project-item" style={{ marginBottom: `${12 * scale}px`, padding: `${8 * scale}px`, backgroundColor: '#f9fafb', borderRadius: `${8 * scale}px`, border: `1px solid #e5e7eb` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${4 * scale}px` }}>
                  <div>
                    <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif', margin: 0, marginBottom: `${2 * scale}px` }}>
                      {project.url ? (
                        <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                      ) : (
                        project.name
                      )}
                    </h3>
                    {formatProjectDate(project.start, project.end, project.present) && (
                      <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', fontWeight: '500' }}>
                        {formatProjectDate(project.start, project.end, project.present)}
                      </div>
                    )}
                  </div>
                  {project.demo && (
                    <a href={project.demo} style={{ fontSize: `${8 * scale}px`, color: accent, textDecoration: 'none', fontWeight: '500' }}>Live Demo</a>
                  )}
                </div>
                {project.description && (
                  <p style={{ fontSize: `${9 * scale}px`, color: '#374151', marginBottom: `${6 * scale}px`, lineHeight: '1.5' }}>{project.description}</p>
                )}
                {project.bullets && project.bullets.length > 0 && (
                  <div className="bullet-list" style={{ marginTop: `${6 * scale}px` }}>
                    {project.bullets.map((bullet, bIndex) => (
                      <div key={bIndex} style={{ fontSize: `${9 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${3 * scale}px`, color: '#374151', lineHeight: '1.5' }}>▪ {bullet}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
          <div className="section-content may-break-page">
            <h2 className="section-header may-break-page" style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Education</h2>
            {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
              <div key={i} className="education-item" style={{ marginBottom: `${8 * scale}px`, padding: `${6 * scale}px`, backgroundColor: '#f9fafb', borderRadius: `${6 * scale}px` }}>
                <div>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div className="resume-muted" style={{ fontSize: `${9 * scale}px`, fontWeight: '500', marginTop: `${2 * scale}px` }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div className="resume-muted" style={{ fontSize: `${8 * scale}px`, marginTop: `${2 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    ) : (
      <div className="resume-no-data">
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const ModernTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Helvetica, sans-serif', lineHeight: '1.4' }}>
    {userData ? (
      <>
        <div style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}08)`, padding: `${16 * scale}px`, marginBottom: `${16 * scale}px`, borderRadius: `${12 * scale}px`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: `${18 * scale}px`, marginBottom: `${4 * scale}px`, color: accent, fontWeight: '600', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <p className="resume-muted" style={{ fontSize: `${9 * scale}px` }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} •
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </p>
        </div>

        {userData.resumeData?.summary && (
          <div className="resume-summary-bg" style={{ marginBottom: `${16 * scale}px`, padding: `${12 * scale}px`, borderLeft: `${4 * scale}px solid ${accent}`, borderRadius: `${8 * scale}px`, backgroundColor: '#fafafa' }}>
            <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>About</h2>
            <p style={{ fontSize: `${10 * scale}px`, lineHeight: '1.6', color: '#374151' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${16 * scale}px`, marginBottom: `${16 * scale}px` }}>
          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${4 * scale}px` }}>
                {userData.resumeData.skills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="resume-skill-tag" style={{ fontSize: `${8 * scale}px`, padding: `${3 * scale}px ${6 * scale}px`, borderRadius: `${8 * scale}px` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Projects</h2>
              {userData.resumeData.projects.slice(0, 2).map((project, i) => (
                <div key={i} style={{ marginBottom: `${10 * scale}px`, padding: `${8 * scale}px`, backgroundColor: '#f9fafb', borderRadius: `${8 * scale}px`, border: `1px solid #e5e7eb` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${4 * scale}px` }}>
                    <div>
                      <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif', margin: 0, marginBottom: `${2 * scale}px` }}>
                        {project.url ? (
                          <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                        ) : (
                          project.name
                        )}
                      </h3>
                      {formatProjectDate(project.start, project.end, project.present) && (
                        <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', fontWeight: '500' }}>
                          {formatProjectDate(project.start, project.end, project.present)}
                        </div>
                      )}
                    </div>
                    {project.demo && (
                      <a href={project.demo} style={{ fontSize: `${8 * scale}px`, color: accent, textDecoration: 'none', fontWeight: '500' }}>Demo</a>
                    )}
                  </div>
                  {project.description && (
                    <p style={{ fontSize: `${9 * scale}px`, color: '#374151', marginBottom: `${6 * scale}px`, lineHeight: '1.5' }}>{project.description}</p>
                  )}
                  {project.bullets && project.bullets.length > 0 && (
                    <div className="bullet-list" style={{ marginTop: `${6 * scale}px` }}>
                      {project.bullets.map((bullet, bIndex) => (
                        <div key={bIndex} style={{ fontSize: `${9 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${3 * scale}px`, color: '#374151', lineHeight: '1.5' }}>→ {bullet}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Education</h2>
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${8 * scale}px`, padding: `${6 * scale}px`, backgroundColor: '#f9fafb', borderRadius: `${6 * scale}px` }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div className="resume-muted" style={{ fontSize: `${9 * scale}px`, fontWeight: '500', marginTop: `${2 * scale}px` }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div className="resume-muted" style={{ fontSize: `${8 * scale}px`, marginTop: `${2 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div>
            <h2 style={{ fontSize: `${12 * scale}px`, color: accent, marginBottom: `${6 * scale}px`, fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}>Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${12 * scale}px`, padding: `${10 * scale}px`, border: `1px solid #e5e7eb`, borderRadius: `${8 * scale}px`, backgroundColor: '#fafafa', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: `${4 * scale}px` }}>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, fontFamily: 'Poppins, sans-serif' }}>{safeProp(exp, 'title')}</div>
                  <div className="resume-muted" style={{ fontSize: `${10 * scale}px`, fontWeight: '500', marginTop: `${2 * scale}px` }}>{safeProp(exp, 'company')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: `${2 * scale}px ${6 * scale}px`, borderRadius: `${6 * scale}px`, display: 'inline-block', marginTop: `${3 * scale}px`, border: '1px solid rgba(245, 158, 11, 0.2)' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list" style={{ marginTop: `${6 * scale}px` }}>
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${9 * scale}px`, marginLeft: `${8 * scale}px`, marginTop: `${3 * scale}px`, color: '#374151', lineHeight: '1.5' }}>→ {bullet}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    ) : (
      <div className="resume-no-data">
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
          <div style={{ marginBottom: `${12 * scale}px`, textAlign: 'center', padding: `${8 * scale}px`, backgroundColor: '#fafafa', borderRadius: `${8 * scale}px`, border: `1px solid ${accent}20` }}>
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
              <div key={i} className="experience-item" style={{ marginBottom: `${15 * scale}px`, textAlign: 'center', padding: `${8 * scale}px`, border: `1px solid ${accent}20`, borderRadius: `${8 * scale}px`, backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold', color: accent, marginBottom: `${2 * scale}px` }}>{safeProp(exp, 'title')}</div>
                <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontStyle: 'italic', marginBottom: `${2 * scale}px` }}>{safeProp(exp, 'company')}</div>
                <div style={{ fontSize: `${8 * scale}px`, color: '#666', marginBottom: `${4 * scale}px` }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list" style={{ textAlign: 'left', maxWidth: '80%', margin: '0 auto' }}>
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${8 * scale}px`, marginTop: `${2 * scale}px`, color: '#555', paddingLeft: `${15 * scale}px`, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold' }}>•</span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div style={{ marginBottom: `${12 * scale}px` }}>
            <div style={{ textAlign: 'center', marginBottom: `${8 * scale}px` }}>
              <h2 style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: 'bold', fontStyle: 'italic', margin: '0' }}>Projects</h2>
              <div style={{ height: `${1 * scale}px`, width: `${30 * scale}px`, backgroundColor: accent, margin: `${2 * scale}px auto` }}></div>
            </div>
            {userData.resumeData.projects.slice(0, 2).map((project, i) => (
              <div key={i} className="project-item" style={{ marginBottom: `${12 * scale}px`, textAlign: 'center', padding: `${8 * scale}px`, border: `1px solid ${accent}20`, borderRadius: `${8 * scale}px`, backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold', color: accent, marginBottom: `${3 * scale}px` }}>
                  {project.url ? (
                    <a href={project.url} style={{ color: accent, textDecoration: 'none', fontStyle: 'italic' }}>{project.name}</a>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>{project.name}</span>
                  )}
                </div>
                {formatProjectDate(project.start, project.end, project.present) && (
                  <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', fontWeight: '500', marginBottom: `${3 * scale}px` }}>
                    {formatProjectDate(project.start, project.end, project.present)}
                  </div>
                )}
                {project.description && (
                  <p style={{ fontSize: `${8 * scale}px`, color: '#555', marginBottom: `${4 * scale}px`, fontStyle: 'italic', maxWidth: '90%', margin: `0 auto ${4 * scale}px auto` }}>{project.description}</p>
                )}
                {project.bullets && project.bullets.length > 0 && (
                  <div style={{ textAlign: 'left', maxWidth: '85%', margin: '0 auto' }}>
                    {project.bullets.map((bullet, bIndex) => (
                      <div key={bIndex} style={{ fontSize: `${8 * scale}px`, marginTop: `${2 * scale}px`, color: '#555', paddingLeft: `${12 * scale}px`, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold' }}>•</span>
                        {bullet}
                      </div>
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
                    <div className="resume-muted" style={{ fontSize: `${8 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </>
    ) : (
      <div className="resume-no-data">
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const MinimalTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${9 * scale}px`, fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.4', width: '100%', boxSizing: 'border-box' }}>
    {userData ? (
      <>
        <div style={{ marginBottom: `${20 * scale}px` }}>
          <h1 style={{ fontSize: `${18 * scale}px`, fontWeight: '300', color: '#000', margin: '0', letterSpacing: '-0.5px' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <div style={{ fontSize: `${9 * scale}px`, color: '#666', marginTop: `${4 * scale}px` }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} • 
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </div>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${16 * scale}px` }}>
            <p style={{ fontSize: `${10 * scale}px`, color: '#333', margin: '0', lineHeight: '1.6' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div style={{ marginBottom: `${16 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: '600', color: '#000', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase', letterSpacing: '1px' }}>Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${12 * scale}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: `${2 * scale}px` }}>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: '#000' }}>{safeProp(exp, 'title')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                <div style={{ fontSize: `${10 * scale}px`, color: accent, fontWeight: '500', marginBottom: `${4 * scale}px` }}>{safeProp(exp, 'company')}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list">
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${9 * scale}px`, color: '#444', marginBottom: `${2 * scale}px`, paddingLeft: `${8 * scale}px`, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0', color: accent }}>•</span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div style={{ marginBottom: `${16 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: '600', color: '#000', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</h2>
            {userData.resumeData.projects.slice(0, 2).map((project, i) => (
              <div key={i} className="project-item" style={{ marginBottom: `${12 * scale}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: `${2 * scale}px` }}>
                  <div>
                    <div style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: '#000' }}>
                      {project.url ? (
                        <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                      ) : (
                        project.name
                      )}
                    </div>
                    {formatProjectDate(project.start, project.end, project.present) && (
                      <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', fontWeight: '500', marginTop: `${2 * scale}px` }}>
                        {formatProjectDate(project.start, project.end, project.present)}
                      </div>
                    )}
                  </div>
                  {project.demo && (
                    <a href={project.demo} style={{ fontSize: `${9 * scale}px`, color: accent, textDecoration: 'none' }}>Demo</a>
                  )}
                </div>
                {project.description && (
                  <p style={{ fontSize: `${10 * scale}px`, color: '#444', marginBottom: `${4 * scale}px`, lineHeight: '1.5' }}>{project.description}</p>
                )}
                {project.bullets && project.bullets.length > 0 && (
                  <div>
                    {project.bullets.map((bullet, bIndex) => (
                      <div key={bIndex} style={{ fontSize: `${9 * scale}px`, color: '#444', marginBottom: `${2 * scale}px`, paddingLeft: `${8 * scale}px`, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0', color: accent }}>•</span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: `${20 * scale}px` }}>
          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: '600', color: '#000', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${4 * scale}px` }}>
                {userData.resumeData.skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: `${9 * scale}px`, color: '#555', padding: `${2 * scale}px 0`, borderBottom: `1px solid ${accent}20` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: '600', color: '#000', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase', letterSpacing: '1px' }}>Education</h2>
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${8 * scale}px` }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: '600', color: '#000' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#999' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    ) : (
      <div className="resume-no-data">
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const TwoColumnTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '35% 1fr', minHeight: '100vh', fontFamily: 'Arial, sans-serif', fontSize: `${10 * scale}px`, gap: 0 }}>
    {userData ? (
      <>
        {/* Left Sidebar */}
        <div style={{ backgroundColor: accent, color: 'white', padding: `${15 * scale}px` }}>
          <div style={{ marginBottom: `${20 * scale}px` }}>
            <h1 style={{ fontSize: `${18 * scale}px`, fontWeight: 'bold', margin: '0', wordBreak: 'break-word' }}>
              {userData.resumeData?.name || userData.name || 'Your Name'}
            </h1>
            <div style={{ fontSize: `${9 * scale}px`, marginTop: `${8 * scale}px`, opacity: 0.9 }}>
              <div style={{ marginBottom: `${4 * scale}px` }}>{userData.resumeData?.email || userData.email || 'your.email@example.com'}</div>
              <div>{userData.resumeData?.phone || userData.phone || 'Your Phone'}</div>
            </div>
          </div>

          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div style={{ marginBottom: `${20 * scale}px` }}>
              <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase' }}>Skills</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                {userData.resumeData.skills.slice(0, 8).map((skill, i) => (
                  <div key={i} style={{ fontSize: `${9 * scale}px`, padding: `${4 * scale}px 0`, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>{skill}</div>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
            <div style={{ marginBottom: `${20 * scale}px` }}>
              <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase' }}>Projects</h2>
              {userData.resumeData.projects.slice(0, 2).map((project, i) => (
                <div key={i} style={{ marginBottom: `${12 * scale}px`, paddingBottom: `${8 * scale}px`, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold', marginBottom: `${3 * scale}px` }}>
                    {project.url ? (
                      <a href={project.url} style={{ color: 'white', textDecoration: 'none' }}>{project.name}</a>
                    ) : (
                      project.name
                    )}
                  </div>
                  {formatProjectDate(project.start, project.end, project.present) && (
                    <div style={{ fontSize: `${8 * scale}px`, opacity: 0.8, marginBottom: `${3 * scale}px` }}>
                      {formatProjectDate(project.start, project.end, project.present)}
                    </div>
                  )}
                  {project.description && (
                    <p style={{ fontSize: `${8 * scale}px`, opacity: 0.9, marginBottom: `${4 * scale}px`, lineHeight: '1.4' }}>{project.description}</p>
                  )}
                  {project.bullets && project.bullets.length > 0 && (
                    <div>
                      {project.bullets.map((bullet, bIndex) => (
                        <div key={bIndex} style={{ fontSize: `${8 * scale}px`, opacity: 0.8, lineHeight: '1.3', marginBottom: `${2 * scale}px` }}>▸ {bullet}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase' }}>Education</h2>
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${12 * scale}px`, paddingBottom: `${8 * scale}px`, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, opacity: 0.9, marginTop: `${2 * scale}px` }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, opacity: 0.8, marginTop: `${2 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Content */}
        <div style={{ padding: `${15 * scale}px` }}>
          {userData.resumeData?.summary && (
            <div style={{ marginBottom: `${20 * scale}px` }}>
              <h2 style={{ fontSize: `${14 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textTransform: 'uppercase' }}>Professional Summary</h2>
              <p style={{ fontSize: `${10 * scale}px`, lineHeight: '1.6', color: '#333', margin: '0' }}>{userData.resumeData.summary}</p>
            </div>
          )}

          {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${14 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${12 * scale}px 0`, textTransform: 'uppercase' }}>Professional Experience</h2>
              {limitExperience(userData.resumeData.experience).map((exp, i) => (
                <div key={i} className="experience-item" style={{ marginBottom: `${16 * scale}px`, position: 'relative', paddingLeft: `${16 * scale}px` }}>
                  <div style={{ position: 'absolute', left: '0', top: `${6 * scale}px`, width: `${8 * scale}px`, height: `${8 * scale}px`, backgroundColor: accent, borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', left: `${3 * scale}px`, top: `${14 * scale}px`, width: '2px', height: '100%', backgroundColor: `${accent}20` }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: `${4 * scale}px` }}>
                    <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000' }}>{safeProp(exp, 'title')}</div>
                    <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontWeight: '500' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                  </div>
                  <div style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: '600', marginBottom: `${6 * scale}px` }}>{safeProp(exp, 'company')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div className="bullet-list">
                      {exp.bullets.map((bullet, j) => (
                        <div key={j} style={{ fontSize: `${9 * scale}px`, color: '#444', marginBottom: `${3 * scale}px`, paddingLeft: `${12 * scale}px`, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold' }}>▸</span>
                          {bullet}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    ) : (
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '10px' }}>
          No data available. Please generate a resume first.
        </div>
      </div>
    )}
  </div>
);

const ExecutiveTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${15 * scale}px`, fontSize: `${9 * scale}px`, fontFamily: 'Times, serif', lineHeight: '1.4', backgroundColor: '#ffffff', maxWidth: '100%', overflow: 'hidden' }}>
    {userData ? (
      <>
        <div style={{ textAlign: 'center', marginBottom: `${25 * scale}px`, borderBottom: `${3 * scale}px solid ${accent}`, paddingBottom: `${15 * scale}px` }}>
          <h1 style={{ fontSize: `${16 * scale}px`, fontWeight: 'bold', color: '#000', margin: '0', letterSpacing: '1px' }}>
            {userData.resumeData?.name || userData.name || 'YOUR NAME'}
          </h1>
          <div style={{ fontSize: `${9 * scale}px`, color: '#666', marginTop: `${6 * scale}px`, letterSpacing: '0.5px' }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} | 
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </div>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${20 * scale}px` }}>
            <h2 style={{ fontSize: `${14 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textAlign: 'center', letterSpacing: '1px' }}>EXECUTIVE SUMMARY</h2>
            <div style={{ borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, padding: `${12 * scale}px 0` }}>
              <p style={{ fontSize: `${11 * scale}px`, textAlign: 'center', fontStyle: 'italic', margin: '0', lineHeight: '1.6' }}>{userData.resumeData.summary}</p>
            </div>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div style={{ marginBottom: `${20 * scale}px` }}>
            <h2 style={{ fontSize: `${14 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${12 * scale}px 0`, textAlign: 'center', letterSpacing: '1px' }}>PROFESSIONAL EXPERIENCE</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} className="experience-item" style={{ marginBottom: `${15 * scale}px`, padding: `${12 * scale}px`, border: `1px solid #e0e0e0`, backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${6 * scale}px`, borderBottom: `1px solid ${accent}40`, paddingBottom: `${4 * scale}px` }}>
                  <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>{safeProp(exp, 'title')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontWeight: 'bold' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                <div style={{ fontSize: `${11 * scale}px`, color: accent, fontWeight: 'bold', marginBottom: `${6 * scale}px`, fontStyle: 'italic' }}>{safeProp(exp, 'company')}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div className="bullet-list">
                    {exp.bullets.map((bullet, j) => (
                      <div key={j} style={{ fontSize: `${9 * scale}px`, color: '#333', marginBottom: `${3 * scale}px`, paddingLeft: `${15 * scale}px`, position: 'relative', textAlign: 'justify' }}>
                        <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold', fontSize: `${12 * scale}px` }}>►</span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div style={{ marginBottom: `${20 * scale}px` }}>
            <h2 style={{ fontSize: `${14 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${12 * scale}px 0`, textAlign: 'center', letterSpacing: '1px' }}>KEY PROJECTS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${15 * scale}px` }}>
              {userData.resumeData.projects.slice(0, 2).map((project, i) => (
                <div key={i} className="project-item" style={{ padding: `${12 * scale}px`, border: `2px solid ${accent}`, backgroundColor: '#f8f9fa' }}>
                  <div style={{ textAlign: 'center', marginBottom: `${8 * scale}px` }}>
                    <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000', margin: `0 0 ${4 * scale}px 0`, textTransform: 'uppercase' }}>
                      {project.url ? (
                        <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                      ) : (
                        project.name
                      )}
                    </h3>
                    {formatProjectDate(project.start, project.end, project.present) && (
                      <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', fontWeight: '500', marginBottom: `${3 * scale}px` }}>
                        {formatProjectDate(project.start, project.end, project.present)}
                      </div>
                    )}
                    {project.demo && (
                      <a href={project.demo} style={{ fontSize: `${8 * scale}px`, color: accent, textDecoration: 'none', fontWeight: 'bold' }}>VIEW DEMO</a>
                    )}
                  </div>
                  {project.description && (
                    <p style={{ fontSize: `${9 * scale}px`, color: '#333', marginBottom: `${6 * scale}px`, textAlign: 'center', fontStyle: 'italic', lineHeight: '1.4' }}>{project.description}</p>
                  )}
                  {project.bullets && project.bullets.length > 0 && (
                    <div style={{ textAlign: 'left' }}>
                      {project.bullets.map((bullet, bIndex) => (
                        <div key={bIndex} style={{ fontSize: `${8 * scale}px`, color: '#333', marginBottom: `${2 * scale}px`, paddingLeft: `${12 * scale}px`, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold', fontSize: `${10 * scale}px` }}>►</span>
                          {bullet}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${20 * scale}px` }}>
          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div style={{ padding: `${12 * scale}px`, border: `2px solid ${accent}`, backgroundColor: '#f8f9fa' }}>
              <h2 style={{ fontSize: `${12 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textAlign: 'center', letterSpacing: '1px' }}>CORE COMPETENCIES</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${4 * scale}px` }}>
                {userData.resumeData.skills.slice(0, 8).map((skill, i) => (
                  <div key={i} style={{ fontSize: `${9 * scale}px`, color: '#333', padding: `${3 * scale}px`, textAlign: 'center', backgroundColor: 'white', border: `1px solid ${accent}40` }}>{skill}</div>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div style={{ padding: `${12 * scale}px`, border: `2px solid ${accent}`, backgroundColor: '#f8f9fa' }}>
              <h2 style={{ fontSize: `${12 * scale}px`, color: accent, fontWeight: 'bold', margin: `0 0 ${8 * scale}px 0`, textAlign: 'center', letterSpacing: '1px' }}>EDUCATION</h2>
              {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${8 * scale}px`, padding: `${6 * scale}px`, backgroundColor: 'white', border: `1px solid ${accent}40`, textAlign: 'center' }}>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: 'bold', color: '#000' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ fontSize: `${9 * scale}px`, color: accent, fontWeight: '600', marginTop: `${2 * scale}px` }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ fontSize: `${8 * scale}px`, color: '#666', marginTop: `${2 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    ) : (
      <div className="resume-no-data">
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const TechTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${16 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: '1.5', backgroundColor: '#ffffff' }}>
    {userData ? (
      <>
        {/* Header with colored background */}
        <div style={{ backgroundColor: `${accent}15`, padding: `${20 * scale}px`, marginBottom: `${20 * scale}px`, borderRadius: `${12 * scale}px`, border: `1px solid ${accent}30` }}>
          <h1 style={{ fontSize: `${20 * scale}px`, fontWeight: '700', color: accent, margin: '0', letterSpacing: '-0.025em' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${12 * scale}px`, marginTop: `${8 * scale}px`, fontSize: `${9 * scale}px`, color: '#6b7280' }}>
            <span>{userData.resumeData?.email || userData.email || 'your.email@example.com'}</span>
            <span>•</span>
            <span>{userData.resumeData?.phone || userData.phone || 'Your Phone'}</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: `${24 * scale}px` }}>
          {/* Main Content */}
          <div>
            {userData.resumeData?.summary && (
              <div style={{ marginBottom: `${20 * scale}px` }}>
                <h2 style={{ fontSize: `${14 * scale}px`, fontWeight: '600', color: '#1f2937', marginBottom: `${8 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${accent}`, paddingBottom: `${4 * scale}px` }}>About</h2>
                <p style={{ fontSize: `${10 * scale}px`, lineHeight: '1.6', color: '#374151', margin: '0' }}>{userData.resumeData.summary}</p>
              </div>
            )}

            {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
              <div style={{ marginBottom: `${20 * scale}px` }}>
                <h2 style={{ fontSize: `${14 * scale}px`, fontWeight: '600', color: '#1f2937', marginBottom: `${8 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${accent}`, paddingBottom: `${4 * scale}px` }}>Experience</h2>
                {limitExperience(userData.resumeData.experience).map((exp, i) => (
                  <div key={i} style={{ marginBottom: `${16 * scale}px`, paddingLeft: `${16 * scale}px`, borderLeft: `3px solid ${accent}20`, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-6px', top: `${6 * scale}px`, width: `${10 * scale}px`, height: `${10 * scale}px`, backgroundColor: accent, borderRadius: '50%' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: `${4 * scale}px` }}>
                      <h3 style={{ fontSize: `${12 * scale}px`, fontWeight: '600', color: '#1f2937', margin: '0' }}>{safeProp(exp, 'title')}</h3>
                      <span style={{ fontSize: `${9 * scale}px`, color: '#6b7280', fontWeight: '500' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</span>
                    </div>
                    <p style={{ fontSize: `${10 * scale}px`, color: accent, fontWeight: '500', marginBottom: `${6 * scale}px`, margin: '0' }}>{safeProp(exp, 'company')}</p>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: `${6 * scale}px 0 0 0`, padding: '0', listStyle: 'none' }}>
                        {exp.bullets.map((bullet, j) => (
                          <li key={j} style={{ fontSize: `${9 * scale}px`, color: '#374151', marginBottom: `${3 * scale}px`, paddingLeft: `${16 * scale}px`, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '0', color: accent, fontWeight: 'bold' }}>▶</span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
              <div>
                <h2 style={{ fontSize: `${14 * scale}px`, fontWeight: '600', color: '#1f2937', marginBottom: `${8 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${accent}`, paddingBottom: `${4 * scale}px` }}>Projects</h2>
                {userData.resumeData.projects.slice(0, 3).map((project, i) => (
                  <div key={i} style={{ marginBottom: `${12 * scale}px`, padding: `${12 * scale}px`, backgroundColor: '#f8fafc', borderRadius: `${8 * scale}px`, border: `1px solid ${accent}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${4 * scale}px` }}>
                      <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, margin: '0' }}>
                        {project.url ? (
                          <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                        ) : (
                          project.name
                        )}
                      </h3>
                      {project.demo && (
                        <a href={project.demo} style={{ fontSize: `${8 * scale}px`, color: accent, textDecoration: 'none', fontWeight: '500' }}>Demo →</a>
                      )}
                    </div>
                    {project.description && (
                      <p style={{ fontSize: `${9 * scale}px`, color: '#374151', margin: `0 0 ${6 * scale}px 0`, lineHeight: '1.5' }}>{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
              <div style={{ marginBottom: `${20 * scale}px` }}>
                <h2 style={{ fontSize: `${14 * scale}px`, fontWeight: '600', color: '#1f2937', marginBottom: `${8 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px` }}>
                  {userData.resumeData.skills.map((skill, i) => (
                    <div key={i} style={{ padding: `${8 * scale}px ${12 * scale}px`, backgroundColor: `${accent}10`, borderRadius: `${6 * scale}px`, fontSize: `${9 * scale}px`, fontWeight: '500', color: accent, border: `1px solid ${accent}30` }}>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
              <div>
                <h2 style={{ fontSize: `${14 * scale}px`, fontWeight: '600', color: '#1f2937', marginBottom: `${8 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</h2>
                {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
                  <div key={i} style={{ marginBottom: `${12 * scale}px`, padding: `${12 * scale}px`, backgroundColor: '#f8fafc', borderRadius: `${8 * scale}px`, border: `1px solid ${accent}20` }}>
                    <h3 style={{ fontSize: `${10 * scale}px`, fontWeight: '600', color: '#1f2937', margin: '0' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</h3>
                    <p style={{ fontSize: `${9 * scale}px`, color: accent, marginTop: `${2 * scale}px`, margin: '0' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</p>
                    <p style={{ fontSize: `${8 * scale}px`, color: '#6b7280', marginTop: `${2 * scale}px`, margin: '0' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    ) : (
      <div style={{ textAlign: 'center', color: '#6b7280', padding: `${40 * scale}px` }}>
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const CompactTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${12 * scale}px`, fontSize: `${9 * scale}px`, fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.4', maxWidth: '100%' }}>
    {userData ? (
      <>
        {/* Compact header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: `${8 * scale}px`, marginBottom: `${12 * scale}px`, borderBottom: `1px solid ${accent}` }}>
          <div>
            <h1 style={{ fontSize: `${16 * scale}px`, fontWeight: '700', color: '#000', margin: '0', letterSpacing: '-0.02em' }}>
              {userData.resumeData?.name || userData.name || 'Your Name'}
            </h1>
          </div>
          <div style={{ textAlign: 'right', fontSize: `${8 * scale}px`, color: '#6b7280' }}>
            <div>{userData.resumeData?.email || userData.email || 'your.email@example.com'}</div>
            <div>{userData.resumeData?.phone || userData.phone || 'Your Phone'}</div>
          </div>
        </div>

        {/* Summary in compact format */}
        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${12 * scale}px`, padding: `${8 * scale}px`, backgroundColor: '#f8fafc', borderLeft: `3px solid ${accent}`, fontSize: `${9 * scale}px`, fontStyle: 'italic' }}>
            {userData.resumeData.summary}
          </div>
        )}

        {/* Experience with compact layout */}
        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div style={{ marginBottom: `${12 * scale}px` }}>
            <h2 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, marginBottom: `${6 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} style={{ marginBottom: `${10 * scale}px`, display: 'grid', gridTemplateColumns: '1fr auto', gap: `${8 * scale}px`, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: `${10 * scale}px`, fontWeight: '600', color: '#000' }}>{safeProp(exp, 'title')} • {safeProp(exp, 'company')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: `${3 * scale}px` }}>
                      {exp.bullets.slice(0, 2).map((bullet, j) => (
                        <div key={j} style={{ fontSize: `${8 * scale}px`, color: '#374151', marginBottom: `${2 * scale}px` }}>• {bullet}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: `${8 * scale}px`, color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatDate(exp.start)} - {formatDate(exp.end)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills and Education in row layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: `${16 * scale}px` }}>
          {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, marginBottom: `${6 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${3 * scale}px` }}>
                {userData.resumeData.skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: `${8 * scale}px`, padding: `${2 * scale}px ${6 * scale}px`, backgroundColor: `${accent}15`, color: accent, borderRadius: `${4 * scale}px`, fontWeight: '500' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, marginBottom: `${6 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Education</h2>
              {limitEducation(userData.resumeData.education, 1).map((edu, i) => (
                <div key={i} style={{ fontSize: `${9 * scale}px` }}>
                  <div style={{ fontWeight: '600', color: '#000' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style={{ color: '#6b7280', fontSize: `${8 * scale}px` }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</div>
                  <div style={{ color: '#6b7280', fontSize: `${7 * scale}px` }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects in compact format */}
        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div style={{ marginTop: `${12 * scale}px` }}>
            <h2 style={{ fontSize: `${11 * scale}px`, fontWeight: '600', color: accent, marginBottom: `${6 * scale}px`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${8 * scale}px` }}>
              {userData.resumeData.projects.slice(0, 2).map((project, i) => (
                <div key={i} style={{ fontSize: `${8 * scale}px`, padding: `${6 * scale}px`, backgroundColor: '#f8fafc', borderRadius: `${4 * scale}px` }}>
                  <div style={{ fontWeight: '600', color: accent, marginBottom: `${2 * scale}px` }}>
                    {project.url ? (
                      <a href={project.url} style={{ color: accent, textDecoration: 'none' }}>{project.name}</a>
                    ) : (
                      project.name
                    )}
                  </div>
                  {project.description && (
                    <div style={{ color: '#374151', lineHeight: '1.3' }}>{project.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      <div style={{ textAlign: 'center', color: '#6b7280', padding: `${40 * scale}px` }}>
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const ClassicTemplate = ({ userData, accent, scale = 1 }) => (
  <div style={{ padding: `${16 * scale}px`, fontSize: `${10 * scale}px`, fontFamily: 'Times, serif', lineHeight: '1.6', backgroundColor: '#ffffff' }}>
    {userData ? (
      <>
        {/* Traditional header */}
        <div style={{ textAlign: 'center', marginBottom: `${20 * scale}px`, paddingBottom: `${12 * scale}px`, borderBottom: `2px solid #000` }}>
          <h1 style={{ fontSize: `${20 * scale}px`, fontWeight: 'bold', color: '#000', margin: '0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {userData.resumeData?.name || userData.name || 'Your Name'}
          </h1>
          <div style={{ marginTop: `${8 * scale}px`, fontSize: `${9 * scale}px`, color: '#333' }}>
            {userData.resumeData?.email || userData.email || 'your.email@example.com'} |
            {userData.resumeData?.phone || userData.phone || 'Your Phone'}
          </div>
        </div>

        {userData.resumeData?.summary && (
          <div style={{ marginBottom: `${18 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', marginBottom: `${8 * scale}px`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objective</h2>
            <p style={{ fontSize: `${10 * scale}px`, textAlign: 'justify', lineHeight: '1.6', color: '#333', fontStyle: 'italic', margin: '0' }}>{userData.resumeData.summary}</p>
          </div>
        )}

        {userData.resumeData?.experience && userData.resumeData.experience.length > 0 && (
          <div style={{ marginBottom: `${18 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', marginBottom: `${10 * scale}px`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: `${4 * scale}px` }}>Professional Experience</h2>
            {limitExperience(userData.resumeData.experience).map((exp, i) => (
              <div key={i} style={{ marginBottom: `${14 * scale}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: `${4 * scale}px` }}>
                  <div>
                    <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000', margin: '0' }}>{safeProp(exp, 'title')}</h3>
                    <p style={{ fontSize: `${10 * scale}px`, color: '#333', fontStyle: 'italic', margin: '0' }}>{safeProp(exp, 'company')}</p>
                  </div>
                  <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontWeight: 'bold' }}>{formatDate(exp.start)} - {formatDate(exp.end)}</div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul style={{ margin: `${6 * scale}px 0 0 ${20 * scale}px`, padding: '0' }}>
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} style={{ fontSize: `${9 * scale}px`, color: '#333', marginBottom: `${3 * scale}px`, lineHeight: '1.5' }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.education && userData.resumeData.education.length > 0 && (
          <div style={{ marginBottom: `${18 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', marginBottom: `${10 * scale}px`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: `${4 * scale}px` }}>Education</h2>
            {limitEducation(userData.resumeData.education, 2).map((edu, i) => (
              <div key={i} style={{ marginBottom: `${10 * scale}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000', margin: '0' }}>{safeProp(edu, 'area') || safeProp(edu, 'degree')}</h3>
                  <p style={{ fontSize: `${10 * scale}px`, color: '#333', fontStyle: 'italic', margin: '0' }}>{safeProp(edu, 'institution') || safeProp(edu, 'school')}</p>
                </div>
                <div style={{ fontSize: `${9 * scale}px`, color: '#666', fontWeight: 'bold' }}>{formatDate(edu.start)} - {formatDate(edu.end)}</div>
              </div>
            ))}
          </div>
        )}

        {userData.resumeData?.skills && userData.resumeData.skills.length > 0 && (
          <div style={{ marginBottom: `${18 * scale}px` }}>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', marginBottom: `${10 * scale}px`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: `${4 * scale}px` }}>Technical Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${8 * scale}px`, justifyContent: 'center' }}>
              {userData.resumeData.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: `${9 * scale}px`, fontWeight: 'bold', color: '#333' }}>
                  {skill}{i < userData.resumeData.skills.length - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {userData.resumeData?.projects && userData.resumeData.projects.length > 0 && (
          <div>
            <h2 style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', color: '#000', marginBottom: `${10 * scale}px`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: `${4 * scale}px` }}>Notable Projects</h2>
            {userData.resumeData.projects.slice(0, 2).map((project, i) => (
              <div key={i} style={{ marginBottom: `${12 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold', color: '#000', margin: '0' }}>
                  {project.url ? (
                    <a href={project.url} style={{ color: '#000', textDecoration: 'underline' }}>{project.name}</a>
                  ) : (
                    project.name
                  )}
                </h3>
                {project.description && (
                  <p style={{ fontSize: `${9 * scale}px`, color: '#333', margin: `${4 * scale}px 0`, textAlign: 'justify', lineHeight: '1.5' }}>{project.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    ) : (
      <div style={{ textAlign: 'center', color: '#666', padding: `${40 * scale}px` }}>
        No data available. Please generate a resume first.
      </div>
    )}
  </div>
);

const ATSTemplate = ({ userData, scale = 1 }) => {
  // For ATS mode, data comes directly from userData (not nested under resumeData)
  // For generated resumes, data might be under userData.resumeData
  const data = userData?.resumeData || userData;
  const headers = data?.sectionHeaders || {};

  return (
    <div style={{
      padding: `${16 * scale}px`,
      fontSize: `${11 * scale}px`,
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.4',
      color: '#000000',
      backgroundColor: '#ffffff',
      maxWidth: '100%'
    }}>
      {data ? (
        <>
          {/* Header - Always show contact info */}
          <div style={{ marginBottom: `${16 * scale}px`, textAlign: 'center' }}>
            <div style={{ fontSize: `${16 * scale}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` }}>
              {data.name || 'Your Name'}
            </div>
            <div style={{ fontSize: `${10 * scale}px` }}>
              {data.email || 'your.email@example.com'} | {data.phone || 'Your Phone'}
            </div>
            {data.location && (
              <div style={{ fontSize: `${10 * scale}px` }}>
                {data.location}
              </div>
            )}
          </div>

          {/* Professional Summary - Show missing header indicator if content exists but no header */}
          {data.summary && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              {headers.hasSummary ? (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px` }}>
                  PROFESSIONAL SUMMARY
                </div>
              ) : (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                  ⚠️ MISSING SUMMARY HEADER
                </div>
              )}
              <div style={{ fontSize: `${11 * scale}px`, textAlign: 'justify' }}>
                {data.summary}
              </div>
            </div>
          )}

          {/* Missing Summary Section - Show if no summary detected */}
          {(!data.summary) && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                ⚠️ MISSING PROFESSIONAL SUMMARY SECTION
              </div>
              <div style={{ fontSize: `${10 * scale}px`, color: '#6b7280', fontStyle: 'italic' }}>
                Consider adding a professional summary to highlight your key qualifications and career objectives.
              </div>
            </div>
          )}

          {/* Skills - Show missing header indicator if content exists but no header */}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              {headers.hasSkills ? (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px` }}>
                  CORE COMPETENCIES
                </div>
              ) : (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                  ⚠️ MISSING SKILLS HEADER
                </div>
              )}
              <div style={{ fontSize: `${11 * scale}px` }}>
                {data.skills.join(' • ')}
              </div>
            </div>
          )}

          {/* Experience - Show missing header indicator if content exists but no header */}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              {headers.hasExperience ? (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px` }}>
                  PROFESSIONAL EXPERIENCE
                </div>
              ) : (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                  ⚠️ MISSING PROFESSIONAL EXPERIENCE HEADER
                </div>
              )}
              {limitExperience(data.experience).map((exp, i) => (
                <div key={i} style={{ marginBottom: `${12 * scale}px` }}>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold' }}>
                    {safeProp(exp, 'title')}
                  </div>
                  <div style={{ fontSize: `${11 * scale}px` }}>
                    {safeProp(exp, 'company')} | {formatDate(exp.start)} - {formatDate(exp.end)}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: `${4 * scale}px` }}>
                      {exp.bullets.map((bullet, j) => (
                        <div key={j} style={{ fontSize: `${10 * scale}px`, marginBottom: `${2 * scale}px` }}>
                          • {bullet}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Missing Skills Section - Show if no skills detected */}
          {(!data.skills || data.skills.length === 0) && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                ⚠️ MISSING SKILLS SECTION
              </div>
              <div style={{ fontSize: `${10 * scale}px`, color: '#6b7280', fontStyle: 'italic' }}>
                Consider adding a skills section to highlight your technical and professional competencies.
              </div>
            </div>
          )}

          {/* Missing Education Section - Show if no education detected */}
          {(!data.education || data.education.length === 0) && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                ⚠️ MISSING EDUCATION SECTION
              </div>
              <div style={{ fontSize: `${10 * scale}px`, color: '#6b7280', fontStyle: 'italic' }}>
                Consider adding an education section with your academic qualifications and certifications.
              </div>
            </div>
          )}

          {/* Education - Show missing header indicator if content exists but no header */}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              {headers.hasEducation ? (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px` }}>
                  EDUCATION
                </div>
              ) : (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                  ⚠️ MISSING EDUCATION HEADER
                </div>
              )}
              {limitEducation(data.education, 3).map((edu, i) => (
                <div key={i} style={{ marginBottom: `${8 * scale}px` }}>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold' }}>
                    {safeProp(edu, 'area') || safeProp(edu, 'degree')}
                  </div>
                  <div style={{ fontSize: `${10 * scale}px` }}>
                    {safeProp(edu, 'institution') || safeProp(edu, 'school')} | {formatDate(edu.start)} - {formatDate(edu.end)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missing Projects Section - Show if no projects detected */}
          {(!data.projects || data.projects.length === 0) && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                ⚠️ MISSING PROJECTS SECTION
              </div>
              <div style={{ fontSize: `${10 * scale}px`, color: '#6b7280', fontStyle: 'italic' }}>
                Consider adding a projects section to showcase your personal work and technical achievements.
              </div>
            </div>
          )}

          {/* Projects - Show missing header indicator if content exists but no header */}
          {data.projects && data.projects.length > 0 && (
            <div style={{ marginBottom: `${16 * scale}px` }}>
              {headers.hasProjects ? (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px` }}>
                  PROJECTS
                </div>
              ) : (
                <div style={{ fontSize: `${12 * scale}px`, fontWeight: 'bold', marginBottom: `${6 * scale}px`, color: '#dc2626', backgroundColor: '#fef2f2', padding: `${4 * scale}px`, border: '1px dashed #dc2626' }}>
                  ⚠️ MISSING PROJECTS HEADER
                </div>
              )}
              {data.projects.slice(0, 3).map((project, i) => (
                <div key={i} style={{ marginBottom: `${8 * scale}px` }}>
                  <div style={{ fontSize: `${11 * scale}px`, fontWeight: 'bold' }}>
                    {project.name}
                  </div>
                  {project.description && (
                    <div style={{ fontSize: `${10 * scale}px`, marginTop: `${2 * scale}px` }}>
                      {project.description}
                    </div>
                  )}
                  {project.url && (
                    <div style={{ fontSize: `${10 * scale}px` }}>
                      URL: {project.url}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: `${40 * scale}px` }}>
          No data available. Please generate a resume first.
        </div>
      )}
    </div>
  );
};

export default function ResumeTemplate({ userData, template, accent, isPDF = false, userPlan = 'standard' }) {
  const scale = isPDF ? 1.75 : 1; // Scale up for PDF

  // Define Pro-only templates
  const proOnlyTemplates = ['executive', 'tech', 'compact', 'classic'];
  const isProUser = String(userPlan || '').startsWith('pro');

  // Standard users can use most templates but not Pro-only ones
  // Pro users can use all templates
  let effectiveTemplate = template;
  if (!isProUser && proOnlyTemplates.includes(template)) {
    effectiveTemplate = 'professional'; // Fallback to professional for non-Pro users
  }

  const effectiveAccent = accent || '#6b7280'; // Use provided accent or default
  
  switch (effectiveTemplate) {
    case 'modern':
      return <ModernTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'creative':
      return <CreativeTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'minimal':
      return <MinimalTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'two-column':
      return <TwoColumnTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'executive':
      return <ExecutiveTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'tech':
      return <TechTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'compact':
      return <CompactTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'classic':
      return <ClassicTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
    case 'ats':
      return <ATSTemplate userData={userData} scale={scale} />;
    case 'professional':
    default:
      return <ProfessionalTemplate userData={userData} accent={effectiveAccent} scale={scale} />;
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
