const Poll = require('../models/Poll.model');

// @desc    Update poll
// @route   PUT /api/polls/:id
// @access  Private (poll creator only)
exports.updatePoll = async (req, res, next) => {
  try {
    const { 
      title, description, options, privacy, 
      password, expiresAt, allowGuestVoting, 
      category, tags, votingSystem, showResults 
    } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Check if user is poll creator
    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this poll'
      });
    }
    
    // Save the current version of the poll before updating
    const currentVersion = {
      title: poll.title,
      description: poll.description,
      options: poll.options.map(opt => ({
        text: opt.text,
        votes: opt.votes
      })),
      privacy: poll.privacy,
      expiresAt: poll.expiresAt,
      allowGuestVoting: poll.allowGuestVoting,
      showResults: poll.showResults,
      editorId: req.user.id
    };
    
    // Check if any votes have been cast
    if (poll.voters.length > 0) {
      // If votes exist, only allow updating certain fields
      poll.title = title || poll.title;
      poll.description = description || poll.description;
      poll.tags = tags || poll.tags;
      poll.category = category || poll.category;
      poll.expiresAt = expiresAt || poll.expiresAt;
      
      // Cannot change options, voting system, or other core settings after votes
      if (options) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change poll options after votes have been cast'
        });
      }
    } else {
      // If no votes, allow updating all fields
      poll.title = title || poll.title;
      poll.description = description || poll.description;
      poll.privacy = privacy || poll.privacy;
      poll.expiresAt = expiresAt || poll.expiresAt;
      poll.allowGuestVoting = allowGuestVoting !== undefined ? allowGuestVoting : poll.allowGuestVoting;
      poll.category = category || poll.category;
      poll.tags = tags || poll.tags;
      poll.votingSystem = votingSystem || poll.votingSystem;
      poll.showResults = showResults || poll.showResults;
      
      // Update password if provided and privacy is password-protected
      if (privacy === 'password-protected' && password) {
        poll.password = password;
      }
      
      // Update options if provided
      if (options && Array.isArray(options)) {
        // Keep existing vote counts for options that match by ID
        const updatedOptions = options.map(option => {
          if (option._id) {
            const existingOption = poll.options.id(option._id);
            return {
              ...option,
              votes: existingOption ? existingOption.votes : 0
            };
          }
          return { ...option, votes: 0 };
        });
        
        poll.options = updatedOptions;
      }
    }
    
    // Add the current version to versions array
    if (!poll.versions) {
      poll.versions = [];
    }
    poll.versions.push(currentVersion);
    
    // Mark as edited and set updated time
    poll.isEdited = true;
    poll.updatedAt = new Date();
    
    // Save the updated poll
    await poll.save();
    
    // Emit socket event for real-time updates
    if (req.io) {
      req.io.to(`poll:${poll._id}`).emit('pollUpdated', {
        pollId: poll._id,
        updatedPoll: poll
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Poll updated successfully',
      data: poll
    });
  } catch (error) {
    next(error);
  }
};
