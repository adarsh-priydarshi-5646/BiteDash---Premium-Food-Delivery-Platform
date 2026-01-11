/**
 * Gzip Compression - Compresses responses > 1KB
 */
import zlib from 'zlib';

export const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length < 1024) {
      return originalJson(data);
    }

    if (acceptEncoding.includes('gzip')) {
      zlib.gzip(jsonString, (err, compressed) => {
        if (err) {
          return originalJson(data);
        }
        
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', compressed.length);
        res.end(compressed);
      });
    } else {
      return originalJson(data);
    }
  };

  next();
};
