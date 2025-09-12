import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma.js'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = session.user.id
    const { id } = req.query

    if (req.method === 'GET') {
      // Get specific resume
      const resume = await prisma.savedResume.findFirst({
        where: { 
          id,
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' })
      }

      return res.status(200).json({
        id: resume.id,
        data: resume.data,
        name: resume.name,
        template: resume.template,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        expiresAt: resume.expiresAt
      })
    }

    if (req.method === 'DELETE') {
      // Delete specific resume
      const resume = await prisma.savedResume.findFirst({
        where: { 
          id,
          userId
        }
      })

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' })
      }

      await prisma.savedResume.delete({
        where: { id }
      })

      return res.status(200).json({ message: 'Resume deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Resume API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}