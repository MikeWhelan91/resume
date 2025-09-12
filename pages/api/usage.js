import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getUserWeeklyUsage } from '../../lib/usage-tracking'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const usage = await getUserWeeklyUsage(session.user.id)
    
    return res.status(200).json(usage || { weekStart: new Date().toISOString(), usage: {} })
  } catch (error) {
    console.error('Usage API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}