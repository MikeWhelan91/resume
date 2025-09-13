import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = session.user.id;

    // Find any pending deletion request
    const deletionRequest = await prisma.accountDeletionRequest.findUnique({
      where: { userId }
    });

    if (!deletionRequest || deletionRequest.cancelled) {
      return res.status(200).json({
        hasPendingDeletion: false
      });
    }

    // Check if deletion has already passed
    const now = new Date();
    if (now >= deletionRequest.scheduledFor) {
      return res.status(200).json({
        hasPendingDeletion: false,
        message: 'Account scheduled for immediate deletion'
      });
    }

    // Calculate remaining time
    const hoursRemaining = Math.ceil((deletionRequest.scheduledFor - now) / (1000 * 60 * 60));

    return res.status(200).json({
      hasPendingDeletion: true,
      scheduledFor: deletionRequest.scheduledFor,
      hoursRemaining,
      requestedAt: deletionRequest.requestedAt
    });

  } catch (error) {
    console.error('Deletion status check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check deletion status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}