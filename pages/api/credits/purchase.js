import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { CREDIT_PACKS } from '../../../lib/credit-purchase-system'
import { prisma } from '../../../lib/prisma.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Resolve the user from the DB
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({ where: { id: session.user.id } })
    } else if (session.user.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } })
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { packId } = req.body

    if (!packId || !CREDIT_PACKS[packId]) {
      return res.status(400).json({ error: 'Invalid credit pack' })
    }

    const pack = CREDIT_PACKS[packId]

    // Ensure a Stripe customer exists
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

    // Create the checkout session with dynamic pricing
    const checkout = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: pack.name,
            description: `${pack.credits} credits - ${pack.description}`,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/account?success=true&type=credits`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packId: packId,
        credits: pack.credits.toString(),
        type: 'credit_purchase'
      },
    })

    return res.status(200).json({ url: checkout.url })
  } catch (error) {
    console.error('Error creating credit purchase:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}