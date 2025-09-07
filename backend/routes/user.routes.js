const express = require('express');
const {
  updateProfile,
  updatePassword,
  getVoteHistory,
  deleteAccount
} = require('../controllers/user.controller');

const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/votes', getVoteHistory);
router.delete('/', deleteAccount);

module.exports = router;
