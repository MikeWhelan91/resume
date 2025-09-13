import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma.js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { cookiePreferences: true }
      });
      return res.status(200).json(user?.cookiePreferences || {});
    } catch (error) {
      console.error('Cookie preference fetch error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { analytics } = req.body;
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { cookiePreferences: { analytics } }
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Cookie preference update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
