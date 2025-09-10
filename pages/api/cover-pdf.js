import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { getCoverLetterTemplate, getAccentColor } from '../../lib/pdf-templates';
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
    
    console.log('Cover PDF Debug - Full result:', JSON.stringify(result, null, 2));
    
    const resumeData = result?.resumeData || result || {};
    
    // Combine resume data with cover letter - handle different data structures
    const combinedData = {
      ...resumeData,
      coverLetter: result?.coverLetter || result?.coverLetterText || ''
    };
    
    console.log('Cover PDF Debug - Combined data coverLetter:', combinedData.coverLetter);
    
    // Pass data directly to cover letter template (no template model needed)
    const data = combinedData;

    // Get the cover letter template component (always use dedicated cover letter template)
    const CoverLetterComponent = getCoverLetterTemplate();
    
    // Create the PDF document
    const document = React.createElement(CoverLetterComponent, {
      data,
      accent: getAccentColor(accent)
    });

    // Generate PDF stream
    const stream = await renderToStream(document);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cover-letter.pdf"');
    
    // Pipe the stream to response
    stream.pipe(res);
    
  } catch (error) {
    console.error('Cover letter PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate cover letter PDF',
      details: error.message 
    });
  }
}