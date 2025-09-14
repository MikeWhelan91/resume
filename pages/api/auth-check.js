import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkCreditAvailability } from '../../lib/credit-system';
import { getTrialUsage } from '../../lib/trialUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (session?.user) {
      // Authenticated user - check credit availability
      const userId = session.user.id;
      const creditCheck = await checkCreditAvailability(userId, 'generation');
      
      return res.status(200).json({
        authenticated: true,
        canAccess: creditCheck.allowed,
        reason: creditCheck.allowed ? null : 'No credits remaining',
        credits: creditCheck.credits,
        plan: creditCheck.plan,
        userType: 'authenticated'
      });
    } else {
      // Anonymous user - check trial usage
      const trialUsage = await getTrialUsage(req);
      
      return res.status(200).json({
        authenticated: false,
        canAccess: trialUsage.canGenerate,
        reason: trialUsage.canGenerate ? null : 'Trial generations exhausted',
        generationsRemaining: trialUsage.generationsRemaining,
        generationsLimit: trialUsage.generationsLimit,
        userType: 'trial'
      });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}