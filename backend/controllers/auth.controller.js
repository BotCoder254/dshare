const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Helper function to create and send token
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
  
  // Set cookie options - use maxAge instead of expires
  // Parse JWT_EXPIRE to get proper maxAge in milliseconds
  let maxAge = 7 * 24 * 60 * 60 * 1000; // Default 7 days in milliseconds
  
  try {
    const jwtExpire = process.env.JWT_EXPIRE;
    if (typeof jwtExpire === 'string') {
      const match = jwtExpire.match(/(\d+)([dhms])/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        
        switch(unit) {
          case 'd': // days
            maxAge = value * 24 * 60 * 60 * 1000;
            break;
          case 'h': // hours
            maxAge = value * 60 * 60 * 1000;
            break;
          case 'm': // minutes
            maxAge = value * 60 * 1000;
            break;
          case 's': // seconds
            maxAge = value * 1000;
            break;
        }
      }
    }
  } catch (error) {
    console.error('Error parsing JWT_EXPIRE:', error);
  }
  
  const cookieOptions = {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Remove password from response
  user.password = undefined;
  
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      isGuest: false
    });
    
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Create guest user
// @route   POST /api/auth/guest
// @access  Public
exports.createGuestUser = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a name'
      });
    }
    
    // Generate random email and password for guest user
    const randomString = Math.random().toString(36).substring(2, 15);
    const email = `guest-${randomString}@dshare-temp.com`;
    const password = randomString;
    
    const user = await User.create({
      name,
      email,
      password,
      isGuest: true
    });
    
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert guest to regular user
// @route   PUT /api/auth/convert-guest
// @access  Private
exports.convertGuest = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user is actually a guest
    if (!req.user.isGuest) {
      return res.status(400).json({
        success: false,
        message: 'User is not a guest'
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Update user
    req.user.email = email;
    req.user.password = password;
    req.user.isGuest = false;
    
    await req.user.save();
    
    sendTokenResponse(req.user, 200, res);
  } catch (error) {
    next(error);
  }
};
