const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - user must be logged in
exports.protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in cookies or headers
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update last seen
    req.user.lastSeen = Date.now();
    await req.user.save({ validateBeforeSave: false });
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Optional authorization - allow guest access
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (req.user) {
      // Update last seen
      req.user.lastSeen = Date.now();
      await req.user.save({ validateBeforeSave: false });
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Rate limiting middleware
exports.rateLimit = (requests, timeWindowMs) => {
  const requestCounts = {};
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    requestCounts[ip] = requestCounts[ip] || [];
    requestCounts[ip] = requestCounts[ip].filter(time => now - time < timeWindowMs);
    
    if (requestCounts[ip].length >= requests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    requestCounts[ip].push(now);
    next();
  };
};
