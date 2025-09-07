import React, { createContext, useState, useEffect, useContext } from 'react';
import { isLoggedIn, getStoredUser, getCurrentUser, logout } from '../services/auth.service';

// Create the Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // Check if user is already logged in
        if (isLoggedIn()) {
          // Get stored user data
          const storedUser = getStoredUser();
          setUser(storedUser);
          
          // Validate token with server (optional)
          try {
            const { user: serverUser } = await getCurrentUser();
            setUser(serverUser); // Update with fresh user data
          } catch (e) {
            // If token is invalid, log out
            await logout();
            setUser(null);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Update user in context and localStorage
  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Check if user is a guest
  const isGuest = () => {
    return user?.isGuest || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isGuest,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
