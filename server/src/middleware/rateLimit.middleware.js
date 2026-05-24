const buckets = new Map();

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 20,
  message = 'Too many requests. Please try again shortly.',
} = {}) => {
  return (req, res, next) => {
    const identity = req.user?._id?.toString() || req.ip || 'anonymous';
    const key = `${identity}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - current.count)));

    if (current.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
};
