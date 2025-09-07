const Poll = require('../models/Poll.model');
const User = require('../models/User.model');

// @desc    Get poll data for embedding
// @route   GET /api/polls/:id/embed
// @access  Public
exports.getPollForEmbed = async (req, res) => {
  try {
    const pollId = req.params.id;
    
    // Find poll by id
    const poll = await Poll.findById(pollId)
      .select('-password') // Don't include password in response
      .populate('creator', 'username name'); // Include basic creator info
    
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    
    // Check if poll is private and not accessible
    if (poll.privacy === 'private') {
      // For private polls, require a valid token or referer check
      const referer = req.headers.referer || req.headers.referrer;
      
      // Only allow if we have a token or if coming from allowed domains
      // This is a simple implementation - you might want more robust checking
      if (!req.query.token) {
        return res.status(403).json({ 
          success: false, 
          message: 'This poll is private and cannot be embedded without proper authorization'
        });
      }
      
      // Verify token matches expected value (you'd implement proper token validation)
      if (req.query.token !== poll.embedToken) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid embed token'
        });
      }
    }
    
    // Sanitize poll data for public embedding
    const embedPoll = {
      _id: poll._id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      votingSystem: poll.votingSystem,
      expiresAt: poll.expiresAt,
      allowGuestVoting: poll.allowGuestVoting,
      showResults: poll.showResults,
      ended: poll.ended,
      createdAt: poll.createdAt,
      viewCount: poll.viewCount,
      // Only include safe creator information
      creator: poll.creator ? {
        username: poll.creator.username,
      } : null
    };
    
    res.json({
      success: true,
      data: embedPoll
    });
    
  } catch (err) {
    console.error('Error getting poll for embed:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching poll for embed'
    });
  }
};

// @desc    Track poll embed view
// @route   POST /api/polls/:id/track-embed
// @access  Public
exports.trackEmbedView = async (req, res) => {
  try {
    const pollId = req.params.id;
    const { referrer, url } = req.body;
    
    // Find poll by id
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    
    // Track embed view
    poll.embedCount = (poll.embedCount || 0) + 1;
    
    // Store referrer information
    if (!poll.embedSources) {
      poll.embedSources = [];
    }
    
    // Limit stored sources to prevent database bloat
    if (poll.embedSources.length > 100) {
      poll.embedSources = poll.embedSources.slice(-100);
    }
    
    // Add this source if it's new
    if (referrer || url) {
      poll.embedSources.push({
        referrer: referrer || 'unknown',
        url: url || 'unknown',
        timestamp: new Date()
      });
    }
    
    // Save the poll
    await poll.save();
    
    // Notify creator of the embed view
    try {
      const io = req.app.get('io');
      if (io && poll.creator) {
        io.to(`user:${poll.creator}`).emit('poll-embed', {
          pollId: poll._id,
          title: poll.title,
          referrer,
          url
        });
      }
    } catch (e) {
      // Ignore notification errors
    }
    
    res.json({
      success: true,
      message: 'Embed view tracked'
    });
    
  } catch (err) {
    console.error('Error tracking embed view:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while tracking embed view'
    });
  }
};

// @desc    Generate or regenerate embed token for a poll
// @route   POST /api/polls/:id/embed-token
// @access  Private (owner only)
exports.generateEmbedToken = async (req, res) => {
  try {
    const pollId = req.params.id;
    
    // Find poll by id and verify ownership
    const poll = await Poll.findOne({
      _id: pollId,
      creator: req.user.id
    });
    
    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found or you do not have permission'
      });
    }
    
    // Generate a random token
    const randomToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    
    // Save the token to the poll
    poll.embedToken = randomToken;
    await poll.save();
    
    res.json({
      success: true,
      data: {
        embedToken: randomToken
      }
    });
    
  } catch (err) {
    console.error('Error generating embed token:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating embed token'
    });
  }
};

// @desc    Get embed stats for a poll
// @route   GET /api/polls/:id/embed-stats
// @access  Private (owner only)
exports.getEmbedStats = async (req, res) => {
  try {
    const pollId = req.params.id;
    
    // Find poll by id and verify ownership
    const poll = await Poll.findOne({
      _id: pollId,
      creator: req.user.id
    });
    
    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found or you do not have permission'
      });
    }
    
    // Extract embed statistics
    const stats = {
      embedCount: poll.embedCount || 0,
      embedSources: poll.embedSources || []
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (err) {
    console.error('Error getting embed stats:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching embed stats'
    });
  }
};
