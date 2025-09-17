import Stripe from 'stripe'
import { completeCreditPurchase, addCredits } from '../../../lib/credit-purchase-system'
import { prisma } from '../../../lib/prisma.js'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_CREDITS_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object

        // Handle credit purchases
        if (session.metadata?.type === 'credit_purchase') {
          const { userId, packId, credits } = session.metadata

          console.log(`🔄 Processing credit purchase: ${session.id} - ${credits} credits for user ${userId}`)

          // Add credits to user's account
          await addCredits(userId, parseInt(credits))

          console.log(`✅ Credit purchase completed: ${session.id} - ${credits} credits for user ${userId}`)
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object

        // Handle expired credit purchase sessions
        if (expiredSession.metadata?.type === 'credit_purchase') {
          console.log(`⏰ Credit purchase session expired: ${expiredSession.id}`)
        }
        break

      // Legacy payment intent events (keep for backward compatibility)
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object

        // Only process if it has the old metadata format
        if (paymentIntent.metadata.packId && !paymentIntent.metadata.type) {
          await completeCreditPurchase(paymentIntent.id)
          console.log(`✅ Legacy credit purchase completed: ${paymentIntent.id}`)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object

        // Mark purchase as failed (legacy)
        if (failedPayment.metadata.packId && !failedPayment.metadata.type) {
          console.log(`❌ Legacy credit purchase failed: ${failedPayment.id}`)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}