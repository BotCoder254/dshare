const Poll = require('../models/Poll.model');

// Function to get historical data for a poll
// This will be added to the poll.controller.js file
exports.getPollHistory = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Check if poll is private
    if (poll.privacy === 'private') {
      // If no user is logged in or user is not the creator
      if (!req.user || (poll.creator.toString() !== req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this poll'
        });
      }
    }
    
    // Determine time range from query parameters
    const timeRange = req.query.timeRange || '24h';
    let startTime;
    const now = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
        break;
      case '7d':
        startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
        break;
      case '30d':
        startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
        break;
      case '24h':
      default:
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    }
    
    // In a real application, we would query a pollHistory collection or time-series data
    // For this implementation, we'll generate simulated historical data based on current vote counts
    
    // Get current vote distribution
    const currentOptions = poll.options;
    const totalVotes = currentOptions.reduce((sum, opt) => sum + opt.votes, 0);
    
    // Generate mock historical data points
    const historyPoints = [];
    let interval;
    let pointCount;
    
    switch (timeRange) {
      case '1h':
        interval = 5 * 60 * 1000; // 5 minutes
        pointCount = 12;
        break;
      case '7d':
        interval = 6 * 60 * 60 * 1000; // 6 hours
        pointCount = 28;
        break;
      case '30d':
        interval = 24 * 60 * 60 * 1000; // 1 day
        pointCount = 30;
        break;
      case '24h':
      default:
        interval = 2 * 60 * 60 * 1000; // 2 hours
        pointCount = 12;
    }
    
    // Generate points from past to present
    for (let i = 0; i < pointCount; i++) {
      const timestamp = new Date(startTime.getTime() + (i * interval));
      
      // For each point, calculate a percentage of current votes
      // (real implementation would use actual historical data)
      const growthFactor = i / (pointCount - 1); // 0 to 1
      
      const historyPoint = {
        timestamp,
        options: currentOptions.map(option => {
          // Apply some randomness to make it more realistic
          const randomVariation = Math.random() * 0.1 - 0.05; // ±5%
          const historyVotes = Math.round(option.votes * (growthFactor + randomVariation));
          
          return {
            _id: option._id,
            text: option.text,
            votes: Math.max(0, historyVotes) // Ensure non-negative
          };
        })
      };
      
      historyPoints.push(historyPoint);
    }
    
    res.status(200).json({
      success: true,
      data: historyPoints
    });
  } catch (error) {
    next(error);
  }
};
