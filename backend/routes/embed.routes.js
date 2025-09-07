const express = require('express');
const router = express.Router();
const {
  getPollForEmbed,
  trackEmbedView,
  generateEmbedToken,
  getEmbedStats
} = require('../controllers/embed.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.get('/:id/embed', getPollForEmbed);
router.post('/:id/track-embed', trackEmbedView);

// Private routes (auth required)
router.post('/:id/embed-token', protect, generateEmbedToken);
router.get('/:id/embed-stats', protect, getEmbedStats);

module.exports = router;
