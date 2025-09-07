import api from './api';

// Get all public polls with pagination
export const getPolls = async (page = 1, limit = 10, expired = false) => {
  const response = await api.get(`/polls?page=${page}&limit=${limit}&expired=${expired}`);
  return response.data;
};

// Get a single poll by ID or slug
export const getPoll = async (idOrSlug) => {
  const response = await api.get(`/polls/${idOrSlug}`);
  return response.data;
};

// Create a new poll
export const createPoll = async (pollData) => {
  const response = await api.post('/polls', pollData);
  return response.data;
};

// Vote on a poll
export const votePoll = async (pollId, voteData, password = null) => {
  // Clone the vote data to avoid modifying the original object
  const payload = { ...voteData };
  
  // If password is provided (for password-protected polls)
  if (password) {
    payload.password = password;
  }
  
  const response = await api.post(`/polls/${pollId}/vote`, payload);
  return response.data;
};

// Delete a poll
export const deletePoll = async (pollId) => {
  const response = await api.delete(`/polls/${pollId}`);
  return response.data;
};

// Get current user's polls
export const getUserPolls = async (page = 1, limit = 10) => {
  const response = await api.get(`/polls/me/polls?page=${page}&limit=${limit}`);
  return response.data;
};

// Get historical data for a poll
export const getPollHistory = async (pollId, timeRange = '24h') => {
  const response = await api.get(`/polls/${pollId}/history?timeRange=${timeRange}`);
  return response.data;
};
