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
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.id

    // Find user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing information found' })
    }

    // Create billing portal session
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.APP_URL || process.env.NEXTAUTH_URL}/account`,
      })

      res.status(200).json({ url: portalSession.url })
    } catch (stripeError) {
      console.error('Stripe portal error:', stripeError)
      
      // Handle specific Stripe configuration errors
      if (stripeError.type === 'StripeInvalidRequestError' && 
          stripeError.message?.includes('No configuration provided')) {
        
        console.error('Stripe Customer Portal not configured. Portal features disabled.')
        
        // Return a specific error that the frontend can handle
        return res.status(503).json({ 
          error: 'Billing portal temporarily unavailable',
          code: 'PORTAL_NOT_CONFIGURED',
          message: 'The billing portal is currently being set up. Please contact support for billing assistance.',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@tailoredcv.app'
        })
      }
      
      // Handle other Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: 'Invalid billing request',
          message: 'Unable to access billing portal. Please contact support.'
        })
      }
      
      // Generic Stripe error
      throw stripeError
    }

  } catch (error) {
    console.error('Portal error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to access billing portal. Please try again or contact support.'
    })
  }
}