import { Resend } from 'resend';

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map();

function getRateLimitKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         '127.0.0.1';
}

function isRateLimited(key) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 3; // Max 3 requests per minute
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  const data = rateLimitMap.get(key);
  if (now > data.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (data.count >= maxRequests) {
    return true;
  }
  
  data.count++;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting check
  const clientKey = getRateLimitKey(req);
  if (isRateLimited(clientKey)) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: 'Please wait a minute before sending another message.' 
    });
  }

  try {
    const { name, email, subject, message, category } = req.body;

    // Enhanced validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate field lengths to prevent abuse
    if (name.length > 100 || subject.length > 200 || message.length > 2000) {
      return res.status(400).json({ error: 'Field length exceeds maximum allowed' });
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Basic spam detection
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations'];
    const messageText = (name + subject + message).toLowerCase();
    if (spamKeywords.some(keyword => messageText.includes(keyword))) {
      console.log('Potential spam detected:', { name, email, subject });
      return res.status(400).json({ error: 'Message content not allowed' });
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