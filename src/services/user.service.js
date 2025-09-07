import api from './api';

// Update user profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  
  // Update local storage user data
  if (response.data.success) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const updatedUser = { ...currentUser, ...response.data.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  
  return response.data;
};

// Change user password
export const updatePassword = async (passwordData) => {
  const response = await api.put('/users/password', passwordData);
  return response.data;
};

// Get user's voting history
export const getVoteHistory = async () => {
  const response = await api.get('/users/votes');
  return response.data;
};

// Delete user account
export const deleteAccount = async () => {
  const response = await api.delete('/users');
  
  if (response.data.success) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return response.data;
};
