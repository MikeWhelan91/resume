import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.method === 'DELETE') {
      // Delete the draft
      await prisma.draft.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      res.status(200).json({ success: true });
    } else {
      // POST - Save the draft
      const { draftData } = req.body;

      if (!draftData) {
        return res.status(400).json({ error: 'Draft data is required' });
      }

      // Upsert the draft (create or update)
      const draft = await prisma.draft.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          data: draftData,
        },
        create: {
          userId: session.user.id,
          data: draftData,
        },
      });

      res.status(200).json({
        success: true,
        draft: {
          id: draft.id,
          updatedAt: draft.updatedAt
        }
      });
    }

  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
}