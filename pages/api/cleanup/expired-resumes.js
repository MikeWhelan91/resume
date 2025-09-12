import { cleanupExpiredResumes } from '../../../lib/credit-system.js'

export default async function handler(req, res) {
  // Only allow POST requests and check for authorization
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple security check - you might want to add proper API key auth
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CLEANUP_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const deletedCount = await cleanupExpiredResumes()
    
    return res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} expired resumes`,
      deletedCount
    })
  } catch (error) {
    console.error('Cleanup API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}