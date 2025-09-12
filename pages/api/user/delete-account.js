import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

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

    // Get user data before deletion to handle Stripe cleanup
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        email: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cancel any active Stripe subscriptions if user has Stripe customer ID
    if (stripe && user.stripeCustomerId) {
      try {
        // Get all active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active'
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }

        console.log(`Cancelled ${subscriptions.data.length} subscriptions for user ${userId}`);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscriptions:', stripeError);
        // Continue with account deletion even if Stripe cleanup fails
      }
    }

    // Delete user data from database in the correct order (due to foreign key constraints)
    
    // 1. Delete API usage records
    await prisma.apiUsage.deleteMany({
      where: { userId }
    });

    // 2. Delete user entitlements
    await prisma.userEntitlement.deleteMany({
      where: { userId }
    });

    // 3. Delete user's resumes/documents
    await prisma.resume.deleteMany({
      where: { userId }
    });

    // 4. Delete accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId }
    });

    // 5. Delete sessions
    await prisma.session.deleteMany({
      where: { userId }
    });

    // 6. Finally delete the user record
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`Successfully deleted user account: ${userId} (${user.email})`);

    return res.status(200).json({ 
      message: 'Account successfully deleted',
      deleted: true
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      return res.status(500).json({ 
        error: 'Unable to delete account due to data constraints. Please contact support.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to delete account. Please try again or contact support.' 
    });
  }
}