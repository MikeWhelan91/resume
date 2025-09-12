import { prisma } from './prisma.js'

const USAGE_LIMITS = {
  free: {
    pdf_downloads_per_week: 2,
    docx_downloads_per_week: 0, // Free users don't get DOCX
    generations_per_week: 2
  },
  pro_daily: {
    pdf_downloads_per_week: 20,
    docx_downloads_per_week: 20,
    generations_per_week: 20
  },
  pro_monthly: {
    pdf_downloads_per_week: 100,
    docx_downloads_per_week: 100,
    generations_per_week: 100
  },
  pro_annual: {
    pdf_downloads_per_week: 1000,
    docx_downloads_per_week: 1000,
    generations_per_week: 1000
  }
}

// Get the start of the current week (Monday)
function getWeekStart() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, so adjust
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
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

export async function checkUsageLimit(userId, route, userPlan = 'free') {
  if (!userId) {
    return { allowed: false, message: 'Authentication required' }
  }

  const limits = USAGE_LIMITS[userPlan] || USAGE_LIMITS.free
  const weekStart = getWeekStart()

  try {
    // Count usage for this week
    const weeklyUsage = await prisma.apiUsage.count({
      where: {
        userId,
        route,
        createdAt: {
          gte: weekStart
        }
      }
    })

    // Determine the limit based on the route
    let limitKey
    if (route === 'pdf-download') {
      limitKey = 'pdf_downloads_per_week'
    } else if (route === 'docx-download') {
      limitKey = 'docx_downloads_per_week'
    } else if (route === 'generate-resume' || route === 'generate-cover-letter') {
      limitKey = 'generations_per_week'
    } else {
      // Unknown route, allow it
      return { allowed: true, usage: weeklyUsage, limit: null }
    }

    const limit = limits[limitKey]
    
    if (weeklyUsage >= limit) {
      return {
        allowed: false,
        usage: weeklyUsage,
        limit,
        message: `Weekly limit exceeded. You have used ${weeklyUsage}/${limit} ${route}s this week.`
      }
    }

    return {
      allowed: true,
      usage: weeklyUsage,
      limit,
      remaining: limit - weeklyUsage
    }
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

  const weekStart = getWeekStart()

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