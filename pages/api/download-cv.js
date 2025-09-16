import React from 'react';
import ReactDOMServer from 'react-dom/server';
import puppeteer from 'puppeteer';
import ResumeTemplate, { resumeBaseStyles } from '../../components/ResumeTemplate';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/credit-purchase-system';
import { checkAndConsumeDownload, trackApiUsage } from '../../lib/credit-purchase-system';
import { getEffectivePlan } from '../../lib/credit-system';
import { prisma } from '../../lib/prisma';
import { checkTrialLimit, consumeTrialUsage } from '../../lib/trialUtils';

export default async function handler(req, res) {
  const { template, accent, data } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Get user session and entitlement, or handle trial user
  let userPlan = 'free';
  let userId = null;
  let entitlement = null;
  let isTrialUser = false;
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      // Authenticated user
      userId = session.user.id;
      entitlement = await getUserEntitlement(userId);
      userPlan = getEffectivePlan(entitlement);
      
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
    console.error('Error fetching user entitlement or checking trial limits:', error);
    // For trial users, if there's an error, allow the download (fail open)
    if (!userId) {
      isTrialUser = true;
    }
  }

  // Free plan users and trial users are restricted to default color and professional template
  const effectiveAccent = (userPlan === 'free' || isTrialUser) ? '#6b7280' : accent;
  const effectiveTemplate = (userPlan === 'free' || isTrialUser) ? 'professional' : template;

  const effectiveUserPlan = isTrialUser ? 'free' : userPlan;
  const html = generateCVHTML(data, effectiveTemplate, effectiveAccent, effectiveUserPlan);

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
        console.log('Trial user consumed 1 download');
      } catch (error) {
        console.error('Error tracking trial download usage:', error);
        // Don't block the response if tracking fails
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

function generateCVHTML(userData, template, accent, userPlan = 'free') {
  const content = ReactDOMServer.renderToStaticMarkup(
    <ResumeTemplate userData={userData} template={template} accent={accent} isPDF={true} userPlan={userPlan} />
  );

  // No watermarks - removed per user request

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume</title>
  ${resumeBaseStyles}
</head>
<body class="a4-outer">
  <div class="a4-scope">${content}</div>
</body>
</html>`;
}
