import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getEffectivePlan } from '../../lib/credit-system'
import { getUserEntitlement } from '../../lib/credit-purchase-system'

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const userId = session.user.id
    const entitlement = await getUserEntitlement(userId)
    const userPlan = getEffectivePlan(entitlement)
    
    // Use daily limits for day pass users, weekly for others
    const isDayPass = userPlan === 'day_pass'
    const timeStart = isDayPass ? getDayStart() : getWeekStart()
    
    // Count PDF downloads
    const pdfDownloads = await prisma.apiUsage.count({
      where: {
        userId,
        route: 'pdf-download',
        createdAt: {
          gte: timeStart
        }
      }
    })

    // Count DOCX downloads
    const docxDownloads = await prisma.apiUsage.count({
      where: {
        userId,
        route: 'docx-download',
        createdAt: {
          gte: timeStart
        }
      }
    })

    res.status(200).json({
      pdfDownloads,
      docxDownloads,
      period: isDayPass ? 'day' : 'week',
      userPlan
    })
  } catch (error) {
    console.error('Download usage fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}