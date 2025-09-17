import { getServerSession } from 'next-auth/next'
import NextAuth from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, NextAuth)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Reset monthly free credits to 6
    const updated = await prisma.entitlement.update({
      where: { userId: session.user.id },
      data: {
        freeCreditsThisMonth: 6,
        lastMonthlyReset: new Date()
      }
    })

    return res.status(200).json({ 
      message: 'Monthly credits reset successfully',
      credits: updated.freeCreditsThisMonth 
    })
  } catch (error) {
    console.error('Error resetting credits:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
