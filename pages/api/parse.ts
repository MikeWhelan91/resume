import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ResumeSchema } from '../../lib/schema/resume';
import { normalizeResume } from '../../lib/resume/normalize';
import { logger } from '../../lib/log';
import { checkRateLimit } from '../../lib/rateLimit';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = checkRateLimit(req, res);
  if (!limit.ok) return;
  const form = formidable({ multiples: false, keepExtensions: true });
  try {
    const [fields, files] = await form.parse(req);
    const file = files.file as formidable.File;
    const data = await fs.promises.readFile(file.filepath);
    let text = '';
    if (file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(data);
      text = parsed.text;
    } else if (file.mimetype?.includes('word') || file.originalFilename?.endsWith('.docx')) {
      const parsed = await mammoth.extractRawText({ buffer: data });
      text = parsed.value;
    } else {
      text = data.toString('utf8');
    }
    await fs.promises.unlink(file.filepath);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const resume = {
      basics: {
        name: lines[0] || 'Unknown',
        email: (text.match(/[\w.-]+@[\w.-]+/) || [''])[0],
        links: [],
      },
      skills: [],
      work: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      volunteering: [],
      preferences: {},
    };
    const confidences: Record<string,string> = {
      basics: 'medium',
    };
    const parsedResume = normalizeResume(ResumeSchema.parse(resume));
    logger.info('parse', { chars: text.length });
    res.status(200).json({ resume: parsedResume, confidences });
  } catch (e: any) {
    logger.error('parse_failed', { error: e.message });
    res.status(422).json({ code: 'PARSE_FAILED', error: e.message });
  }
}
