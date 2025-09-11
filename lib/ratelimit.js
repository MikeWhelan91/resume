import { getServerSession } from 'next-auth/next'
import NextAuth from '../pages/api/auth/[...nextauth]'
import { getUserEntitlement } from './entitlements.js'

const buckets = new Map();

export function withLimiter(handler, { limit = 10, windowMs = 60_000 } = {}) {
  return async (req, res) => {
    const key =
      (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "ip") +
      ":" +
      (req.headers["user-agent"] || "");
    const now = Date.now();
    let slot = buckets.get(key);
    if (!slot || now > slot.reset) slot = { count: 0, reset: now + windowMs };
    slot.count += 1;
    buckets.set(key, slot);

    if (slot.count > limit) {
      res.setHeader("Retry-After", Math.ceil((slot.reset - now) / 1000));
      return res.status(429).json({ error: "Too many requests", code: "E_RATE_LIMIT" });
    }
    return handler(req, res);
  };
}

export function withUserRateLimit(handler, { freeLimit = 10, proLimit = 60, windowMs = 60_000 } = {}) {
  return async (req, res) => {
    const session = await getServerSession(req, res, NextAuth)
    
    // For unauthenticated users, use IP-based limiting with free limits
    if (!session?.user?.id) {
      return withLimiter(handler, { limit: freeLimit, windowMs })(req, res)
    }
    
    const userId = session.user.id
    const entitlement = await getUserEntitlement(userId)
    const userLimit = entitlement?.features?.max_req_per_min || freeLimit
    
    const key = `user:${userId}`
    const now = Date.now()
    let slot = buckets.get(key)
    
    if (!slot || now > slot.reset) {
      slot = { count: 0, reset: now + windowMs }
    }
    
    slot.count += 1
    buckets.set(key, slot)
    
    if (slot.count > userLimit) {
      res.setHeader("Retry-After", Math.ceil((slot.reset - now) / 1000))
      return res.status(429).json({ 
        error: "Rate limit exceeded", 
        code: "E_RATE_LIMIT",
        limit: userLimit,
        upgradeRequired: userLimit === freeLimit
      })
    }
    
    return handler(req, res)
  }
}
