/**
 * Security Headers Middleware
 * Protects against common web vulnerabilities (XSS, clickjacking, MIME sniffing)
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');                    // Prevent clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff');          // Prevent MIME sniffing
  res.setHeader('X-XSS-Protection', '1; mode=block');          // XSS filter
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');                            // Hide server info
  next();
};

/**
 * Request Sanitizer
 * Prevents NoSQL injection by removing MongoDB operators from input
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    // Remove keys starting with $ (MongoDB operators) or containing dots
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

export const requestSizeLimiter = (maxSizeKB = 100) => {
  return (req, res, next) => {
    let size = 0;
    
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSizeKB * 1024) {
        res.status(413).json({ error: 'Request too large' });
        req.destroy();
      }
    });
    
    next();
  };
};
