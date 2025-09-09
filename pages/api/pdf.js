import React from 'react';
import { getTemplate } from '@/templates';
import { toTemplateModel } from '@/lib/templateModel';
import { renderHtml } from '@/lib/renderHtmlTemplate';
import { renderReactPdf } from '@/lib/renderReactPdf';
import { getCurrentResumeData } from '@/lib/getCurrentResumeData';
import puppeteer from 'puppeteer';
const { pdf } = require('@react-pdf/renderer');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const templateId = (req.query.template || '').toString();

  if (templateId === 'cover-letter') {
    const { default: CoverLetterPdf } = require('@/components/pdf/CoverLetterPdf');
    const data = await getCurrentResumeData(req);
    const instance = pdf(
      <CoverLetterPdf
        text={data.coverLetter || ''}
        accent={data.accent}
        density={data.density}
        atsMode={data.ats}
      />
    );
    const buffer = await instance.toBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="cover-letter.pdf"');
    return res.send(buffer);
  }

  const t = getTemplate(templateId);
  const appData = await getCurrentResumeData(req);
  const model = toTemplateModel(appData);

  let pdfBuffer;
  if (t.engine === 'html') {
    const html = renderHtml({ html: t.html, css: t.css, model });
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });
    await browser.close();
  } else {
    const module = require(`@/templates/${t.id}/index.jsx`);
    pdfBuffer = await renderReactPdf({ module, model });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${templateId || 'resume'}.pdf"`);
  res.send(pdfBuffer);
}
