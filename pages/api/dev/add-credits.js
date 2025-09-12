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

    const { credits = 5 } = req.body;

    // Add credits to current amount
    const current = await prisma.entitlement.findUnique({
      where: { userId: session.user.id }
    });

    const newAmount = (current?.freeWeeklyCreditsRemaining || 0) + parseInt(credits);

    const updated = await prisma.entitlement.upsert({
      where: { userId: session.user.id },
      update: {
        freeWeeklyCreditsRemaining: newAmount
      },
      create: {
        userId: session.user.id,
        plan: 'free',
        status: 'active',
        freeWeeklyCreditsRemaining: newAmount,
        features: {
          docx: false,
          cover_letter: true,
          max_req_per_min: 10
        }
      }
    });

    return res.status(200).json({ 
      message: `Added ${credits} credits successfully`,
      totalCredits: updated.freeWeeklyCreditsRemaining,
      added: credits
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}