/**
 * In-Memory Cache with TTL Support
 * Reduces database load for frequently accessed data
 * For distributed systems, replace with Redis
 */
class Cache {
  constructor() {
    this.store = new Map();
    this.ttlStore = new Map();
    // Auto-cleanup expired entries every 60s
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key, value, ttlSeconds = 300) {
    this.store.set(key, value);
    this.ttlStore.set(key, Date.now() + ttlSeconds * 1000);
  }

  get(key) {
    const expiry = this.ttlStore.get(key);
    if (!expiry || Date.now() > expiry) {
      this.delete(key);
      return null;
    }
    return this.store.get(key);
  }

  delete(key) {
    this.store.delete(key);
    this.ttlStore.delete(key);
  }

  invalidate(pattern) {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttlStore.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
    this.ttlStore.clear();
  }

  stats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

export const cache = new Cache();

/**
 * Express middleware for automatic response caching
 * Only caches GET requests, intercepts res.json to store response
 */
export const cacheMiddleware = (ttlSeconds = 60) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, ttlSeconds);
      return originalJson(data);
    };

    next();
  };
};
