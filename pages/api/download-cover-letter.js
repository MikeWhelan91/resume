import puppeteer from 'puppeteer';
import { limitCoverLetter } from '../../lib/renderUtils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkAndConsumeDownload, trackApiUsage } from '../../lib/credit-purchase-system';
import { prisma } from '../../lib/prisma';
import { checkTrialLimit, consumeTrialUsage } from '../../lib/trialUtils';

export default async function handler(req, res) {
  const { accent, data } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Check user authentication and credits, or handle trial user
  let userId = null;
  let isTrialUser = false;
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      // Authenticated user
      userId = session.user.id;
      
      // For authenticated users, check per-document download limits
      // Find the user's latest saved resume for download tracking
      const latestResume = await prisma.savedResume.findFirst({
        where: {
          userId,
          isLatest: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (latestResume) {
        const downloadCheck = await checkAndConsumeDownload(userId, latestResume.id);
        if (!downloadCheck.allowed) {
          return res.status(429).json({
            error: 'Download limit reached',
            message: downloadCheck.message,
            downloadsRemaining: downloadCheck.downloadsRemaining || 0
          });
        }
      }
    } else {
      // Anonymous trial user
      isTrialUser = true;
      
      // Check trial download limits
      const trialCheck = await checkTrialLimit(req, 'download');
      if (!trialCheck.allowed) {
        return res.status(429).json({ 
          error: 'Trial download limit reached', 
          message: `Trial allows ${trialCheck.limit} downloads total. Sign up for unlimited downloads!`,
          code: 'TRIAL_DOWNLOAD_LIMIT'
        });
      }
    }
  } catch (error) {
    console.error('Error checking user session or trial limits:', error);
    // For trial users, if there's an error, allow the download (fail open)
    if (!userId) {
      isTrialUser = true;
    }
  }

  // Generate HTML that matches the cover letter preview exactly
  const html = generateCoverLetterHTML(data, accent);

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { 
        top: '15mm', 
        bottom: '15mm', 
        left: '15mm', 
        right: '15mm' 
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    await browser.close();

    // Track usage after successful generation
    if (userId) {
      await trackApiUsage(userId, 'pdf-download');
    } else if (isTrialUser) {
      try {
        await consumeTrialUsage(req, 'download');
        console.log('Trial user consumed 1 download for cover letter');
      } catch (error) {
        console.error('Error tracking trial download usage:', error);
        // Don't block the response if tracking fails
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cover-letter.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

function generateCoverLetterHTML(userData, accent) {
  const scale = 1.75; // Use 1.75x scaling for PDF
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
        padding: ${25 * scale}px; 
        font-size: ${10 * scale}px; 
        line-height: 1.5; 
        font-family: Arial, sans-serif;
        color: #333;
        width: 794px;
        height: 1123px;
        background: white;
        box-sizing: border-box;
      }
    </style>
  `;

  const coverLetterContent = userData.coverLetter ?
    limitCoverLetter(userData.coverLetter).map(p => `<p style="font-size: ${9 * scale}px; margin-bottom: ${8 * scale}px; text-align: justify;">${p.trim()}</p>`).join('') :
    `<p style="font-size: ${9 * scale}px; text-align: justify;">
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
      <div style="margin-bottom: ${15 * scale}px; text-align: right;">
        <p style="font-size: ${9 * scale}px; color: #666;">
          ${today}
        </p>
      </div>

      <div style="margin-bottom: ${15 * scale}px;">
        ${coverLetterContent}
      </div>

      <div style="margin-top: ${20 * scale}px;">
        <p style="font-size: ${9 * scale}px;">Sincerely,</p>
        <p style="font-size: ${9 * scale}px; margin-top: ${15 * scale}px; font-weight: bold;">
          ${userData.resumeData?.name || userData.name || 'Your Name'}
        </p>
      </div>
    </body>
    </html>
  `;
}