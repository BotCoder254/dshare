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
const { updatePoll } = require('../controllers/updatePoll.controller');
const { getPollVersions, rollbackVersion } = require('../controllers/pollVersion.controller');
const { incrementShareCount, incrementViewCount } = require('../controllers/search.controller');

const { protect, optionalAuth } = require('../middleware/auth.middleware');
const socketMiddleware = require('../middleware/socket.middleware');

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getPolls);
router.get('/:id', optionalAuth, getPoll);
router.get('/:id/history', optionalAuth, getPollHistory);
router.post('/:id/vote', optionalAuth, votePoll);
router.post('/:id/share', incrementShareCount);
router.post('/:id/view', incrementViewCount);

// Protected routes
router.post('/', protect, socketMiddleware, createPoll);
router.put('/:id', protect, socketMiddleware, updatePoll);
router.delete('/:id', protect, socketMiddleware, deletePoll);
router.get('/me/polls', protect, getMyPolls);

// Version control routes
router.get('/:id/versions', protect, getPollVersions);
router.post('/:id/rollback/:versionIndex', protect, socketMiddleware, rollbackVersion);

module.exports = router;
