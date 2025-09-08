// Middleware to add security headers for embedded polls
const embedSecurityMiddleware = (req, res, next) => {
  // Only apply these headers for embedded poll routes
  if (req.path.startsWith('/embed/') || req.path.includes('/embed')) {
    // Content Security Policy - restrict what resources can be loaded
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + 
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' " + (process.env.SOCKET_URL || 'http://localhost:5000') + "; " +
      "frame-ancestors *; " + // Allow embedding in any site
      "base-uri 'self';"
    );
    
    // Prevent browsers from MIME-sniffing a response away from the declared Content-Type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevents the browser from rendering the page if it detects a reflected XSS attack
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Allow embedding in iframes
    res.setHeader('X-Frame-Options', 'ALLOW-FROM *');
  }
  
  next();
};

module.exports = embedSecurityMiddleware;
