/**
 * Sliding Window Rate Limiter
 * Prevents API abuse and ensures fair resource distribution
 * Uses in-memory storage (use Redis for distributed deployments)
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.WINDOW_MS = 60 * 1000;  // 1 minute sliding window
    setInterval(() => this.cleanup(), 30 * 1000);
  }

  isAllowed(key, maxRequests) {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const timestamps = this.requests.get(key);
    const validTimestamps = timestamps.filter(t => t > windowStart);
    
    if (validTimestamps.length >= maxRequests) {
      // Calculate when the oldest request will expire
      const oldestInWindow = Math.min(...validTimestamps);
      const retryAfter = Math.ceil((oldestInWindow + this.WINDOW_MS - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return { allowed: true, remaining: maxRequests - validTimestamps.length };
  }

  cleanup() {
    const windowStart = Date.now() - this.WINDOW_MS;
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

const limiter = new RateLimiter();

// General API: 200 requests/minute per IP
export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const result = limiter.isAllowed(`api:${ip}`, 200);

  res.setHeader('X-RateLimit-Remaining', result.remaining);
  
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
    });
  }
  
  next();
};

// Auth endpoints: 20 requests/minute (prevents brute force)
export const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const result = limiter.isAllowed(`auth:${ip}`, 20);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: result.retryAfter,
    });
  }
  
  next();
};

// Order placement: 30 requests/minute per user (prevents spam orders)
export const orderRateLimiter = (req, res, next) => {
  const userId = req.userId || req.ip;
  const result = limiter.isAllowed(`order:${userId}`, 30);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Order limit reached. Please wait before placing another order.',
      retryAfter: result.retryAfter,
    });
  }
  
  next();
};

// Search: 60 requests/minute (allows fast typing with debounce)
export const searchRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const result = limiter.isAllowed(`search:${ip}`, 60);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Search limit reached. Please slow down.',
      retryAfter: result.retryAfter,
    });
  }
  
  next();
};
