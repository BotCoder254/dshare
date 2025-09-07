import api from './api';

// Get poll data specifically formatted for embedding
export const getPollForEmbed = async (pollId) => {
  const response = await api.get(`/embed/${pollId}/embed`);
  return response.data;
};

// Track an embed view
export const trackEmbedView = async (pollId, referrer, url) => {
  const response = await api.post(`/embed/${pollId}/track-embed`, { referrer, url });
  return response.data;
};

// Generate or regenerate an embed token for a poll (for private polls)
export const generateEmbedToken = async (pollId) => {
  const response = await api.post(`/embed/${pollId}/embed-token`);
  return response.data;
};

// Get embed statistics for a poll
export const getEmbedStats = async (pollId) => {
  const response = await api.get(`/embed/${pollId}/embed-stats`);
  return response.data;
};

// Get all embeddable polls for current user
export const getEmbeddablePolls = async () => {
  // Using the existing getUserPolls endpoint but could be specialized in the future
  const response = await api.get(`/polls/me/polls`);
  return response.data;
};
