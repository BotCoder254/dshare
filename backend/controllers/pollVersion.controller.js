const Poll = require('../models/Poll.model');

// @desc    Get poll version history
// @route   GET /api/polls/:id/versions
// @access  Private (poll creator only)
exports.getPollVersions = async (req, res, next) => {
  try {
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
        message: 'Not authorized to view this poll\'s version history'
      });
    }
    
    // Return the versions
    res.status(200).json({
      success: true,
      data: poll.versions || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Roll back to a previous version
// @route   POST /api/polls/:id/rollback/:versionIndex
// @access  Private (poll creator only)
exports.rollbackVersion = async (req, res, next) => {
  try {
    const { id, versionIndex } = req.params;
    const versionIdx = parseInt(versionIndex, 10);
    
    const poll = await Poll.findById(id);
    
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
        message: 'Not authorized to modify this poll'
      });
    }
    
    // Check if version exists
    if (!poll.versions || !poll.versions[versionIdx]) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Save the current version before rolling back
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
      editorId: req.user.id,
      versionDate: new Date()
    };
    
    // Add current version to the versions array
    poll.versions.push(currentVersion);
    
    const targetVersion = poll.versions[versionIdx];
    
    // Check if votes exist - only update fields that are safe to change
    if (poll.voters.length > 0) {
      // If votes exist, only allow updating certain fields
      poll.title = targetVersion.title;
      poll.description = targetVersion.description;
      // Cannot change options, voting system after votes
    } else {
      // If no votes, roll back all fields
      poll.title = targetVersion.title;
      poll.description = targetVersion.description;
      poll.privacy = targetVersion.privacy;
      poll.expiresAt = targetVersion.expiresAt;
      poll.allowGuestVoting = targetVersion.allowGuestVoting;
      poll.showResults = targetVersion.showResults;
      
      // Only update options if they exist in the target version
      if (targetVersion.options && targetVersion.options.length > 0) {
        poll.options = targetVersion.options;
      }
    }
    
    // Mark as edited and update the timestamp
    poll.isEdited = true;
    poll.updatedAt = new Date();
    
    // Save the rolled-back poll
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
      message: 'Poll rolled back to previous version successfully',
      data: poll
    });
  } catch (error) {
    next(error);
  }
};
