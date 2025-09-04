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
