import { prisma } from '../../lib/prisma';

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '127.0.0.1';
}

export default async function handler(req, res) {
  const ipAddress = getClientIP(req);

  if (req.method === 'GET') {
    // Get trial usage for this IP
    try {
      const trialUsage = await prisma.trialUsage.findUnique({
        where: { ipAddress },
        select: {
          generationsUsed: true,
          downloadsUsed: true,
          updatedAt: true
        }
      });

      const usage = trialUsage || {
        generationsUsed: 0,
        downloadsUsed: 0,
        updatedAt: null
      };

      return res.status(200).json({
        generationsUsed: usage.generationsUsed,
        downloadsUsed: usage.downloadsUsed,
        generationsLimit: 2,
        downloadsLimit: 2,
        canGenerate: usage.generationsUsed < 2,
        canDownload: usage.downloadsUsed < 2,
        lastUsed: usage.updatedAt
      });
    } catch (error) {
      console.error('Error fetching trial usage:', error);
      // Return fail-secure data if database is unavailable
      return res.status(200).json({
        generationsUsed: 2,
        downloadsUsed: 2,
        generationsLimit: 2,
        downloadsLimit: 2,
        canGenerate: false,
        canDownload: false,
        lastUsed: null
      });
    }
  }

  if (req.method === 'POST') {
    // Increment trial usage
    const { type } = req.body; // 'generation' or 'download'
    
    if (!type || !['generation', 'download'].includes(type)) {
      return res.status(400).json({ error: 'Invalid usage type. Must be "generation" or "download"' });
    }

    try {
      // Get current usage
      const currentUsage = await prisma.trialUsage.findUnique({
        where: { ipAddress }
      });

      const currentGenerations = currentUsage?.generationsUsed || 0;
      const currentDownloads = currentUsage?.downloadsUsed || 0;

      // Check limits
      if (type === 'generation' && currentGenerations >= 2) {
        return res.status(429).json({ 
          error: 'Trial credit limit reached. Please sign up for unlimited access.',
          code: 'TRIAL_GENERATION_LIMIT'
        });
      }

      if (type === 'download' && currentDownloads >= 2) {
        return res.status(429).json({ 
          error: 'Trial download limit reached. Please sign up for unlimited access.',
          code: 'TRIAL_DOWNLOAD_LIMIT'
        });
      }

      // Update usage
      const updateData = type === 'generation' 
        ? { generationsUsed: currentGenerations + 1 }
        : { downloadsUsed: currentDownloads + 1 };

      const updatedUsage = await prisma.trialUsage.upsert({
        where: { ipAddress },
        update: {
          ...updateData,
          updatedAt: new Date()
        },
        create: {
          ipAddress,
          generationsUsed: type === 'generation' ? 1 : 0,
          downloadsUsed: type === 'download' ? 1 : 0
        }
      });

      return res.status(200).json({
        success: true,
        generationsUsed: updatedUsage.generationsUsed,
        downloadsUsed: updatedUsage.downloadsUsed,
        generationsLimit: 2,
        downloadsLimit: 2,
        canGenerate: updatedUsage.generationsUsed < 2,
        canDownload: updatedUsage.downloadsUsed < 2
      });
    } catch (error) {
      console.error('Error updating trial usage:', error);
      // Return success with fallback data if database is unavailable
      return res.status(200).json({
        success: true,
        generationsUsed: type === 'generation' ? 1 : 0,
        downloadsUsed: type === 'download' ? 1 : 0,
        generationsLimit: 2,
        downloadsLimit: 2,
        canGenerate: type === 'generation' ? false : true,
        canDownload: type === 'download' ? false : true
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}