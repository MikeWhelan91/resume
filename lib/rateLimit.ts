import type { NextApiRequest, NextApiResponse } from 'next';

const WINDOW = 60 * 1000; // 1 min
const LIMIT = 10;
const hits: Record<string, { count: number; time: number }> = {};

export function checkRateLimit(req: NextApiRequest, res: NextApiResponse) {
  const key = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anon';
  const now = Date.now();
  const entry = hits[key as string] || { count: 0, time: now };
  if (now - entry.time > WINDOW) {
    entry.count = 0;
    entry.time = now;
  }
  entry.count += 1;
  hits[key as string] = entry;
  if (entry.count > LIMIT) {
    res.status(429).json({ code: 'RATE_LIMITED', error: 'Too many requests' });
    return { ok: false };
  }
  return { ok: true };
}
