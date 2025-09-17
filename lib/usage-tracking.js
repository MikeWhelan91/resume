import { prisma } from './prisma.js'

const USAGE_LIMITS = {
  standard: {
    pdf_downloads_per_month: null, // Downloads are limited per document instead
    docx_downloads_per_month: 0, // DOCX not available on Standard
    generations_per_month: 100 // Soft cap safeguard
  },
  pro_monthly: {
    pdf_downloads_per_month: null,
    docx_downloads_per_month: null,
    generations_per_month: null
  },
  pro_annual: {
    pdf_downloads_per_month: null,
    docx_downloads_per_month: null,
    generations_per_month: null
  }
}

// Get the start of the current month
function getMonthStart() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

export async function trackUsage(userId, route) {
  if (!userId || !route) {
    throw new Error('User ID and route are required for usage tracking')
  }

  try {
    await prisma.apiUsage.create({
      data: {
        userId,
        route,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error tracking usage:', error)
    // Don't throw error to avoid breaking the main functionality
  }
}

export async function checkUsageLimit(userId, route, userPlan = 'standard') {
  if (!userId) {
    return { allowed: false, message: 'Authentication required' }
  }

  const limits = USAGE_LIMITS[userPlan] || USAGE_LIMITS.standard
  const timeStart = getMonthStart()
  const timePeriod = 'month'

  try {
    // Count usage for the appropriate time period
    const usage = await prisma.apiUsage.count({
      where: {
        userId,
        route,
        createdAt: {
          gte: timeStart
        }
      }
    })

    // Determine the limit based on the route and user plan
    let limitKey
    if (route === 'pdf-download') {
      limitKey = 'pdf_downloads_per_month'
    } else if (route === 'docx-download') {
      limitKey = 'docx_downloads_per_month'
    } else if (route === 'generate-resume' || route === 'generate-cover-letter') {
      limitKey = 'generations_per_month'
    } else {
      // Unknown route, allow it
      return { allowed: true, usage, limit: null }
    }

    const limit = limits[limitKey]
    
    // If limit is null (like for pro users), allow unlimited
    if (limit === null || limit === undefined) {
      return { allowed: true, usage, limit: null }
    }
    
    if (usage >= limit) {
      return {
        allowed: false,
        usage,
        limit,
        message: `${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}ly limit exceeded. You have used ${usage}/${limit} ${route}s this ${timePeriod}.`
      }
    }

    return { allowed: true, usage, limit, remaining: limit == null ? null : (limit - usage) }
  } catch (error) {
    console.error('Error checking usage limit:', error)
    // In case of error, allow the action to prevent blocking users
    return { allowed: true, usage: 0, limit: null, error: 'Could not check usage limit' }
  }
}

export async function getUserWeeklyUsage(userId) {
  if (!userId) {
    return null
  }

  const weekStart = getMonthStart()

  try {
    const usage = await prisma.apiUsage.groupBy({
      by: ['route'],
      where: {
        userId,
        createdAt: {
          gte: weekStart
        }
      },
      _count: {
        route: true
      }
    })

    // Convert to object format
    const usageObject = {}
    usage.forEach(item => {
      usageObject[item.route] = item._count.route
    })

    return {
      weekStart: weekStart.toISOString(),
      usage: usageObject
    }
  } catch (error) {
    console.error('Error getting user weekly usage:', error)
    return null
  }
}
