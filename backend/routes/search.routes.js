const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { 
  searchPolls,
  getTrendingPolls,
  getSuggestedPolls
} = require('../controllers/search.controller');

// Search polls with filters
router.get('/', searchPolls);

// Get trending polls
router.get('/trending', getTrendingPolls);

// Get suggested polls (requires auth)
router.get('/suggested', protect, getSuggestedPolls);

module.exports = router;
