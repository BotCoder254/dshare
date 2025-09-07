import api from './api';
import { io } from 'socket.io-client';

let socket = null;

// Initialize socket connection
export const initializeSocket = (userId) => {
  try {
    if (!socket) {
      // Connect to the Socket.io server with proper error handling
      socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // Log connection status
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        
        // Join user's notification room if userId is available
        if (userId) {
          socket.emit('join-user', userId);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    
    // Always return socket, even if it might be in error state
    return socket;
  } catch (error) {
    // Return null if socket initialization fails completely
    console.error('Failed to initialize socket:', error);
    return null;
  }
};

// Close socket connection
export const closeSocket = () => {
  try {
    if (socket) {
      // Remove all listeners first to prevent memory leaks
      socket.removeAllListeners();
      // Then disconnect
      socket.disconnect();
      socket = null;
    }
  } catch (error) {
    console.error('Error closing socket connection:', error);
  }
};

// Join a poll room to receive real-time updates
export const joinPollRoom = (pollId) => {
  if (socket && pollId) {
    socket.emit('join-poll', pollId);
  }
};

// Leave a poll room when no longer needed
export const leavePollRoom = (pollId) => {
  if (socket && pollId) {
    socket.emit('leave-poll', pollId);
  }
};

// Get user notifications with pagination
export const getUserNotifications = async (page = 1, limit = 10, unreadOnly = false) => {
  try {
    // Make API request to fetch notifications
    const response = await api.get(
      `/api/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
    );
    
    // If API returns successful response
    if (response && response.data) {
      return response.data;
    } else {
      // Default response if data is missing but no error occurred
      return { 
        success: true, 
        data: [], 
        unreadCount: 0, 
        count: 0, 
        total: 0,
        pagination: { page, limit, totalPages: 1 } 
      };
    }
  } catch (error) {
    // For development debugging
    console.error('Failed to fetch notifications:', error);
    
    // Rather than throwing an error, return a valid object
    // This prevents the app from crashing when backend is unavailable
    return { 
      success: false, 
      data: [], 
      unreadCount: 0, 
      count: 0, 
      total: 0,
      pagination: { page, limit, totalPages: 1 }
    };
  }
};

// Mark a notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error marking notification as read');
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error marking all notifications as read');
  }
};

// Snooze a notification
export const snoozeNotification = async (notificationId, duration) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/snooze`, { duration });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error snoozing notification');
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error deleting notification');
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    // First try specific endpoint for unread count
    try {
      const response = await api.get('/api/notifications/unread-count');
      if (response && response.data && typeof response.data.unreadCount === 'number') {
        return response.data.unreadCount;
      }
    } catch (countError) {
      console.error('Error using dedicated unread count endpoint:', countError);
      // Continue to fallback method
    }

    // Fallback: Get minimal notifications with unreadOnly flag
    const response = await api.get('/api/notifications?page=1&limit=1&unreadOnly=true');
    if (response && response.data && typeof response.data.unreadCount === 'number') {
      return response.data.unreadCount;
    } else {
      console.warn('Unread count not found in response:', response);
      return 0;
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};
