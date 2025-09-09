import React from 'react';
import { getTemplate } from '@/templates';
import { toTemplateModel } from '@/lib/templateModel';
import { getCurrentResumeData } from '@/lib/getCurrentResumeData';
const { pdf } = require('@react-pdf/renderer');

export default async function handler(req, res) {
  try {
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
      res.setHeader('Cache-Control', 'no-store');
      res.end(buffer);
      return;
    }

    const tpl = getTemplate(templateId);
    if (!tpl || tpl.engine !== 'react-pdf') {
      res.status(400).send('Template is not react-pdf');
      return;
    }

    const appData = await getCurrentResumeData(req);
    const model = toTemplateModel(appData);

    const module = require(`@/templates/${tpl.id}/index.jsx`);
    const Doc = module.DocumentFor || module.default;
    if (!Doc) {
      res.status(500).send('React-PDF template missing export');
      return;
    }

    const instance = pdf(<Doc model={model} />);
    const buffer = await instance.toBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    res.status(500).send('PDF preview error: ' + (err?.message || String(err)));
  }
}
