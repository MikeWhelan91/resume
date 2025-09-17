import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'
import { getUserEntitlement } from '../../../lib/credit-purchase-system.js'
import { calculateResumeExpiryDate } from '../../../lib/credit-system.js'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.id

    if (req.method === 'GET') {
      // Get all saved resumes for the user (excluding expired ones)
      const resumes = await prisma.savedResume.findMany({
        where: { 
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          template: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          isLatest: true
        }
      })

      return res.status(200).json(resumes)
    }

    if (req.method === 'POST') {
      const { data, name, template = 'classic' } = req.body

      if (!data) {
        return res.status(400).json({ error: 'Resume data is required' })
      }

      // Get user entitlement to check storage limits
      const entitlement = await getUserEntitlement(userId)
      
      // Check storage limits
      // Basic storage policy: keep max N recent resumes based on plan
      const maxSaved = entitlement.plan && entitlement.plan.startsWith('pro_') ? 50 : 5
      const currentCount = await prisma.savedResume.count({ where: { userId } })
      if (currentCount >= maxSaved) {
        // If at limit, delete oldest resume to make space
        const oldestResume = await prisma.savedResume.findFirst({
          where: {
            userId,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          orderBy: { createdAt: 'asc' }
        })

        if (oldestResume) {
          await prisma.savedResume.delete({
            where: { id: oldestResume.id }
          })
        }
      }

      // Calculate expiry date
      const expiresAt = calculateResumeExpiryDate(entitlement)

      // Mark all existing resumes as not latest
      await prisma.savedResume.updateMany({
        where: { userId, isLatest: true },
        data: { isLatest: false }
      })

      // Create new resume
      const savedResume = await prisma.savedResume.create({
        data: {
          userId,
          data,
          name,
          template,
          expiresAt,
          isLatest: true
        }
      })

      return res.status(201).json({ 
        id: savedResume.id,
        expiresAt: savedResume.expiresAt,
        message: 'Resume saved successfully' 
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Resume API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
