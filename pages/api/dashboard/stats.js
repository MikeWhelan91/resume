import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

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

    // Get various statistics using Prisma
    const [
      totalResumes,
      resumesThisMonth,
      resumesThisWeek
    ] = await Promise.all([
      // Total resumes
      prisma.savedResume.count({
        where: { userId }
      }),

      // Resumes created this month
      prisma.savedResume.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Resumes created this week
      prisma.savedResume.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    ])

    // ATS scores are currently only shown during generation (not stored in DB)
    // This will show null until we add atsScore field to SavedResume model
    const avgAtsResult = { _avg: { atsScore: null } }

    const stats = {
      totalResumes,
      resumesThisMonth,
      totalDownloads: totalResumes * 2, // Estimate 2 downloads per resume
      downloadsThisWeek: resumesThisWeek * 2, // Estimate
      avgAtsScore: avgAtsResult._avg.atsScore ?
        Math.round(avgAtsResult._avg.atsScore) : null
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}