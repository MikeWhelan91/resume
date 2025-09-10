export default function handler(req, res) {
  const { accent, data } = req.body;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Generate HTML that matches the cover letter preview exactly
  const html = generateCoverLetterHTML(data, accent);
  
  // Return HTML for client-side PDF generation
  res.status(200).json({ html });
}

function generateCoverLetterHTML(userData, accent) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
        line-height: 1.5; 
        font-family: Arial, sans-serif;
        color: #333;
      }
    </style>
  `;

  const coverLetterContent = userData.coverLetter ? 
    userData.coverLetter.split('\n\n').filter(p => p.trim()).map(p => `<p style="font-size: 9px; margin-bottom: 8px; text-align: justify;">${p.trim()}</p>`).join('') :
    `<p style="font-size: 9px; text-align: justify;">
      Dear Hiring Manager,<br/><br/>
      I am writing to express my interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.<br/><br/>
      Thank you for considering my application. I look forward to hearing from you.
    </p>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cover Letter</title>
      ${baseStyles}
    </head>
    <body>
      <div style="margin-bottom: 20px;">
        <h1 style="font-size: 14px; margin-bottom: 4px; color: ${accent}; font-weight: bold;">
          ${userData.resumeData?.name || userData.name || 'Your Name'}
        </h1>
        <p style="font-size: 9px; color: #666; margin-bottom: 2px;">
          ${userData.resumeData?.email || userData.email || 'email@example.com'}
        </p>
        <p style="font-size: 9px; color: #666; margin-bottom: 2px;">
          ${userData.resumeData?.phone || userData.phone || 'Phone'}
        </p>
      </div>

      <div style="margin-bottom: 15px; text-align: right;">
        <p style="font-size: 9px; color: #666;">
          ${today}
        </p>
      </div>

      <div style="margin-bottom: 15px;">
        ${coverLetterContent}
      </div>

      <div style="margin-top: 20px;">
        <p style="font-size: 9px;">Sincerely,</p>
        <p style="font-size: 9px; margin-top: 15px; font-weight: bold;">
          ${userData.resumeData?.name || userData.name || 'Your Name'}
        </p>
      </div>
    </body>
    </html>
  `;
}