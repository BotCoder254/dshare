import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPollById } from '../services/poll.service';
import { trackPollView } from '../services/search.service';
import LoadingSpinner from '../components/LoadingSpinner';

// Minimal embedded poll page
const EmbedPoll = () => {
  const { id } = useParams();
  
  const {
    data: poll,
    isLoading,
    error
  } = useQuery(['embedded-poll', id], () => getPollById(id), {
    staleTime: 1000 * 60 // 1 minute
  });
  
  // Track view
  useEffect(() => {
    if (poll?.data) {
      trackPollView(id);
    }
  }, [poll?.data, id]);
  
  useEffect(() => {
    // Add embedded styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = 'transparent';
    
    return () => {
      // Cleanup
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 h-full">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !poll?.data) {
    return (
      <div className="p-4 text-red-500 text-center">
        <p>Error loading poll</p>
      </div>
    );
  }
  
  const { data: pollData } = poll;
  
  return (
    <div className="bg-white dark:bg-dark-bg-secondary p-4 rounded-lg shadow-sm max-w-full">
      <h1 className="text-xl font-bold mb-2">{pollData.title}</h1>
      
      {pollData.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {pollData.description}
        </p>
      )}
      
      {/* Poll content - simplified version of your voting UI */}
      <div className="mb-4">
        {/* This would be your voting interface */}
        {pollData.options.map((option, index) => (
          <div 
            key={option._id || index}
            className="mb-2 p-2 border border-gray-200 dark:border-gray-700 rounded"
          >
            {option.text}
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 text-right">
        <a 
          href={`${window.location.origin}/poll/${pollData._id}`}
          target="_blank"
          rel="noreferrer"
          className="text-mpesa-green hover:underline"
        >
          View on DShare
        </a>
      </div>
    </div>
  );
};

export default EmbedPoll;
