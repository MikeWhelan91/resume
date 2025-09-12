import { prisma } from './prisma.js'

const USAGE_LIMITS = {
  free: {
    pdf_downloads_per_week: 10,
    docx_downloads_per_week: 0, // Free users don't get DOCX
    generations_per_week: 2
  },
  day_pass: {
    pdf_downloads_per_day: 100, // Day pass daily limit
    docx_downloads_per_day: 100, // Day pass daily limit  
    generations_per_day: 30, // Day pass daily limit
    pdf_downloads_per_week: null, // Not applicable for day pass
    docx_downloads_per_week: null, // Not applicable for day pass
    generations_per_week: null // Not applicable for day pass
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

// Get the start of the current day
function getDayStart() {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  dayStart.setHours(0, 0, 0, 0)
  return dayStart
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
  
  // Use daily limits for day pass users, weekly for others
  const isDayPass = userPlan === 'day_pass'
  const timeStart = isDayPass ? getDayStart() : getWeekStart()
  const timePeriod = isDayPass ? 'day' : 'week'

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
      limitKey = isDayPass ? 'pdf_downloads_per_day' : 'pdf_downloads_per_week'
    } else if (route === 'docx-download') {
      limitKey = isDayPass ? 'docx_downloads_per_day' : 'docx_downloads_per_week'
    } else if (route === 'generate-resume' || route === 'generate-cover-letter') {
      limitKey = isDayPass ? 'generations_per_day' : 'generations_per_week'
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