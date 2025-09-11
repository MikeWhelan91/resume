import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, category } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Format the email content
    const emailContent = `
New support request from TailoredCV.app

From: ${name} (${email})
Category: ${category || 'General Support'}
Subject: ${subject}

Message:
${message}

---
Sent from TailoredCV.app Contact Form
Time: ${new Date().toISOString()}
    `.trim();

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Support Request from TailoredCV.app</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Category:</strong> ${category || 'General Support'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      
      <div style="background: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Sent from TailoredCV.app Contact Form<br>
        Time: ${new Date().toISOString()}
      </p>
    </div>
    `;
    
    // Check if we have Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Send email using Resend
      await resend.emails.send({
        from: 'TailoredCV.app <support@tailoredcv.app>',
        to: ['support@tailoredcv.app'],
        subject: `[Support] ${subject}`,
        html: htmlContent,
        text: emailContent,
        replyTo: email,
      });

      console.log('Support email sent successfully via Resend');
    } else {
      // Log to console if no Resend API key (for development)
      console.log('=== SUPPORT FORM SUBMISSION ===');
      console.log(emailContent);
      console.log('================================');
    }

    // Always return success to the user
    return res.status(200).json({ 
      success: true, 
      message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.' 
    });

  } catch (error) {
    console.error('Error sending support email:', error);
    return res.status(500).json({ 
      error: 'Failed to send message. Please try again or email us directly at support@tailoredcv.app' 
    });
  }
}