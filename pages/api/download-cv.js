// Helper function to safely get values and handle null/undefined
function safeProp(obj, path, fallback = '') {
  const value = path.split('.').reduce((o, p) => o && o[p], obj);
  return (value === null || value === undefined || value === 'null' || value === 'undefined') ? fallback : value;
}

import puppeteer from 'puppeteer';
import { limitExperience, limitEducation } from '../../lib/renderUtils';

export default async function handler(req, res) {
  const { template, accent, data } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Generate HTML that matches the preview exactly
  const html = generateCVHTML(data, template, accent);

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

function generateCVHTML(userData, template, accent) {
  // Safe property getter with null/undefined handling
  const getName = () => safeProp(userData, 'resumeData.name') || safeProp(userData, 'name') || 'Your Name';
  const getEmail = () => safeProp(userData, 'resumeData.email') || safeProp(userData, 'email') || 'email@example.com';
  const getPhone = () => safeProp(userData, 'resumeData.phone') || safeProp(userData, 'phone') || 'Phone';
  const getSummary = () => safeProp(userData, 'resumeData.summary');
  const getSkills = () => userData?.resumeData?.skills?.filter(skill => skill && skill.trim()) || [];
  const getExperience = (max = 2, bulletMax = 2) =>
    limitExperience(userData?.resumeData?.experience, max, bulletMax);
  const getEducation = (max = 2) =>
    limitEducation(userData?.resumeData?.education, max);

  const formatDate = (date) => {
    if (!date || date === 'null' || date === 'undefined') return 'Present';
    return date.toString().trim();
  };

  const baseStyles = `
    <style>
      @page {
        margin: 0;
        size: A4;
      }
      body {
        margin: 0;
        padding: 15px;
        font-size: 10px;
        line-height: 1.4;
        font-family: Arial, sans-serif;
        color: #333;
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

  let templateHTML = '';
  
  if (template === 'professional') {
    templateHTML = `
      <div style="border-bottom: 2px solid ${accent}; padding-bottom: 8px; margin-bottom: 12px;">
        <h1 style="font-size: 16px; margin-bottom: 2px; color: ${accent}; font-weight: bold;">
          ${getName()}
        </h1>
        <p style="font-size: 9px; color: #666;">
          ${getEmail()} • ${getPhone()}
        </p>
      </div>
      
      ${getSummary() ? `
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Professional Summary</h2>
          <p style="font-size: 9px; text-align: justify;">${getSummary()}</p>
        </div>
      ` : ''}

      ${getSkills().length > 0 ? `
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Core Competencies</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${getSkills().map(skill => `<span style="font-size: 8px; padding: 2px 6px; background-color: #f0f0f0; border-radius: 3px;">${skill}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${getExperience().length > 0 ? `
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Professional Experience</h2>
          ${getExperience().map(exp => `
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div>
                  <div style="font-size: 10px; font-weight: bold;">${safeProp(exp, 'title')}</div>
                  <div style="font-size: 9px; color: #666;">${safeProp(exp, 'company')}</div>
                </div>
                <div style="font-size: 8px; color: #666;">${formatDate(exp.start)} - ${formatDate(exp.end)}</div>
              </div>
              ${exp.bullets && exp.bullets.length > 0 ? exp.bullets.map(bullet => `<div style="font-size: 8px; margin-left: 8px; margin-top: 2px;">▪ ${bullet}</div>`).join('') : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${getEducation().length > 0 ? `
        <div>
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold; text-transform: uppercase;">Education</h2>
          ${getEducation(2).map(edu => `
            <div style="margin-bottom: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <div style="font-size: 9px; font-weight: bold;">${safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                  <div style="font-size: 8px; color: #666;">${safeProp(edu, 'institution')}</div>
                </div>
                <div style="font-size: 8px; color: #666;">${formatDate(edu.start)} - ${formatDate(edu.end)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } else if (template === 'modern') {
    templateHTML = `
      <div style="background: linear-gradient(135deg, ${accent}20, ${accent}10); padding: 12px; margin-bottom: 12px; border-radius: 8px; font-family: Helvetica, sans-serif;">
        <h1 style="font-size: 16px; margin-bottom: 2px; color: ${accent}; font-weight: bold;">
          ${getName()}
        </h1>
        <p style="font-size: 9px; color: #666;">
          ${getEmail()} • ${getPhone()}
        </p>
      </div>
      
      ${getSummary() ? `
        <div style="margin-bottom: 12px; padding: 8px; background-color: #f8f9fa; border-left: 4px solid ${accent}; border-radius: 4px;">
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold;">About</h2>
          <p style="font-size: 9px;">${getSummary()}</p>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        ${getSkills().length > 0 ? `
          <div>
            <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold;">Skills</h2>
            ${getSkills().slice(0, 6).map(skill => `<div style="font-size: 8px; margin-bottom: 2px; padding: 2px; background-color: #f0f0f0;">${skill}</div>`).join('')}
          </div>
        ` : ''}
        
        ${getEducation().length > 0 ? `
          <div>
            <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold;">Education</h2>
          ${getEducation(2).map(edu => `
              <div style="margin-bottom: 6px;">
                <div style="font-size: 9px; font-weight: bold;">${safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                <div style="font-size: 8px; color: #666;">${safeProp(edu, 'institution')}</div>
                <div style="font-size: 8px; color: #666;">${formatDate(edu.start)} - ${formatDate(edu.end)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      ${getExperience().length > 0 ? `
        <div>
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold;">Experience</h2>
      ${getExperience().map(exp => `
            <div style="margin-bottom: 10px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <div style="font-size: 10px; font-weight: bold; color: ${accent};">${safeProp(exp, 'title')}</div>
                <div style="font-size: 8px; color: #666; background-color: #f0f0f0; padding: 1px 4px; border-radius: 2px;">${formatDate(exp.start)} - ${formatDate(exp.end)}</div>
              </div>
              <div style="font-size: 9px; color: #666; margin-bottom: 3px;">${safeProp(exp, 'company')}</div>
              ${exp.bullets && exp.bullets.length > 0 ? exp.bullets.map(bullet => `<div style="font-size: 8px; margin-left: 8px; margin-top: 2px;">→ ${bullet}</div>`).join('') : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } else { // creative template
    templateHTML = `
      <div style="text-align: center; margin-bottom: 15px; font-family: Georgia, serif;">
        <h1 style="font-size: 18px; margin-bottom: 4px; color: ${accent}; font-weight: bold; letter-spacing: 1px;">
          ${getName()}
        </h1>
        <div style="height: 2px; width: 40px; background-color: ${accent}; margin: 4px auto;"></div>
        <p style="font-size: 9px; color: #666; font-style: italic;">
          ${getEmail()} • ${getPhone()}
        </p>
      </div>
      
      ${getSummary() ? `
        <div style="margin-bottom: 12px; text-align: center;">
          <h2 style="font-size: 11px; color: ${accent}; margin-bottom: 4px; font-weight: bold; font-style: italic;">Profile</h2>
          <p style="font-size: 9px; font-style: italic; max-width: 80%; margin: 0 auto;">${getSummary()}</p>
        </div>
      ` : ''}

      ${getExperience().length > 0 ? `
        <div style="margin-bottom: 12px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <h2 style="font-size: 11px; color: ${accent}; font-weight: bold; font-style: italic; margin: 0;">Experience</h2>
            <div style="height: 1px; width: 30px; background-color: ${accent}; margin: 2px auto;"></div>
          </div>
          ${getExperience().map(exp => `
            <div style="margin-bottom: 10px; position: relative; padding-left: 12px;">
              <div style="position: absolute; left: 0; top: 2px; width: 4px; height: 4px; background-color: ${accent}; border-radius: 50%;"></div>
              <div style="font-size: 10px; font-weight: bold; color: ${accent};">${safeProp(exp, 'title')}</div>
              <div style="font-size: 9px; color: #666; font-style: italic;">${safeProp(exp, 'company')} • ${formatDate(exp.start)} - ${formatDate(exp.end)}</div>
              ${exp.bullets && exp.bullets.length > 0 ? exp.bullets.map(bullet => `<div style="font-size: 8px; margin-top: 2px; color: #555;">• ${bullet}</div>`).join('') : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; gap: 12px;">
        ${getSkills().length > 0 ? `
          <div style="flex: 1; text-align: center;">
            <div style="margin-bottom: 6px;">
              <h2 style="font-size: 11px; color: ${accent}; font-weight: bold; font-style: italic; margin: 0;">Skills</h2>
              <div style="height: 1px; width: 20px; background-color: ${accent}; margin: 2px auto;"></div>
            </div>
            <div>
              ${getSkills().slice(0, 6).map((skill, i) => `<span style="font-size: 8px; color: ${accent}; font-weight: bold;">${skill}${i < getSkills().slice(0, 6).length - 1 ? ' • ' : ''}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        
        ${getEducation().length > 0 ? `
          <div style="flex: 1; text-align: center;">
            <div style="margin-bottom: 6px;">
              <h2 style="font-size: 11px; color: ${accent}; font-weight: bold; font-style: italic; margin: 0;">Education</h2>
              <div style="height: 1px; width: 20px; background-color: ${accent}; margin: 2px auto;"></div>
            </div>
            ${getEducation(1).map(edu => `
              <div>
                <div style="font-size: 9px; font-weight: bold;">${safeProp(edu, 'area') || safeProp(edu, 'degree')}</div>
                <div style="font-size: 8px; color: #666; font-style: italic;">${safeProp(edu, 'institution')}</div>
                <div style="font-size: 8px; color: #666;">${formatDate(edu.start)} - ${formatDate(edu.end)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resume</title>
      ${baseStyles}
    </head>
    <body class="a4-outer">
      <div class="a4-scope">
        ${templateHTML}
      </div>
    </body>
    </html>
  `;
}