const User = require('../models/User.model');
const Poll = require('../models/Poll.model');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, profilePicture } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (profilePicture) updateData.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's vote history
// @route   GET /api/users/votes
// @access  Private
exports.getVoteHistory = async (req, res, next) => {
  try {
    // Find all polls where the user has voted
    const polls = await Poll.find({
      'voters.user': req.user.id
    }).select('title createdAt voters options');
    
    // Format the response
    const voteHistory = polls.map(poll => {
      const userVote = poll.voters.find(
        voter => voter.user.toString() === req.user.id
      );
      
      return {
        pollId: poll._id,
        title: poll.title,
        votedAt: userVote.votedAt,
        // Include more details if needed
      };
    });
    
    res.status(200).json({
      success: true,
      count: voteHistory.length,
      data: voteHistory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    // Remove user's polls
    await Poll.deleteMany({ creator: req.user.id });
    
    // Remove user
    await User.findByIdAndDelete(req.user.id);
    
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
