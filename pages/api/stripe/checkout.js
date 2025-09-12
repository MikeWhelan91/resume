// pages/api/stripe/checkout.js
import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ✅ Use authOptions, not the NextAuth handler
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Resolve the user from the DB (prefer id, fall back to email)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({ where: { id: session.user.id } })
    } else if (session.user.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } })
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { planType } = req.body || {}

    // Choose the correct live price server-side
    let priceId;
    let mode = 'subscription';
    
    if (planType === 'pro_annual') {
      priceId = process.env.STRIPE_PRICE_PRO_ANNUAL;
    } else if (planType === 'pro_monthly') {
      priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
    } else if (planType === 'day_pass') {
      priceId = process.env.STRIPE_PRICE_DAY_PASS;
      mode = 'payment'; // One-time payment for day pass
    }

    if (!priceId) {
      return res.status(500).json({ error: 'Price not configured' })
    }

    // Ensure a live Stripe customer exists and is saved on the user
    let { stripeCustomerId } = user
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      stripeCustomerId = customer.id
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
    }

    const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL
    if (!baseUrl) {
      return res.status(500).json({ error: 'Base URL not configured' })
    }

    // Create the checkout session (subscription or one-time payment)
    const checkout = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/account?success=true`,
      cancel_url: `${baseUrl}/account?canceled=true`,
      client_reference_id: user.id,
      metadata: { userId: user.id, planType },
    })

    return res.status(200).json({ url: checkout.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
