import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.id

    // Get the most recent resume (that hasn't expired)
    const latestResume = await prisma.savedResume.findFirst({
      where: { 
        userId,
        isLatest: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!latestResume) {
      return res.status(404).json({ error: 'No saved resume found' })
    }

    return res.status(200).json({
      id: latestResume.id,
      data: latestResume.data,
      name: latestResume.name,
      template: latestResume.template,
      createdAt: latestResume.createdAt,
      updatedAt: latestResume.updatedAt,
      expiresAt: latestResume.expiresAt
    })
  } catch (error) {
    console.error('Latest resume API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}