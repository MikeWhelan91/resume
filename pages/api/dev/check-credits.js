import { getServerSession } from 'next-auth/next'
import NextAuth from '../auth/[...nextauth]'
import { getUserEntitlement } from '../../../lib/credit-purchase-system.js'

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, NextAuth)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const entitlement = await getUserEntitlement(session.user.id)
    const dublinTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Dublin"})
    
    return res.status(200).json({ 
      userId: session.user.id,
      plan: entitlement.plan,
      creditsRemaining: (entitlement.freeCreditsThisMonth ?? 0) + (entitlement.creditBalance ?? 0),
      lastReset: entitlement.lastMonthlyReset,
      dublinTime,
      nextReset: '1st of next month 00:00 Dublin time'
    })
  } catch (error) {
    console.error('Error checking credits:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
