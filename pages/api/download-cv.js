import React from 'react';
import ReactDOMServer from 'react-dom/server';
import puppeteer from 'puppeteer';
import ResumeTemplate, { resumeBaseStyles } from '../../components/ResumeTemplate';

export default async function handler(req, res) {
  const { template, accent, data } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

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
  const content = ReactDOMServer.renderToStaticMarkup(
    <ResumeTemplate userData={userData} template={template} accent={accent} />
  );

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
