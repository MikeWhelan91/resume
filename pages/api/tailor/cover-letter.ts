import type { NextApiRequest, NextApiResponse } from 'next';
import { openai, model, temperature } from '../../../lib/openai/client';
import { ResumeSchema } from '../../../lib/schema/resume';
import { checkRateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/log';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = checkRateLimit(req, res);
  if (!limit.ok) return;
  try {
    const { resume, jobDescription, style } = req.body;
    const parsed = ResumeSchema.parse(resume);
    const response = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: 'system', content: 'You write a concise cover letter based only on provided resume and job description.' },
        { role: 'user', content: JSON.stringify({ resume: parsed, jobDescription, style }) },
      ],
      response_format: { type: 'json_object' },
    });
    const json = JSON.parse(response.choices[0].message.content || '{}');
    res.status(200).json(json);
  } catch (e: any) {
    logger.error('tailor_letter_failed', { error: e.message });
    res.status(500).json({ code: 'OPENAI_ERROR', error: e.message });
  }
}
