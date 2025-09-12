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

  // Debug: Check if prisma client is properly imported and working
  if (!prisma) {
    console.error('Prisma client is undefined - import failed');
    return res.status(500).json({ error: 'Database connection error' });
  }
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Prisma client connected successfully');
  } catch (connectionError) {
    console.error('Prisma connection failed:', connectionError);
    return res.status(500).json({ 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? connectionError.message : undefined
    });
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

    // Delete user data from database
    console.log(`Starting account deletion for user ${userId}`);
    
    try {
      // Since all foreign keys in the schema have onDelete: Cascade,
      // we can delete the user directly and let the database handle cascading deletes
      // But first, let's check what data exists for debugging
      
      const existingData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: true,
          sessions: true,
          apiUsage: true,
          entitlement: true,
          savedResumes: true
        }
      });
      
      if (!existingData) {
        console.log(`User ${userId} not found - may already be deleted`);
        return res.status(404).json({ 
          error: 'User account not found or already deleted.' 
        });
      }
      
      console.log(`User ${userId} has:`, {
        accounts: existingData.accounts.length,
        sessions: existingData.sessions.length,
        apiUsage: existingData.apiUsage.length,
        hasEntitlement: !!existingData.entitlement,
        savedResumes: existingData.savedResumes.length
      });

      // Try direct user deletion first (with CASCADE)
      await prisma.user.delete({
        where: { id: userId }
      });
      
      console.log(`Successfully deleted user ${userId} with cascading deletes`);
      
    } catch (dbError) {
      console.error('Direct deletion failed, trying manual cleanup:', dbError);
      
      // Fallback to manual deletion if cascade fails
      try {
        console.log('Attempting manual cleanup...');
        
        // Delete in reverse dependency order
        await prisma.apiUsage.deleteMany({ where: { userId } });
        await prisma.savedResume.deleteMany({ where: { userId } });
        await prisma.entitlement.deleteMany({ where: { userId } });
        await prisma.account.deleteMany({ where: { userId } });
        await prisma.session.deleteMany({ where: { userId } });
        
        // Finally delete user
        await prisma.user.delete({ where: { id: userId } });
        
        console.log(`Successfully deleted user ${userId} with manual cleanup`);
        
      } catch (manualError) {
        console.error('Manual cleanup also failed:', manualError);
        throw manualError; // Re-throw to be caught by outer try-catch
      }
    }

    console.log(`Successfully deleted user account: ${userId} (${user.email})`);

    return res.status(200).json({ 
      message: 'Account successfully deleted',
      deleted: true
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    
    // Provide more specific error messages based on error type
    if (error.code === 'P2003') {
      console.error('Foreign key constraint violation during account deletion');
      return res.status(500).json({ 
        error: 'Unable to delete account due to foreign key constraints. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.code === 'P2025') {
      console.error('Record not found during account deletion');
      return res.status(404).json({ 
        error: 'User account not found or already deleted.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.code === 'P2002') {
      console.error('Unique constraint violation during account deletion');
      return res.status(500).json({ 
        error: 'Database constraint error. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic database errors
    if (error.code?.startsWith('P')) {
      console.error('Prisma database error:', error.code, error.message);
      return res.status(500).json({ 
        error: `Database error (${error.code}). Please contact support.`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Network or other errors
    console.error('Unexpected error during account deletion:', error.message || error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}