import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserNotifications, 
  initializeSocket, 
  closeSocket, 
  getUnreadCount 
} from '../services/notification.service';

// Create the context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Initialize socket and join user room
  useEffect(() => {
    let socketInstance = null;
    
    if (isAuthenticated && user) {
      try {
        // Initialize socket connection
        socketInstance = initializeSocket(user.id);
        
        // Only set up socket events if socket was initialized successfully
        if (socketInstance) {
          setSocket(socketInstance);
          
          // Listen for new notifications
          socketInstance.on('new-notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if supported and allowed
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                const { title, message } = notification;
                new Notification(title, {
                  body: message,
                  icon: '/logo192.png'
                });
              } catch (error) {
                console.error('Error showing browser notification:', error);
              }
            }
          });
          
          // Listen for notification updates (e.g., when a notification is marked as read from another device)
          socketInstance.on('notification-updated', ({ id, changes }) => {
            setNotifications(prev => 
              prev.map(notif => 
                notif._id === id ? { ...notif, ...changes } : notif
              )
            );
            
            // If a notification was marked as read, update unread count
            if (changes.read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          });
        }
      } catch (error) {
        console.error('Error setting up socket connection:', error);
      }
      
      // Clean up socket connection
      return () => {
        closeSocket();
      };
    }
  }, [isAuthenticated, user]);
  
  // Fetch notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);
  
  // Function to fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      // Get notifications - this won't throw anymore
      const response = await getUserNotifications(page, limit);
      
      // Always ensure we have a valid array for notifications
      if (response && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        // If data isn't an array or doesn't exist, use empty array
        setNotifications([]);
      }
      
      // Set unread count if available
      if (response && typeof response.unreadCount === 'number') {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      // This catch block should never execute now, but kept as a safety
      console.error('Unexpected error in fetchNotifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // Function to fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const count = await getUnreadCount();
      // Only update state if we got a valid number
      if (typeof count === 'number') {
        setUnreadCount(count);
      } else {
        console.warn('Invalid unread count received:', count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Don't change the unread count on error - keep the previous value
    }
  }, [isAuthenticated]);
  
  // Request permission for browser notifications
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }, []);
  
  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    socket,
    fetchNotifications,
    fetchUnreadCount,
    requestNotificationPermission
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
