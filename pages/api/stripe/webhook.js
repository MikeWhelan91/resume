import Stripe from 'stripe'
import { buffer } from 'micro'
import { prisma } from '../../../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Store idempotency record
    await prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      update: {},
      create: { eventId: event.id }
    })

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.userId
  
  if (!userId) {
    console.error('No user ID found in checkout session')
    return
  }

  // Determine plan based on price ID
  let plan = 'pro_monthly'
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    const priceId = subscription.items.data[0]?.price.id
    
    if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
      plan = 'pro_annual'
    }
  }

  // Update entitlement
  await prisma.entitlement.upsert({
    where: { userId },
    update: {
      plan,
      status: 'active',
      features: {
        docx: true,
        cover_letter: true,
        max_req_per_min: 60
      }
    },
    create: {
      userId,
      plan,
      status: 'active',
      features: {
        docx: true,
        cover_letter: true,
        max_req_per_min: 60
      }
    }
  })

  console.log(`Entitlement activated for user ${userId} with plan ${plan}`)
}

async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer
  
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })
  
  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  let plan = 'pro_monthly'
  
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    plan = 'pro_annual'
  }

  await prisma.entitlement.upsert({
    where: { userId: user.id },
    update: {
      plan,
      status: 'active',
      features: {
        docx: true,
        cover_letter: true,
        max_req_per_min: 60
      }
    },
    create: {
      userId: user.id,
      plan,
      status: 'active',
      features: {
        docx: true,
        cover_letter: true,
        max_req_per_min: 60
      }
    }
  })
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer
  
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })
  
  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  const status = mapStripeStatusToEntitlementStatus(subscription.status)
  const isActive = status === 'active'

  await prisma.entitlement.upsert({
    where: { userId: user.id },
    update: {
      status,
      features: {
        docx: isActive,
        cover_letter: isActive,
        max_req_per_min: isActive ? 60 : 10
      }
    },
    create: {
      userId: user.id,
      plan: 'pro_monthly',
      status,
      features: {
        docx: isActive,
        cover_letter: isActive,
        max_req_per_min: isActive ? 60 : 10
      }
    }
  })
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer
  
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })
  
  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  await prisma.entitlement.upsert({
    where: { userId: user.id },
    update: {
      plan: 'free',
      status: 'canceled',
      features: {
        docx: false,
        cover_letter: false,
        max_req_per_min: 10
      }
    },
    create: {
      userId: user.id,
      plan: 'free',
      status: 'canceled',
      features: {
        docx: false,
        cover_letter: false,
        max_req_per_min: 10
      }
    }
  })
}

async function handlePaymentSucceeded(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    await handleSubscriptionUpdated(subscription)
  }
}

async function handlePaymentFailed(invoice) {
  if (invoice.subscription) {
    const customerId = invoice.customer
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    })
    
    if (user) {
      await prisma.entitlement.update({
        where: { userId: user.id },
        data: {
          status: 'past_due',
          features: {
            docx: false,
            cover_letter: false,
            max_req_per_min: 10
          }
        }
      })
    }
  }
}

function mapStripeStatusToEntitlementStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'canceled'
    default:
      return 'inactive'
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}