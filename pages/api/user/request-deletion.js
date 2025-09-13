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

    // Check if user already has a pending deletion request
    const existingRequest = await prisma.accountDeletionRequest.findUnique({
      where: { userId }
    });

    if (existingRequest && !existingRequest.cancelled) {
      return res.status(400).json({ 
        error: 'Account deletion already scheduled',
        scheduledFor: existingRequest.scheduledFor,
        canCancelUntil: existingRequest.scheduledFor
      });
    }

    // Calculate deletion time (48 hours from now)
    const now = new Date();
    const scheduledFor = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours

    // Create or update deletion request
    const deletionRequest = await prisma.accountDeletionRequest.upsert({
      where: { userId },
      update: {
        requestedAt: now,
        scheduledFor,
        cancelled: false
      },
      create: {
        userId,
        requestedAt: now,
        scheduledFor,
        cancelled: false
      }
    });

    console.log(`Account deletion scheduled for user ${userId} at ${scheduledFor.toISOString()}`);

    return res.status(200).json({
      message: 'Account deletion scheduled',
      scheduledFor: deletionRequest.scheduledFor,
      hoursRemaining: 48
    });

  } catch (error) {
    console.error('Account deletion request error:', error);
    return res.status(500).json({ 
      error: 'Failed to schedule account deletion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}