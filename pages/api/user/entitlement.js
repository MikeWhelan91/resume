import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getUserEntitlement } from '../../../lib/entitlements.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const entitlement = await getUserEntitlement(session.user.id)
    res.status(200).json(entitlement)
  } catch (error) {
    console.error('Entitlement fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}