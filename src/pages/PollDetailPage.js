import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPollById } from '../services/poll.service';
import { trackPollView } from '../services/search.service';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareButtons from '../components/ShareButtons';

const PollDetailPage = () => {
  const { id } = useParams();
  
  const {
    data: poll,
    isLoading,
    error
  } = useQuery(['poll', id], () => getPollById(id), {
    staleTime: 1000 * 60 // 1 minute
  });
  
  // Track view
  useEffect(() => {
    if (poll?.data) {
      trackPollView(id);
    }
  }, [poll?.data, id]);
  
  // Meta tags for social sharing
  useEffect(() => {
    if (poll?.data) {
      // Set page title
      document.title = `${poll.data.title} | DShare`;
      
      // Create or update meta tags for social sharing
      const metaTags = [
        { property: 'og:title', content: poll.data.title },
        { property: 'og:description', content: poll.data.description || 'Vote on this poll!' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: window.location.href },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:title', content: poll.data.title },
        { property: 'twitter:description', content: poll.data.description || 'Vote on this poll!' },
      ];
      
      // Add or update meta tags
      metaTags.forEach(({ property, content }) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
    
    // Cleanup function
    return () => {
      document.title = 'DShare'; // Reset title
    };
  }, [poll?.data]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <h2 className="font-bold text-lg">Error Loading Poll</h2>
          <p>{error.message || 'Failed to load poll details'}</p>
        </div>
      </div>
    );
  }
  
  if (!poll?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-600">
          <h2 className="font-bold text-lg">Poll Not Found</h2>
          <p>The requested poll could not be found.</p>
        </div>
      </div>
    );
  }
  
  const { data: pollData } = poll;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6">
        {/* Poll Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{pollData.title}</h1>
          
          {pollData.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {pollData.description}
            </p>
          )}
          
          {/* Poll metadata */}
          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
            <div>
              Created by {pollData.creator?.name || 'Anonymous'}
            </div>
            
            <div>
              {new Date(pollData.createdAt).toLocaleDateString()}
            </div>
            
            <div>
              {pollData.totalVotes || 0} votes
            </div>
            
            {pollData.tags && pollData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pollData.tags.map(tag => (
                  <span 
                    key={tag}
                    className="bg-gray-100 dark:bg-dark-bg-primary text-xs rounded-full px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Poll Content */}
        <div className="mb-8">
          {/* Your existing poll voting UI here */}
        </div>
        
        {/* Social Sharing */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-dark-bg-primary">
          <ShareButtons pollId={pollData._id} title={pollData.title} />
        </div>
      </div>
      
      {/* Poll comments or related content can go here */}
    </div>
  );
};

export default PollDetailPage;
