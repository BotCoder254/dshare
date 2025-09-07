const express = require('express');
const {
  register,
  login,
  createGuestUser,
  logout,
  getMe,
  convertGuest
} = require('../controllers/auth.controller');

const { protect, rateLimit } = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiting for auth routes
const loginLimiter = rateLimit(10, 15 * 60 * 1000); // 10 requests per 15 minutes

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/guest', createGuestUser);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/convert-guest', protect, convertGuest);

module.exports = router;
