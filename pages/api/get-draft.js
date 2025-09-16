import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const draft = await prisma.draft.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!draft) {
      return res.status(404).json({ error: 'No draft found' });
    }

    res.status(200).json({
      draftData: draft.data,
      updatedAt: draft.updatedAt,
      createdAt: draft.createdAt
    });

  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
}