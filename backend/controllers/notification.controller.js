const Notification = require('../models/Notification.model');

// @desc    Get user notifications with pagination
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skipIndex = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const query = { recipient: req.user.id };
    
    // If unread only parameter is provided
    if (unreadOnly) {
      query.read = false;
    }
    
    // Current time for snooze check
    const currentTime = new Date();
    
    // Don't show snoozed notifications that are still within snooze period
    query.$or = [
      { snoozed: false },
      { snoozed: true, snoozedUntil: { $lt: currentTime }}
    ];
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
      .populate('senderId', 'name profilePicture')
      .populate('pollId', 'title');
      
    // Count total notifications for pagination info
    const total = await Notification.countDocuments(query);
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
      $or: [
        { snoozed: false },
        { snoozed: true, snoozedUntil: { $lt: currentTime }}
      ]
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Current time for snooze check
    const currentTime = new Date();
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
      $or: [
        { snoozed: false },
        { snoozed: true, snoozedUntil: { $lt: currentTime }}
      ]
    });
    
    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Make sure notification belongs to the user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Snooze notification
// @route   PUT /api/notifications/:id/snooze
// @access  Private
exports.snoozeNotification = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Make sure notification belongs to the user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    const snoozeDuration = req.body.duration || 3600000; // Default: 1 hour in milliseconds
    const snoozedUntil = new Date(Date.now() + snoozeDuration);
    
    notification.snoozed = true;
    notification.snoozedUntil = snoozedUntil;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Make sure notification belongs to the user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a notification (internal use only)
// @access  Private/Internal
exports.createNotification = async (recipientId, type, title, message, pollId = null, senderId = null) => {
  try {
    return await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      pollId,
      senderId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
