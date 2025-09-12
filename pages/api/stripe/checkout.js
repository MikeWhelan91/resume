import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import NextAuth from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, NextAuth)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.id
    const { planType, isAnnual } = req.body

    // Determine which Stripe price to use
    let priceId
    switch (planType) {
      case 'pro_monthly':
        priceId = process.env.STRIPE_PRICE_PRO_MONTHLY
        break
      case 'pro_annual':
        priceId = process.env.STRIPE_PRICE_PRO_ANNUAL
        break
      default:
        priceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_PRO_MONTHLY
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      })
      
      stripeCustomerId = customer.id
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || process.env.NEXTAUTH_URL}/account?success=true`,
      cancel_url: `${process.env.APP_URL || process.env.NEXTAUTH_URL}/account?canceled=true`,
      metadata: {
        userId: userId,
      },
    })

    res.status(200).json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}