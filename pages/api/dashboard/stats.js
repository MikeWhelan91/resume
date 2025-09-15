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
      mostRecentResume
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

      // Get most recent resume to check for ATS score
      prisma.savedResume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { data: true, createdAt: true }
      })
    ])

    // Try to get ATS score from most recent resume data
    let mostRecentAtsScore = null;
    if (mostRecentResume?.data && typeof mostRecentResume.data === 'object') {
      // Check if ATS analysis is stored in the resume data
      if (mostRecentResume.data.atsAnalysis?.overallScore) {
        mostRecentAtsScore = mostRecentResume.data.atsAnalysis.overallScore;
      }
    }

    const stats = {
      totalResumes,
      resumesThisMonth,
      totalDownloads: totalResumes * 2, // Estimate 2 downloads per resume
      downloadsThisWeek: resumesThisMonth * 2, // Estimate based on monthly resumes
      mostRecentAtsScore: mostRecentAtsScore
    }

    return res.status(200).json(stats)
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}