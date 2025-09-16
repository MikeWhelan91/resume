import { prisma } from './prisma.js'

// Credit pack configurations (even numbers, EUR pricing)
export const CREDIT_PACKS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 6,
    price: 500, // €5.00 in cents
    description: 'Perfect for trying out our service',
    popular: false
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    credits: 20,
    price: 1500, // €15.00 in cents
    description: 'Great for regular job searching',
    popular: true
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    credits: 60,
    price: 3500, // €35.00 in cents
    description: 'Best value for active job seekers',
    popular: false
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk Pack',
    credits: 150,
    price: 7500, // €75.00 in cents
    description: 'Perfect for career coaches and agencies',
    popular: false
  }
}

// Plan configurations (updated for new system)
export const PLANS = {
  trial: {
    displayName: 'Trial',
    credits: 'limited', // Uses trial system
    docx: false,
    templates: 1,
    colors: 1,
    max_profiles: 1,
    rate_limit_rpm: 10,
    max_saved_resumes: 1,
    resume_expiry_days: 7
  },
  standard: {
    displayName: 'Standard',
    credits: 'balance', // Uses credit balance
    downloads_cost_credits: false, // Downloads are now free - per-document limit instead
    docx: false, // DOCX still requires pro
    templates: 1,
    colors: 1,
    max_profiles: 3,
    rate_limit_rpm: 20,
    max_saved_resumes: 5,
    resume_expiry_days: 30
  },
  pro_monthly: {
    displayName: 'Pro Monthly',
    credits: 'unlimited',
    monthly_generation_cap: 300,
    monthly_download_cap: 2000,
    docx: true,
    templates: 'all',
    colors: 'all',
    max_profiles: 10,
    rate_limit_rpm: 60,
    max_saved_resumes: 50,
    resume_expiry_days: 365
  },
  pro_annual: {
    displayName: 'Pro Annual',
    credits: 'unlimited',
    monthly_generation_cap: 300,
    monthly_download_cap: 2000,
    docx: true,
    templates: 'all',
    colors: 'all',
    max_profiles: 10,
    rate_limit_rpm: 60,
    max_saved_resumes: 50,
    resume_expiry_days: 365
  }
}

// Get the start of the current month (1st day, 00:00 Dublin time)
function getDublinMonthStart() {
  const now = new Date()

  // Convert to Dublin time
  const dublinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Dublin"}))

  const monthStart = new Date(dublinTime.getFullYear(), dublinTime.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

// Reset monthly free credits if needed
async function resetMonthlyCreditsIfNeeded(userId, entitlement) {
  if (!entitlement || entitlement.plan !== 'standard') return entitlement

  const monthStart = getDublinMonthStart()
  const needsReset = !entitlement.lastMonthlyReset || new Date(entitlement.lastMonthlyReset) < monthStart

  if (needsReset) {
    const updatedEntitlement = await prisma.entitlement.update({
      where: { userId },
      data: {
        freeCreditsThisMonth: 6, // Reset to 6 free credits (capped, no accumulation)
        lastMonthlyReset: monthStart
      }
    })
    return updatedEntitlement
  }

  return entitlement
}

// Get or create user entitlement with monthly credit reset
export async function getUserEntitlement(userId) {
  if (!userId) return null

  let entitlement = await prisma.entitlement.findUnique({
    where: { userId }
  })

  if (!entitlement) {
    // Create default standard entitlement for new logged-in users
    entitlement = await prisma.entitlement.create({
      data: {
        userId,
        plan: 'standard',
        status: 'active',
        creditBalance: 0, // New users start with 0 purchased credits
        freeCreditsThisMonth: 6, // Start with 6 free credits
        lastMonthlyReset: getDublinMonthStart(),
        features: {
          docx: false,
          cover_letter: true,
          max_req_per_min: 20
        }
      }
    })
  } else {
    // Reset monthly free credits if needed (only for standard users)
    entitlement = await resetMonthlyCreditsIfNeeded(userId, entitlement)
  }

  return entitlement
}

// Check if user can perform an action
export async function checkCreditAvailability(userId, action = 'generation') {
  if (!userId) {
    return { allowed: false, message: 'Authentication required' }
  }

  const entitlement = await getUserEntitlement(userId)
  const plan = PLANS[entitlement.plan] || PLANS.standard

  // Pro users have unlimited credits
  if (plan.credits === 'unlimited') {
    // Still check monthly limits for pro users
    if (entitlement.plan === 'pro_monthly' || entitlement.plan === 'pro_annual') {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      if (action === 'generation') {
        const monthlyGenerations = await prisma.apiUsage.count({
          where: {
            userId,
            route: 'generation',
            createdAt: { gte: monthStart }
          }
        })

        if (monthlyGenerations >= plan.monthly_generation_cap) {
          return {
            allowed: false,
            message: `Monthly generation limit exceeded. You have used ${monthlyGenerations}/${plan.monthly_generation_cap} generations this month.`,
            monthlyUsage: monthlyGenerations,
            monthlyLimit: plan.monthly_generation_cap
          }
        }
      }
    }

    return {
      allowed: true,
      plan: entitlement.plan,
      credits: 'unlimited'
    }
  }

  // Standard users use free credits first, then purchased credits
  if (plan.credits === 'balance') {
    const totalCredits = entitlement.freeCreditsThisMonth + entitlement.creditBalance

    // For downloads, check if this plan requires credits for downloads
    if (action === 'download' && plan.downloads_cost_credits && totalCredits <= 0) {
      return {
        allowed: false,
        message: 'Insufficient credits. Downloads cost 1 credit each. Please purchase a credit pack to continue.',
        credits: {
          free: entitlement.freeCreditsThisMonth,
          purchased: entitlement.creditBalance,
          total: totalCredits
        },
        needsPurchase: true
      }
    }

    // For generation, always check credits
    if (action === 'generation' && totalCredits <= 0) {
      return {
        allowed: false,
        message: 'Insufficient credits. Please purchase a credit pack to continue.',
        credits: {
          free: entitlement.freeCreditsThisMonth,
          purchased: entitlement.creditBalance,
          total: totalCredits
        },
        needsPurchase: true
      }
    }

    return {
      allowed: true,
      plan: entitlement.plan,
      credits: {
        free: entitlement.freeCreditsThisMonth,
        purchased: entitlement.creditBalance,
        total: totalCredits
      }
    }
  }

  // Trial users - fallback to old system (for anonymous users)
  return {
    allowed: false,
    message: 'Please sign in to continue',
    credits: 0
  }
}

// Consume a credit (free credits first, then purchased credits)
export async function consumeCredit(userId, action = 'generation') {
  if (!userId) return false

  const entitlement = await getUserEntitlement(userId)
  const plan = PLANS[entitlement.plan] || PLANS.standard

  // Pro users don't consume credits
  if (plan.credits === 'unlimited') {
    return true
  }

  // Standard users consume credits: free first, then purchased
  if (plan.credits === 'balance') {
    // For downloads, only consume credits if plan requires it
    if (action === 'download' && !plan.downloads_cost_credits) {
      return true // Downloads are free for this plan
    }

    const totalCredits = entitlement.freeCreditsThisMonth + entitlement.creditBalance

    if (totalCredits <= 0) {
      return false
    }

    // Use free credits first
    if (entitlement.freeCreditsThisMonth > 0) {
      await prisma.entitlement.update({
        where: { userId },
        data: {
          freeCreditsThisMonth: entitlement.freeCreditsThisMonth - 1
        }
      })
      return true
    }

    // Then use purchased credits
    if (entitlement.creditBalance > 0) {
      await prisma.entitlement.update({
        where: { userId },
        data: {
          creditBalance: entitlement.creditBalance - 1
        }
      })
      return true
    }
  }

  return false
}

// Add credits to user balance
export async function addCredits(userId, credits, source = 'purchase') {
  if (!userId || credits <= 0) return false

  const entitlement = await getUserEntitlement(userId)

  await prisma.entitlement.update({
    where: { userId },
    data: {
      creditBalance: entitlement.creditBalance + credits
    }
  })

  return true
}

// Create a credit purchase record
export async function createCreditPurchase(userId, packId, stripePaymentId = null) {
  const pack = CREDIT_PACKS[packId]
  if (!pack) throw new Error('Invalid credit pack')

  return await prisma.creditPurchase.create({
    data: {
      userId,
      stripePaymentId,
      packSize: pack.credits,
      amountPaid: pack.price,
      creditsGranted: pack.credits,
      status: 'pending'
    }
  })
}

// Complete a credit purchase (called by webhook)
export async function completeCreditPurchase(stripePaymentId) {
  const purchase = await prisma.creditPurchase.findUnique({
    where: { stripePaymentId }
  })

  if (!purchase || purchase.status !== 'pending') {
    throw new Error('Purchase not found or already processed')
  }

  // Add credits to user balance
  await addCredits(purchase.userId, purchase.creditsGranted, 'purchase')

  // Mark purchase as completed
  await prisma.creditPurchase.update({
    where: { id: purchase.id },
    data: {
      status: 'completed',
      processedAt: new Date()
    }
  })

  return purchase
}

// Get user's credit history
export async function getCreditHistory(userId, limit = 10) {
  if (!userId) return []

  return await prisma.creditPurchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

// Check feature availability
export function hasFeature(entitlement, feature) {
  if (!entitlement) return false

  const plan = PLANS[entitlement.plan] || PLANS.standard

  switch (feature) {
    case 'docx':
      return plan.docx
    case 'all_templates':
      return plan.templates === 'all'
    case 'all_colors':
      return plan.colors === 'all'
    default:
      return false
  }
}

// Track API usage
export async function trackApiUsage(userId, route) {
  if (!userId || !route) return

  try {
    await prisma.apiUsage.create({
      data: {
        userId,
        route,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error tracking API usage:', error)
  }
}

// Check and consume download for a specific saved resume
export async function checkAndConsumeDownload(userId, resumeId) {
  if (!userId || !resumeId) return { allowed: false, message: 'Invalid request' }

  try {
    // Find the specific saved resume
    const savedResume = await prisma.savedResume.findFirst({
      where: {
        id: resumeId,
        userId: userId
      }
    })

    if (!savedResume) {
      return { allowed: false, message: 'Resume not found' }
    }

    if (savedResume.downloadsRemaining <= 0) {
      return {
        allowed: false,
        message: 'Download limit reached for this document. Generate a new version to get 10 more downloads.',
        downloadsRemaining: 0
      }
    }

    // Consume one download
    await prisma.savedResume.update({
      where: { id: resumeId },
      data: { downloadsRemaining: savedResume.downloadsRemaining - 1 }
    })

    return {
      allowed: true,
      downloadsRemaining: savedResume.downloadsRemaining - 1
    }
  } catch (error) {
    console.error('Error checking download availability:', error)
    return { allowed: false, message: 'Error checking download availability' }
  }
}

// Get download status for a saved resume
export async function getDownloadStatus(userId, resumeId) {
  if (!userId || !resumeId) return null

  try {
    const savedResume = await prisma.savedResume.findFirst({
      where: {
        id: resumeId,
        userId: userId
      },
      select: {
        id: true,
        downloadsRemaining: true,
        createdAt: true
      }
    })

    return savedResume
  } catch (error) {
    console.error('Error getting download status:', error)
    return null
  }
}

// Get display info for user's current status
export async function getUserCreditStatus(userId) {
  if (!userId) return null

  const entitlement = await getUserEntitlement(userId)
  const plan = PLANS[entitlement.plan] || PLANS.standard

  if (plan.credits === 'unlimited') {
    return {
      plan: entitlement.plan,
      planDisplay: plan.displayName,
      credits: 'unlimited',
      canPurchase: false
    }
  }

  const totalCredits = entitlement.freeCreditsThisMonth + entitlement.creditBalance

  return {
    plan: entitlement.plan,
    planDisplay: plan.displayName,
    credits: {
      free: entitlement.freeCreditsThisMonth,
      purchased: entitlement.creditBalance,
      total: totalCredits
    },
    canPurchase: true,
    needsCredits: totalCredits <= 3, // Show warning when total credits are low
    monthlyResetDate: entitlement.lastMonthlyReset ? new Date(entitlement.lastMonthlyReset.getFullYear(), entitlement.lastMonthlyReset.getMonth() + 1, 1) : null
  }
}