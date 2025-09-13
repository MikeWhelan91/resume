import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is called by a cron job or admin (add your auth here)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    
    // Find all deletion requests that should be processed
    const pendingDeletions = await prisma.accountDeletionRequest.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        cancelled: false
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            stripeCustomerId: true
          }
        }
      }
    });

    console.log(`Found ${pendingDeletions.length} accounts scheduled for deletion`);

    const results = [];

    for (const deletion of pendingDeletions) {
      try {
        const user = deletion.user;
        
        // Cancel any active Stripe subscriptions
        if (stripe && user.stripeCustomerId) {
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: user.stripeCustomerId,
              status: 'active'
            });

            for (const subscription of subscriptions.data) {
              await stripe.subscriptions.cancel(subscription.id);
            }
            
            console.log(`Cancelled ${subscriptions.data.length} subscriptions for user ${user.id}`);
          } catch (stripeError) {
            console.error('Error cancelling Stripe subscriptions:', stripeError);
            // Continue with deletion even if Stripe cleanup fails
          }
        }

        // Delete user data from database (cascading deletes will handle related data)
        await prisma.user.delete({
          where: { id: user.id }
        });

        console.log(`Successfully deleted user account: ${user.id} (${user.email})`);
        
        results.push({
          userId: user.id,
          email: user.email,
          status: 'deleted',
          deletedAt: now
        });

      } catch (error) {
        console.error(`Failed to delete user ${deletion.user.id}:`, error);
        
        results.push({
          userId: deletion.user.id,
          email: deletion.user.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${pendingDeletions.length} scheduled deletions`,
      results,
      processedAt: now
    });

  } catch (error) {
    console.error('Batch deletion processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process scheduled deletions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}