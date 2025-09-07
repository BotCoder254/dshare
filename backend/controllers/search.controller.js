const Poll = require('../models/Poll.model');
const User = require('../models/User.model');

// @desc    Search polls
// @route   GET /api/search
// @access  Public
exports.searchPolls = async (req, res, next) => {
  try {
    // Get search parameters
    const query = req.query.q || '';
    const category = req.query.category;
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, popularity, votes
    const sortOrder = req.query.sortOrder || 'desc';
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Build search filter
    const filter = {
      privacy: 'public', // Only search public polls
    };
    
    // Add text search if query provided
    if (query && query.trim() !== '') {
      filter.$text = { $search: query };
    }
    
    // Add category filter if provided
    if (category && category.trim() !== '') {
      filter.category = category.toLowerCase().trim();
    }
    
    // Add tags filter if provided
    if (tags.length > 0) {
      filter.tags = { $in: tags.map(tag => tag.toLowerCase().trim()) };
    }

    // Determine sort options
    let sortOptions = {};
    
    switch (sortBy) {
      case 'popularity':
        sortOptions = { viewCount: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'votes':
        sortOptions = { totalVotes: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'shares':
        sortOptions = { shareCount: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'createdAt':
      default:
        sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    }
    
    // If text search is used, sort by text score first
    if (filter.$text) {
      sortOptions.score = { $meta: 'textScore' };
    }
    
    // Find polls
    const polls = await Poll.find(filter)
      .select('title description options creator privacy slug viewCount totalVotes shareCount createdAt tags category')
      .populate('creator', 'name profilePicture')
      .sort(sortOptions)
      .skip(startIndex)
      .limit(limit);
      
    // Get total count for pagination
    const total = await Poll.countDocuments(filter);
    
    // Get categories for filters (up to 20 most common)
    const categories = await Poll.aggregate([
      { $match: { privacy: 'public' } },
      { $group: { _id: '$category' } },
      { $match: { _id: { $ne: null } } },
      { $limit: 20 }
    ]);
    
    // Get popular tags for filters (up to 30 most common)
    const popularTags = await Poll.aggregate([
      { $match: { privacy: 'public' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);
    
    res.status(200).json({
      success: true,
      count: polls.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        categories: categories.map(cat => cat._id).filter(Boolean),
        popularTags: popularTags.map(tag => tag._id).filter(Boolean)
      },
      data: polls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending polls
// @route   GET /api/search/trending
// @access  Public
exports.getTrendingPolls = async (req, res, next) => {
  try {
    const timeFrame = req.query.timeFrame || 'week'; // day, week, month, all
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Calculate date for time frame
    const dateFilter = {};
    const now = new Date();
    
    if (timeFrame === 'day') {
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)) };
    } else if (timeFrame === 'week') {
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
    } else if (timeFrame === 'month') {
      dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    }
    
    // Get trending polls based on views, votes and shares
    const trendingPolls = await Poll.find({
      privacy: 'public',
      ...dateFilter
    })
      .select('title description options creator privacy slug viewCount totalVotes shareCount createdAt tags category')
      .populate('creator', 'name profilePicture')
      .sort({
        viewCount: -1, 
        totalVotes: -1, 
        shareCount: -1
      })
      .limit(limit);
      
    res.status(200).json({
      success: true,
      count: trendingPolls.length,
      data: trendingPolls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested polls based on user activity
// @route   GET /api/search/suggested
// @access  Private
exports.getSuggestedPolls = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Get user's voted polls to extract tags and categories
    const userPolls = await Poll.find({
      'voters.user': req.user.id
    }).select('tags category');
    
    // Extract user's interests
    const userTags = Array.from(new Set(userPolls.flatMap(poll => poll.tags || [])));
    const userCategories = Array.from(new Set(userPolls.map(poll => poll.category).filter(Boolean)));
    
    // Build filter for suggestions
    const filter = { 
      privacy: 'public',
      // Exclude polls user has already voted on
      _id: { $nin: userPolls.map(p => p._id) }
    };
    
    if (userTags.length > 0 || userCategories.length > 0) {
      filter.$or = [];
      
      if (userTags.length > 0) {
        filter.$or.push({ tags: { $in: userTags } });
      }
      
      if (userCategories.length > 0) {
        filter.$or.push({ category: { $in: userCategories } });
      }
    }
    
    // Find suggested polls
    const suggestedPolls = await Poll.find(filter)
      .select('title description options creator privacy slug viewCount totalVotes shareCount createdAt tags category')
      .populate('creator', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // If not enough suggestions based on interests, fill with recent popular polls
    if (suggestedPolls.length < limit) {
      const remainingCount = limit - suggestedPolls.length;
      const excludeIds = [...userPolls.map(p => p._id), ...suggestedPolls.map(p => p._id)];
      
      const popularPolls = await Poll.find({
        privacy: 'public',
        _id: { $nin: excludeIds }
      })
        .select('title description options creator privacy slug viewCount totalVotes shareCount createdAt tags category')
        .populate('creator', 'name profilePicture')
        .sort({ viewCount: -1, totalVotes: -1 })
        .limit(remainingCount);
        
      suggestedPolls.push(...popularPolls);
    }
    
    res.status(200).json({
      success: true,
      count: suggestedPolls.length,
      data: suggestedPolls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment poll share count
// @route   POST /api/polls/:id/share
// @access  Public
exports.incrementShareCount = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Only track shares for public polls
    if (poll.privacy === 'public') {
      poll.shareCount = (poll.shareCount || 0) + 1;
      await poll.save();
    }
    
    res.status(200).json({
      success: true,
      shareCount: poll.shareCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment poll view count
// @route   POST /api/polls/:id/view
// @access  Public
exports.incrementViewCount = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Only track views for public polls
    if (poll.privacy === 'public') {
      poll.viewCount = (poll.viewCount || 0) + 1;
      await poll.save();
    }
    
    res.status(200).json({
      success: true,
      viewCount: poll.viewCount
    });
  } catch (error) {
    next(error);
  }
};
