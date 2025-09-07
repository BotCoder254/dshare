import api from './api';

// Search polls with filters
export const searchPolls = async (query = '', options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      tags, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;
    
    // Build query string
    let queryString = `page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    if (query) {
      queryString += `&q=${encodeURIComponent(query)}`;
    }
    
    if (category) {
      queryString += `&category=${encodeURIComponent(category)}`;
    }
    
    if (tags && tags.length) {
      queryString += `&tags=${encodeURIComponent(tags.join(','))}`;
    }
    
    const response = await api.get(`/search?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error searching polls:', error);
    throw error;
  }
};

// Get trending polls
export const getTrendingPolls = async (timeFrame = 'week', limit = 10) => {
  try {
    const response = await api.get(`/search/trending?timeFrame=${timeFrame}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trending polls:', error);
    throw error;
  }
};

// Get suggested polls (requires auth)
export const getSuggestedPolls = async (limit = 10) => {
  try {
    const response = await api.get(`/search/suggested?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suggested polls:', error);
    throw error;
  }
};

// Track poll sharing
export const trackPollShare = async (pollId, platform = 'other') => {
  try {
    const response = await api.post(`/polls/${pollId}/share`, { platform });
    return response.data;
  } catch (error) {
    console.error('Error tracking poll share:', error);
    // Don't throw error - just log it
    return null;
  }
};

// Track poll view
export const trackPollView = async (pollId) => {
  try {
    const response = await api.post(`/polls/${pollId}/view`);
    return response.data;
  } catch (error) {
    console.error('Error tracking poll view:', error);
    // Don't throw error - just log it
    return null;
  }
};

// Share poll to social platforms
export const sharePoll = async (pollId, platform) => {
  try {
    // Get poll data
    const response = await api.get(`/polls/${pollId}`);
    const { title, slug } = response.data.data;
    
    // Build share URL
    const shareUrl = `${window.location.origin}/poll/${slug || pollId}`;
    
    // Track share
    trackPollShare(pollId, platform);
    
    // Share based on platform
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
        
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
        
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
        
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${shareUrl}`)}`, '_blank');
        break;
        
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this poll: ${shareUrl}`)}`, '_blank');
        break;
        
      case 'copy':
      default:
        return shareUrl; // Return URL for copy to clipboard functionality
    }
    
    return true;
  } catch (error) {
    console.error('Error sharing poll:', error);
    throw error;
  }
};

// Generate embed code for a poll
export const getEmbedCode = (pollId, options = {}) => {
  const { width = '100%', height = '500px' } = options;
  const embedUrl = `${window.location.origin}/embed/${pollId}`;
  
  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowtransparency="true"></iframe>`;
};
