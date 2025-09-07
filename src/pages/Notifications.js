import React, { useState, useEffect } from 'react';
import { FaCheckDouble, FaClock, FaTrash, FaFilter, FaSort } from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  markNotificationRead, 
  markAllNotificationsRead, 
  snoozeNotification, 
  deleteNotification 
} from '../services/notification.service';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { notifications, fetchNotifications, loading } = useNotifications();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  
  // Fetch notifications on component mount and when filter/sort changes
  useEffect(() => {
    try {
      const unreadOnly = filter === 'unread';
      console.log(`Fetching notifications with: page=${currentPage}, filter=${filter}, unreadOnly=${unreadOnly}`);
      fetchNotifications(currentPage, 10, unreadOnly);
    } catch (error) {
      console.error('Error in notification fetch effect:', error);
    }
  }, [fetchNotifications, currentPage, filter]);
  
  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      fetchNotifications(currentPage, 10, filter === 'unread');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications(currentPage, 10, filter === 'unread');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Snooze notification
  const handleSnoozeNotification = async (notificationId, duration) => {
    try {
      await snoozeNotification(notificationId, duration);
      fetchNotifications(currentPage, 10, filter === 'unread');
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  };
  
  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications(currentPage, 10, filter === 'unread');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Format notification timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Ensure notifications is an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  // Filter notifications
  const filteredNotifications = safeNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });
  
  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });
  
  // Get notification type badge
  const getNotificationTypeBadge = (type) => {
    switch (type) {
      case 'poll_vote':
        return <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">Vote</span>;
      case 'poll_close':
        return <span className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs px-2 py-1 rounded-full">Closed</span>;
      case 'poll_result':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full">Results</span>;
      case 'mention':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded-full">Mention</span>;
      case 'comment':
        return <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">Comment</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-full">System</span>;
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Notifications</h1>
        
        <div className="flex space-x-3">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <FaFilter className="mr-2" />
              {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}
            </button>
            
            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    setFilter('all');
                    setFilterDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    filter === 'all' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setFilter('unread');
                    setFilterDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    filter === 'unread' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  Unread
                </button>
                <button
                  onClick={() => {
                    setFilter('read');
                    setFilterDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    filter === 'read' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  Read
                </button>
              </div>
            )}
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <FaSort className="mr-2" />
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    setSortBy('newest');
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    sortBy === 'newest' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => {
                    setSortBy('oldest');
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    sortBy === 'oldest' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  Oldest First
                </button>
              </div>
            )}
          </div>
          
          {/* Mark all as read button */}
          {filteredNotifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center px-3 py-2 bg-mpesa-green text-white rounded-md"
            >
              <FaCheckDouble className="mr-2" />
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      {/* Notifications list */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No notifications to display
          </div>
        ) : (
          sortedNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-start ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
              }`}
            >
              {/* Notification content */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  {getNotificationTypeBadge(notification.type)}
                  <h3 className="font-medium">{notification.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{notification.message}</p>
                
                {/* Action links */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-4">{formatTimestamp(notification.createdAt)}</span>
                  
                  {notification.pollId && (
                    <Link
                      to={`/polls/${notification.pollId}`}
                      className="text-mpesa-green hover:underline mr-4"
                      onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                    >
                      View poll
                    </Link>
                  )}
                  
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-blue-500 hover:underline mr-4"
                    >
                      Mark as read
                    </button>
                  )}
                  
                  {/* Snooze dropdown */}
                  <div className="relative inline-block mr-4">
                    <button
                      onClick={() => {
                        // Toggle dropdown for this specific notification
                        document.getElementById(`snooze-dropdown-${notification._id}`).classList.toggle('hidden');
                      }}
                      className="text-gray-500 hover:underline flex items-center"
                    >
                      <FaClock className="mr-1" /> Snooze
                    </button>
                    
                    <div
                      id={`snooze-dropdown-${notification._id}`}
                      className="hidden absolute left-0 mt-2 w-40 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg z-50"
                    >
                      <button
                        onClick={() => handleSnoozeNotification(notification._id, 30)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        30 minutes
                      </button>
                      <button
                        onClick={() => handleSnoozeNotification(notification._id, 60)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        1 hour
                      </button>
                      <button
                        onClick={() => handleSnoozeNotification(notification._id, 1440)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        1 day
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="text-red-500 hover:underline flex items-center"
                  >
                    <FaTrash className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination would go here */}
      {/* ... */}
    </div>
  );
};

export default NotificationsPage;
