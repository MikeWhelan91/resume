import { getServerSession } from 'next-auth/next'
import NextAuth from '../pages/api/auth/[...nextauth]'
import { prisma } from './prisma.js'

export async function requirePlan(req, res, neededPlan = 'free') {
  // Get session
  const session = await getServerSession(req, res, NextAuth)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Get user entitlement
  const entitlement = await prisma.entitlement.findUnique({
    where: { userId: session.user.id }
  })

  if (!entitlement) {
    // Create default free entitlement if it doesn't exist
    await prisma.entitlement.create({
      data: {
        userId: session.user.id,
        plan: 'free',
        status: 'active',
        features: {
          docx: false,
          cover_letter: false,
          max_req_per_min: 10
        }
      }
    })
    
    if (neededPlan !== 'free') {
      return res.status(402).json({ error: 'Upgrade required' })
    }
    
    return { userId: session.user.id, plan: 'free', status: 'active' }
  }

  // Check if plan meets requirements
  if (neededPlan === 'pro' && entitlement.plan === 'free') {
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
    plan: entitlement.plan,
    status: entitlement.status,
    features: entitlement.features
  }
}

export async function getUserEntitlement(userId) {
  if (!userId) return null

  const entitlement = await prisma.entitlement.findUnique({
    where: { userId }
  })

  if (!entitlement) {
    // Create default free entitlement
    return await prisma.entitlement.create({
      data: {
        userId,
        plan: 'free',
        status: 'active',
        features: {
          docx: false,
          cover_letter: false,
          max_req_per_min: 10
        }
      }
    })
  }

  return entitlement
}

export function hasFeature(entitlement, feature) {
  if (!entitlement) return false
  return entitlement.status === 'active' && entitlement.features?.[feature] === true
}

export function canUseFeature(entitlement, feature) {
  if (!entitlement) return false
  
  // Free features are always available
  if (['pdf_export'].includes(feature)) {
    return true
  }
  
  // Pro features require active subscription
  if (['docx', 'cover_letter'].includes(feature)) {
    return entitlement.status === 'active' && entitlement.features?.[feature] === true
  }
  
  return false
}