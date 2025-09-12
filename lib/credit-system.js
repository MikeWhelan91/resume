import { prisma } from './prisma.js'

const PLANS = {
  free: {
    weekly_credits: 15,
    docx: false,
    templates: 1, // only Professional
    colors: 1, // only default
    max_profiles: 1,
    monthly_generation_cap: null,
    monthly_download_cap: null,
    rate_limit_rpm: 10
  },
  day_pass: {
    weekly_credits: null, // no weekly limit
    daily_generation_cap: 100,
    docx: true,
    templates: 'all',
    colors: 'all',
    max_profiles: 10,
    rate_limit_rpm: 30
  },
  pro_monthly: {
    weekly_credits: null, // no weekly limit
    monthly_generation_cap: 300,
    monthly_download_cap: 2000,
    docx: true,
    templates: 'all',
    colors: 'all',
    max_profiles: 10,
    rate_limit_rpm: 30
  },
  pro_annual: {
    weekly_credits: null, // no weekly limit
    monthly_generation_cap: 300,
    monthly_download_cap: 2000,
    docx: true,
    templates: 'all',
    colors: 'all',
    max_profiles: 10,
    rate_limit_rpm: 30
  }
}

// Get the start of the current week (Monday 00:00 Dublin time)
function getDublinWeekStart() {
  const now = new Date()
  
  // Convert to Dublin time
  const dublinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Dublin"}))
  
  const dayOfWeek = dublinTime.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, so adjust
  const weekStart = new Date(dublinTime.getFullYear(), dublinTime.getMonth(), dublinTime.getDate() - daysFromMonday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Check if a day-pass has expired
function isDayPassExpired(expiresAt) {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

// Get effective plan (handle day-pass expiry)
function getEffectivePlan(entitlement) {
  if (!entitlement) return 'free'
  
  // Check if day-pass has expired
  if (entitlement.plan === 'day_pass' && isDayPassExpired(entitlement.expiresAt)) {
    return 'free'
  }
  
  return entitlement.plan
}

// Reset weekly credits if needed
async function resetWeeklyCreditsIfNeeded(userId, entitlement) {
  if (!entitlement || entitlement.plan !== 'free') return entitlement
  
  const weekStart = getDublinWeekStart()
  const needsReset = !entitlement.lastWeeklyReset || new Date(entitlement.lastWeeklyReset) < weekStart
  
  if (needsReset) {
    const updatedEntitlement = await prisma.entitlement.update({
      where: { userId },
      data: {
        freeWeeklyCreditsRemaining: 15,
        lastWeeklyReset: weekStart
      }
    })
    return updatedEntitlement
  }
  
  return entitlement
}

// Get or create user entitlement with credit reset
export async function getUserEntitlementWithCredits(userId) {
  if (!userId) return null

  let entitlement = await prisma.entitlement.findUnique({
    where: { userId }
  })

  if (!entitlement) {
    // Create default free entitlement
    entitlement = await prisma.entitlement.create({
      data: {
        userId,
        plan: 'free',
        status: 'active',
        freeWeeklyCreditsRemaining: 15,
        lastWeeklyReset: getDublinWeekStart(),
        features: {
          docx: false,
          cover_letter: true,
          max_req_per_min: 10
        }
      }
    })
  } else {
    // Reset weekly credits if needed
    entitlement = await resetWeeklyCreditsIfNeeded(userId, entitlement)
  }

  return entitlement
}

// Check if user can perform an action (generation/download)
export async function checkCreditAvailability(userId, action = 'generation') {
  if (!userId) {
    return { allowed: false, message: 'Authentication required' }
  }

  const entitlement = await getUserEntitlementWithCredits(userId)
  const effectivePlan = getEffectivePlan(entitlement)
  const planLimits = PLANS[effectivePlan] || PLANS.free

  // Free plan credit check
  if (effectivePlan === 'free') {
    if ((action === 'generation' || action === 'download') && entitlement.freeWeeklyCreditsRemaining <= 0) {
      return {
        allowed: false,
        message: 'Weekly credits exhausted. You have 0/15 credits remaining this week.',
        credits: entitlement.freeWeeklyCreditsRemaining,
        resetTime: getDublinWeekStart()
      }
    }
  }

  // Day-pass daily limit check
  if (effectivePlan === 'day_pass') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayGenerations = await prisma.apiUsage.count({
      where: {
        userId,
        route: 'generation',
        createdAt: { gte: today }
      }
    })

    if (todayGenerations >= planLimits.daily_generation_cap) {
      return {
        allowed: false,
        message: `Daily generation limit exceeded. You have used ${todayGenerations}/${planLimits.daily_generation_cap} generations today.`,
        dailyUsage: todayGenerations,
        dailyLimit: planLimits.daily_generation_cap
      }
    }
  }

  // Pro monthly limits check
  if (effectivePlan === 'pro_monthly' || effectivePlan === 'pro_annual') {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthlyGenerations = await prisma.apiUsage.count({
      where: {
        userId,
        route: 'generation',
        createdAt: { gte: monthStart }
      }
    })

    if (monthlyGenerations >= planLimits.monthly_generation_cap) {
      return {
        allowed: false,
        message: `Monthly generation limit exceeded. You have used ${monthlyGenerations}/${planLimits.monthly_generation_cap} generations this month.`,
        monthlyUsage: monthlyGenerations,
        monthlyLimit: planLimits.monthly_generation_cap
      }
    }
    
    if (action === 'download') {
      const monthlyDownloads = await prisma.apiUsage.count({
        where: {
          userId,
          route: { in: ['pdf-download', 'docx-download'] },
          createdAt: { gte: monthStart }
        }
      })

      if (monthlyDownloads >= planLimits.monthly_download_cap) {
        return {
          allowed: false,
          message: `Monthly download limit exceeded. You have used ${monthlyDownloads}/${planLimits.monthly_download_cap} downloads this month.`,
          monthlyDownloads,
          monthlyDownloadLimit: planLimits.monthly_download_cap
        }
      }
    }
  }

  return {
    allowed: true,
    plan: effectivePlan,
    credits: entitlement.freeWeeklyCreditsRemaining
  }
}

// Consume a credit for free users
export async function consumeCredit(userId, action = 'generation') {
  if (!userId) return false

  const entitlement = await getUserEntitlementWithCredits(userId)
  const effectivePlan = getEffectivePlan(entitlement)

  // Only consume credits for free users
  if (effectivePlan === 'free' && (action === 'generation' || action === 'download')) {
    if (entitlement.freeWeeklyCreditsRemaining > 0) {
      await prisma.entitlement.update({
        where: { userId },
        data: {
          freeWeeklyCreditsRemaining: entitlement.freeWeeklyCreditsRemaining - 1
        }
      })
      return true
    }
    return false
  }

  return true // Pro users don't consume credits
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

// Check feature availability
export function hasFeature(entitlement, feature) {
  if (!entitlement) return false
  
  const effectivePlan = getEffectivePlan(entitlement)
  const planLimits = PLANS[effectivePlan] || PLANS.free
  
  switch (feature) {
    case 'docx':
      return planLimits.docx
    case 'all_templates':
      return planLimits.templates === 'all'
    case 'all_colors':
      return planLimits.colors === 'all'
    default:
      return false
  }
}

export { PLANS, getEffectivePlan }