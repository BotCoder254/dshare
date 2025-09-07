const express = require('express');
const {
  createPoll,
  getPolls,
  getPoll,
  votePoll,
  deletePoll,
  getMyPolls
} = require('../controllers/poll.controller');
const { getPollHistory } = require('../controllers/getPollHistory');

const { protect, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getPolls);
router.get('/:id', optionalAuth, getPoll);
router.get('/:id/history', optionalAuth, getPollHistory);
router.post('/:id/vote', optionalAuth, votePoll);

// Protected routes
router.post('/', protect, createPoll);
router.delete('/:id', protect, deletePoll);
router.get('/me/polls', protect, getMyPolls);

module.exports = router;
