import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getEffectivePlan } from '../../lib/credit-system'
import { getUserEntitlement } from '../../lib/credit-purchase-system'

// Get the start of the current month
function getMonthStart() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
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
    
    // Track downloads from the start of the current month
    const timeStart = getMonthStart()
    
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
      period: 'month',
      userPlan
    })
  } catch (error) {
    console.error('Download usage fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
