import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getDayPassUsage } from '../../lib/credit-system'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const usage = await getDayPassUsage(session.user.id)
    
    return res.status(200).json(usage)
  } catch (error) {
    console.error('Day pass usage API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}