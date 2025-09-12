import React from 'react';
import ReactDOMServer from 'react-dom/server';
import puppeteer from 'puppeteer';
import ResumeTemplate, { resumeBaseStyles } from '../../components/ResumeTemplate';
import { getServerSession } from 'next-auth/next';
import NextAuth from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/entitlements';
import { checkCreditAvailability, consumeCredit, trackApiUsage, getEffectivePlan } from '../../lib/credit-system';

export default async function handler(req, res) {
  const { template, accent, data } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Get user session and entitlement
  let userPlan = 'free';
  let userId = null;
  let entitlement = null;
  try {
    const session = await getServerSession(req, res, NextAuth);
    if (session?.user?.id) {
      userId = session.user.id;
      entitlement = await getUserEntitlement(userId);
      userPlan = getEffectivePlan(entitlement);
    }
  } catch (error) {
    console.error('Error fetching user entitlement:', error);
  }

  // Check credit availability
  if (userId) {
    const creditCheck = await checkCreditAvailability(userId, 'download');
    if (!creditCheck.allowed) {
      return res.status(429).json({ 
        error: 'Limit exceeded', 
        message: creditCheck.message,
        credits: creditCheck.credits,
        plan: creditCheck.plan
      });
    }
  }

  // Free users can only use default color
  const effectiveAccent = userPlan === 'free' ? '#10b39f' : accent;

  const html = generateCVHTML(data, template, effectiveAccent, userPlan);

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

    // Track usage and consume credit after successful generation
    if (userId) {
      await consumeCredit(userId, 'download');
      await trackApiUsage(userId, 'pdf-download');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');
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
