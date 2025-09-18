import { getServerSession } from 'next-auth/next'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import { getUserEntitlement, hasFeature, checkCreditAvailability } from './credit-purchase-system.js'

export async function requirePlan(req, res, neededPlan = 'standard') {
  // Get session
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Get user entitlement
  const entitlement = await getUserEntitlement(session.user.id)

  // Check if plan meets requirements
  if (neededPlan === 'pro' && !['pro_monthly', 'pro_annual'].includes(entitlement.plan)) {
    return res.status(402).json({ error: 'Pro subscription required' })
  }

  // Check if entitlement is active
  if (entitlement.status !== 'active') {
    return res.status(402).json({
      error: 'Account inactive',
      status: entitlement.status
    })
  }

  // Check credit availability for generation actions
  const creditCheck = await checkCreditAvailability(session.user.id, 'generation')
  if (!creditCheck.allowed && entitlement.plan === 'standard') {
    return res.status(402).json({
      error: 'Insufficient credits',
      message: creditCheck.message,
      needsPurchase: true
    })
  }

  return {
    userId: session.user.id,
    plan: entitlement.plan,
    status: entitlement.status,
    features: entitlement.features,
    credits: creditCheck.credits
  }
}

export async function getUserEntitlementWithCredits(userId) {
  return await getUserEntitlement(userId)
}

export { hasFeature, getUserEntitlement }

export function canUseFeature(entitlement, feature) {
  if (!entitlement) return false
  
  // Free features are always available
  if (['pdf_export'].includes(feature)) {
    return true
  }
  
  // Use the new hasFeature function
  return hasFeature(entitlement, feature)
}