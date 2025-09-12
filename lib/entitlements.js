import { getServerSession } from 'next-auth/next'
import NextAuth from '../pages/api/auth/[...nextauth]'
import { getUserEntitlementWithCredits, hasFeature, getEffectivePlan } from './credit-system.js'

export async function requirePlan(req, res, neededPlan = 'free') {
  // Get session
  const session = await getServerSession(req, res, NextAuth)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Get user entitlement with credit reset
  const entitlement = await getUserEntitlementWithCredits(session.user.id)
  const effectivePlan = getEffectivePlan(entitlement)

  // Check if plan meets requirements
  if (neededPlan === 'pro' && effectivePlan === 'free') {
    return res.status(402).json({ error: 'Upgrade required' })
  }

  // Check if entitlement is active
  if (entitlement.status !== 'active') {
    return res.status(402).json({ 
      error: 'Subscription inactive', 
      status: entitlement.status 
    })
  }

  return {
    userId: session.user.id,
    plan: effectivePlan,
    status: entitlement.status,
    features: entitlement.features,
    credits: entitlement.freeWeeklyCreditsRemaining
  }
}

export async function getUserEntitlement(userId) {
  return await getUserEntitlementWithCredits(userId)
}

export { hasFeature }

export function canUseFeature(entitlement, feature) {
  if (!entitlement) return false
  
  // Free features are always available
  if (['pdf_export'].includes(feature)) {
    return true
  }
  
  // Use the new hasFeature function
  return hasFeature(entitlement, feature)
}