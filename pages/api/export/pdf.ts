import type { NextApiRequest, NextApiResponse } from 'next';
import { ResumeSchema } from '../../../lib/schema/resume';
import { templates } from '../../../components/templates';
import { checkRateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/log';
import { renderToStream } from '@react-pdf/renderer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = checkRateLimit(req, res);
  if (!limit.ok) return;
  try {
    const { resume, templateId } = req.body;
    const parsed = ResumeSchema.parse(resume);
    const template = templates[templateId as string] || templates.clean;
    const pdf = await renderToStream(template.renderPdf(parsed));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    pdf.pipe(res);
  } catch (e: any) {
    logger.error('export_failed', { error: e.message });
    res.status(422).json({ code: 'VALIDATION_ERROR', error: e.message });
  }
}
