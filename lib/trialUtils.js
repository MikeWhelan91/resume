import { prisma } from './prisma';

// Helper function to get client IP
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '127.0.0.1';
}

// Check if trial user can perform action
export async function checkTrialLimit(req, actionType) {
  const ipAddress = getClientIP(req);
  
  try {
    // Safety check for prisma connection
    if (!prisma) {
      console.error('Prisma client not initialized');
      return { allowed: false, remaining: 0, limit: 2, type: actionType }; // Deny by default if DB is down
    }
    
    const trialUsage = await prisma.trialUsage.findUnique({
      where: { ipAddress }
    });

    const currentGenerations = trialUsage?.generationsUsed || 0;
    const currentDownloads = trialUsage?.downloadsUsed || 0;

    if (actionType === 'generation') {
      return {
        allowed: currentGenerations < 2,
        remaining: Math.max(0, 2 - currentGenerations),
        limit: 2,
        type: 'generation'
      };
    }

    if (actionType === 'download') {
      return {
        allowed: currentDownloads < 2,
        remaining: Math.max(0, 2 - currentDownloads),
        limit: 2,
        type: 'download'
      };
    }

    return { allowed: false, remaining: 0, limit: 0, type: actionType };
  } catch (error) {
    console.error('Error checking trial limit:', error);
    // In case of error, deny the action (fail secure)
    return { allowed: false, remaining: 0, limit: 2, type: actionType };
  }
}

// Consume trial usage
export async function consumeTrialUsage(req, actionType) {
  const ipAddress = getClientIP(req);
  
  try {
    if (!prisma) {
      console.error('Prisma client not initialized in consumeTrialUsage');
      return; // Skip tracking if DB is down
    }
    
    const currentUsage = await prisma.trialUsage.findUnique({
      where: { ipAddress }
    });

    const currentGenerations = currentUsage?.generationsUsed || 0;
    const currentDownloads = currentUsage?.downloadsUsed || 0;

    const updateData = actionType === 'generation' 
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
        generationsUsed: actionType === 'generation' ? 1 : 0,
        downloadsUsed: actionType === 'download' ? 1 : 0
      }
    });

    return {
      success: true,
      generationsUsed: updatedUsage.generationsUsed,
      downloadsUsed: updatedUsage.downloadsUsed,
      generationsRemaining: Math.max(0, 2 - updatedUsage.generationsUsed),
      downloadsRemaining: Math.max(0, 2 - updatedUsage.downloadsUsed)
    };
  } catch (error) {
    console.error('Error consuming trial usage:', error);
    throw error;
  }
}

// Get trial usage status
export async function getTrialUsage(req) {
  const ipAddress = getClientIP(req);
  
  try {
    if (!prisma) {
      console.error('Prisma client not initialized in getTrialUsage');
      // Return fail-secure trial usage data if DB is down
      return {
        generationsUsed: 2,
        downloadsUsed: 2,
        generationsLimit: 2,
        downloadsLimit: 2,
        generationsRemaining: 0,
        downloadsRemaining: 0,
        canGenerate: false,
        canDownload: false,
        lastUsed: null
      };
    }
    
    const trialUsage = await prisma.trialUsage.findUnique({
      where: { ipAddress }
    });

    const generationsUsed = trialUsage?.generationsUsed || 0;
    const downloadsUsed = trialUsage?.downloadsUsed || 0;

    return {
      generationsUsed,
      downloadsUsed,
      generationsLimit: 2,
      downloadsLimit: 2,
      generationsRemaining: Math.max(0, 2 - generationsUsed),
      downloadsRemaining: Math.max(0, 2 - downloadsUsed),
      canGenerate: generationsUsed < 2,
      canDownload: downloadsUsed < 2,
      lastUsed: trialUsage?.updatedAt || null
    };
  } catch (error) {
    console.error('Error fetching trial usage:', error);
    // Return fail-secure values on error
    return {
      generationsUsed: 2,
      downloadsUsed: 2,
      generationsLimit: 2,
      downloadsLimit: 2,
      generationsRemaining: 0,
      downloadsRemaining: 0,
      canGenerate: false,
      canDownload: false,
      lastUsed: null
    };
  }
}