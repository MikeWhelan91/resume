import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = session.user.id;

    // Find and cancel the deletion request
    const deletionRequest = await prisma.accountDeletionRequest.findUnique({
      where: { userId }
    });

    if (!deletionRequest) {
      return res.status(404).json({ error: 'No deletion request found' });
    }

    if (deletionRequest.cancelled) {
      return res.status(400).json({ error: 'Deletion request already cancelled' });
    }

    // Check if it's too late to cancel (past the scheduled deletion time)
    if (new Date() >= deletionRequest.scheduledFor) {
      return res.status(400).json({ error: 'Cannot cancel - deletion has already been processed' });
    }

    // Cancel the deletion request
    await prisma.accountDeletionRequest.update({
      where: { userId },
      data: { cancelled: true }
    });

    console.log(`Account deletion cancelled for user ${userId}`);

    return res.status(200).json({
      message: 'Account deletion cancelled successfully'
    });

  } catch (error) {
    console.error('Account deletion cancellation error:', error);
    return res.status(500).json({ 
      error: 'Failed to cancel account deletion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}