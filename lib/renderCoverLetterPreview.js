export function renderCoverLetterPreview(data, accent = '#333333') {
  // Get cover letter text
  const coverLetterText = typeof data.coverLetter === 'string' 
    ? data.coverLetter 
    : data.coverLetter?.body || data.coverLetter?.bodyHtml?.replace(/<[^>]*>/g, '') || 'No cover letter content available.';

  // Split into paragraphs
  const paragraphs = coverLetterText.split(/\n\s*\n/).filter(p => p.trim());

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20mm;
      background: #fff;
    }
    
    .header {
      margin-bottom: 30px;
      text-align: left;
    }
    
    .name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      color: ${accent};
    }
    
    .contact {
      font-size: 11px;
      color: #555;
      line-height: 1.4;
      margin: 2px 0;
    }
    
    .date {
      font-size: 11px;
      margin-bottom: 20px;
      text-align: right;
    }
    
    .content {
      font-size: 12px;
      line-height: 1.6;
      text-align: justify;
      margin-bottom: 15px;
    }
    
    .signature {
      margin-top: 30px;
      font-size: 12px;
    }
    
    .signature-name {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${data.name || 'Your Name'}</div>
    <div class="contact">${data.email || 'your.email@example.com'}</div>
    <div class="contact">${data.phone || 'Your Phone Number'}</div>
    ${data.url ? `<div class="contact">${data.url}</div>` : ''}
  </div>

  <div class="date">${today}</div>

  ${paragraphs.length > 0 ? 
    paragraphs.map(paragraph => `<div class="content">${paragraph.trim()}</div>`).join('') :
    '<div class="content">No cover letter content available. Please ensure your cover letter was generated properly.</div>'
  }

  <div class="signature">
    <div>Sincerely,</div>
    <div class="signature-name">${data.name || 'Your Name'}</div>
  </div>
</body>
</html>`;

  return html;
}