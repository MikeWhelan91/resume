import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true }
    })

    if (!user?.stripeCustomerId) {
      return res.status(200).json({ 
        hasSubscription: false,
        canceledAt: null 
      })
    }

    // Get customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 10
    })

    // Find the most recent subscription (canceled or active)
    const subscription = subscriptions.data.find(sub => 
      sub.status === 'canceled' || sub.status === 'active'
    )

    if (!subscription) {
      return res.status(200).json({ 
        hasSubscription: false,
        canceledAt: null 
      })
    }

    let canceledAt = null
    if (subscription.status === 'canceled' && subscription.canceled_at) {
      canceledAt = new Date(subscription.canceled_at * 1000).toISOString()
    }

    return res.status(200).json({
      hasSubscription: true,
      status: subscription.status,
      canceledAt,
      currentPeriodEnd: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null
    })

  } catch (error) {
    console.error('Stripe subscription info error:', error)
    return res.status(500).json({ error: 'Failed to fetch subscription information' })
  }
}