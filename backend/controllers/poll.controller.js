const Poll = require('../models/Poll.model');
const User = require('../models/User.model');
const { createNotification } = require('./notification.controller');

// @desc    Create new poll
// @route   POST /api/polls
// @access  Private
exports.createPoll = async (req, res, next) => {
  try {
    const {
      title,
      description,
      options,
      votingSystem,
      privacy,
      password,
      expiresAt,
      allowGuestVoting,
      showResults
    } = req.body;
    
    // Create poll with creator set to current user
    const poll = await Poll.create({
      title,
      description,
      options: options.map(option => ({ text: option })),
      creator: req.user.id,
      votingSystem: votingSystem || 'single-choice',
      privacy: privacy || 'public',
      password,
      expiresAt,
      allowGuestVoting: allowGuestVoting !== undefined ? allowGuestVoting : true,
      showResults: showResults || 'always'
    });
    
    // Create a system notification for the creator as confirmation
    try {
      await createNotification(
        req.user.id,
        'system',
        'Poll Created Successfully',
        `Your poll "${title}" has been created and is now ${privacy === 'public' ? 'available to the public' : 'available to those with access'}`,
        poll._id
      );
      
      // Send real-time notification via socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${req.user.id}`).emit('new-notification', {
          type: 'system',
          title: 'Poll Created Successfully',
          message: `Your poll "${title}" has been created and is now ${privacy === 'public' ? 'available to the public' : 'available to those with access'}`,
          pollId: poll._id,
          createdAt: new Date()
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue even if notification fails
    }
    
    res.status(201).json({
      success: true,
      data: poll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls (with pagination)
// @route   GET /api/polls
// @access  Public
exports.getPolls = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Only get public polls
    const query = { privacy: 'public' };
    
    // If expired filter is provided
    if (req.query.expired === 'false') {
      query.$or = [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ];
    } else if (req.query.expired === 'true') {
      query.expiresAt = { $lt: new Date() };
    }
    
    const polls = await Poll.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('creator', 'name profilePicture');
    
    // Get total count for pagination
    const total = await Poll.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: polls.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: polls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Public (with restrictions based on privacy)
exports.getPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id }
      ]
    }).populate('creator', 'name profilePicture');
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Check if poll is private
    if (poll.privacy === 'private') {
      // If no user is logged in or user is not the creator
      if (!req.user || (poll.creator._id.toString() !== req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this poll'
        });
      }
    }
    
    // Check if results should be hidden
    let hideResults = false;
    if (poll.showResults === 'after-vote' && (!req.user || !poll.voters.some(voter => voter.user.toString() === req.user.id))) {
      hideResults = true;
    } else if (poll.showResults === 'after-close' && (!poll.expiresAt || new Date() < poll.expiresAt)) {
      hideResults = true;
    }
    
    // If results should be hidden, modify the response
    const pollResponse = hideResults ? {
      ...poll.toObject(),
      options: poll.options.map(option => ({
        text: option.text,
        _id: option._id
      }))
    } : poll;
    
    res.status(200).json({
      success: true,
      data: pollResponse,
      hideResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on a poll
// @route   POST /api/polls/:id/vote
// @access  Public (with restrictions)
exports.votePoll = async (req, res, next) => {
  try {
    const { type } = req.body; // 'single', 'multiple', 'ranked', or 'score'
    
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Check if poll is expired
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Poll has expired'
      });
    }
    
    // Check if password-protected
    if (poll.privacy === 'password-protected') {
      const { password } = req.body;
      if (!password || poll.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password for this poll'
        });
      }
    }
    
    // Check if user is the creator of the poll and trying to vote from the embed/preview
    if (req.user && poll.creator.toString() === req.user.id && req.headers.referer && 
       (req.headers.referer.includes('/embed/') || req.headers.referer.includes('/preview/'))) {
      return res.status(400).json({
        success: false,
        message: 'Poll creators cannot vote on their own polls in preview or embed mode'
      });
    }

    // Check if user has already voted
    const ipAddress = req.ip;
    const deviceToken = req.body.deviceToken || req.cookies.deviceToken || null;
    
    const hasVoted = poll.voters.some(voter => {
      // If user is logged in, check by user ID
      if (req.user) {
        return voter.user && voter.user.toString() === req.user.id;
      }
      // Check by device token if available
      if (deviceToken && voter.deviceToken === deviceToken) {
        return true;
      }
      // Otherwise check by IP address
      return voter.ipAddress === ipAddress;
    });
    
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }
    
    // Check if guest voting is allowed
    if (!req.user && !poll.allowGuestVoting) {
      return res.status(401).json({
        success: false,
        message: 'Guest voting is not allowed for this poll'
      });
    }
    
    // Prepare voter entry
    const voterEntry = {
      user: req.user ? req.user.id : null,
      ipAddress,
      deviceToken,
      choices: [],
      voteData: req.body
    };
    
    // Handle vote based on voting system
    switch (poll.votingSystem) {
      case 'single-choice': {
        // Find the option and increment votes
        const { optionId } = req.body;
        const option = poll.options.id(optionId);
        
        if (!option) {
          return res.status(404).json({
            success: false,
            message: 'Option not found'
          });
        }
        
        option.votes += 1;
        voterEntry.choices = [{ option: optionId }];
        break;
      }
      
      case 'multiple-choice': {
        // Handle multiple-choice voting
        const { optionIds } = req.body;
        
        if (!Array.isArray(optionIds) || optionIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Please select at least one option'
          });
        }
        
        for (const optionId of optionIds) {
          const option = poll.options.id(optionId);
          
          if (!option) {
            return res.status(404).json({
              success: false,
              message: `Option not found: ${optionId}`
            });
          }
          
          option.votes += 1;
          voterEntry.choices.push({ option: optionId });
        }
        break;
      }
      
      case 'ranked-choice': {
        // Handle ranked-choice voting
        const { ranking } = req.body;
        
        if (!Array.isArray(ranking) || ranking.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid ranking'
          });
        }
        
        // For ranked choice, we don't directly increment votes
        // Instead, we store the ranking and compute results separately
        voterEntry.choices = ranking.map(item => ({
          option: item.optionId,
          rank: item.rank
        }));
        
        // Increment votes for the top-ranked option for visual feedback
        const topRanked = ranking.find(item => item.rank === 1);
        if (topRanked) {
          const option = poll.options.id(topRanked.optionId);
          if (option) {
            option.votes += 1;
          }
        }
        break;
      }
      
      case 'score-voting': {
        // Handle score voting
        const { scores } = req.body;
        
        if (!Array.isArray(scores) || scores.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Please provide valid scores'
          });
        }
        
        for (const scoreItem of scores) {
          const { optionId, score } = scoreItem;
          
          if (!optionId || typeof score !== 'number' || score < 1 || score > 10) {
            return res.status(400).json({
              success: false,
              message: 'Invalid score data'
            });
          }
          
          const option = poll.options.id(optionId);
          if (!option) {
            return res.status(404).json({
              success: false,
              message: `Option not found: ${optionId}`
            });
          }
          
          // For score voting, we consider each vote worth the score given
          option.votes += score;
          voterEntry.choices.push({
            option: optionId,
            score
          });
        }
        break;
      }
      
      default: {
        // Default to single-choice voting
        const { optionId } = req.body;
        const option = poll.options.id(optionId);
        
        if (!option) {
          return res.status(404).json({
            success: false,
            message: 'Option not found'
          });
        }
        
        option.votes += 1;
        voterEntry.choices = [{ option: optionId }];
      }
    }
    
    // Add voter to the poll
    poll.voters.push(voterEntry);
    
    // Update total votes count
    poll.totalVotes = (poll.totalVotes || 0) + 1;
    
    await poll.save();
    
    // Get poll creator and send notification
    if (poll.creator) {
      try {
        // Send notification to poll creator about new vote
        await createNotification(
          poll.creator,
          'poll_vote',
          'New Vote on Your Poll',
          `Someone just voted on your poll: ${poll.title}`,
          poll._id
        );
        
        // Emit real-time notification via socket.io
        const io = req.app.get('io');
        if (io) {
          // Emit to poll room for live updates
          io.to(`poll:${poll._id}`).emit('poll-updated', {
            pollId: poll._id,
            action: 'vote',
            poll: {
              _id: poll._id,
              title: poll.title,
              options: poll.options,
              totalVotes: poll.voters.length
            }
          });
          
          // Emit to poll creator's user room for notification
          io.to(`user:${poll.creator}`).emit('new-notification', {
            type: 'poll_vote',
            title: 'New Vote on Your Poll',
            message: `Someone just voted on your poll: ${poll.title}`,
            pollId: poll._id,
            createdAt: new Date()
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Continue with the response even if notification fails
      }
    }
    
    // Set device token as a cookie if provided and not already set
    if (voterEntry.deviceToken && !req.cookies.deviceToken) {
      res.cookie('deviceToken', voterEntry.deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        sameSite: 'lax'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: poll,
      deviceToken: voterEntry.deviceToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Private (poll creator only)
exports.deletePoll = async (req, res, next) => {
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
        message: 'Not authorized to delete this poll'
      });
    }
    
    await poll.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get polls by current user
// @route   GET /api/polls/me
// @access  Private
exports.getMyPolls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const polls = await Poll.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Poll.countDocuments({ creator: req.user.id });
    
    res.status(200).json({
      success: true,
      count: polls.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: polls
    });
  } catch (error) {
    next(error);
  }
};
