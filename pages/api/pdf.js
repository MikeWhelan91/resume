import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { getPDFTemplate, getAccentColor } from '../../lib/pdf-templates';
import { toTemplateModel } from '../../lib/templateModel';

export default async function handler(req, res) {
  try {
    const { 
      template: templateId = 'compact-ats', 
      accent = '#333333', 
      density = 'normal', 
      ats = '0' 
    } = req.query;

    // Get data from cookie
    const result = JSON.parse(req.cookies.resumeResult || '{}');
    
    console.log('CV PDF Debug - Full result keys:', Object.keys(result));
    console.log('CV PDF Debug - resumeData exists:', !!result?.resumeData);
    
    const resumeData = result?.resumeData || result || {};
    
    console.log('CV PDF Debug - resumeData keys:', Object.keys(resumeData));
    console.log('CV PDF Debug - name:', resumeData.name);
    console.log('CV PDF Debug - experience length:', resumeData.experience?.length);
    
    // Convert to template model (resume, not cover letter)
    const data = toTemplateModel(resumeData, { 
      ats: ats === '1', 
      density, 
      isCoverLetter: false 
    });
    
    console.log('CV PDF Debug - processed data keys:', Object.keys(data));
    console.log('CV PDF Debug - processed name:', data.name);

    // Get the React-PDF template component
    const TemplateComponent = getPDFTemplate(templateId);
    
    // Create the PDF document
    const document = React.createElement(TemplateComponent, {
      data,
      accent: getAccentColor(accent),
      isCoverLetter: false
    });

    // Generate PDF stream
    const stream = await renderToStream(document);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    
    // Pipe the stream to response
    stream.pipe(res);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
}