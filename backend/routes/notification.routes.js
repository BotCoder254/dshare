const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  snoozeNotification,
  deleteNotification
} = require('../controllers/notification.controller');

// Get all user notifications with pagination
router.get('/', protect, getUserNotifications);

// Get unread notification count
router.get('/unread-count', protect, getUnreadCount);

// Mark notification as read
router.put('/:id/read', protect, markNotificationRead);

// Mark all notifications as read
router.put('/read-all', protect, markAllNotificationsRead);

// Snooze notification
router.put('/:id/snooze', protect, snoozeNotification);

// Delete notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
