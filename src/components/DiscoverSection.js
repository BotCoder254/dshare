import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFire, FaChartLine, FaMagic } from 'react-icons/fa';

import { getTrendingPolls, getSuggestedPolls } from '../services/search.service';
import PollCard from './PollCard';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const DiscoverSection = () => {
  const { isAuthenticated } = useAuth();
  
  // Trending polls query
  const {
    data: trendingData,
    isLoading: trendingLoading,
    error: trendingError
  } = useQuery(['trending-polls'], () => getTrendingPolls('week', 6), {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Suggested polls query (only if authenticated)
  const {
    data: suggestedData,
    isLoading: suggestedLoading,
    error: suggestedError,
    refetch: refetchSuggested
  } = useQuery(
    ['suggested-polls'],
    () => getSuggestedPolls(6),
    {
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
  
  // Refetch suggested polls when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refetchSuggested();
    }
  }, [isAuthenticated, refetchSuggested]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Discover Polls</h2>
        <Link
          to="/discover"
          className="text-mpesa-green hover:text-mpesa-dark"
        >
          View All
        </Link>
      </div>
      
      {/* Trending Polls */}
      <div className="mb-12">
        <div className="flex items-center mb-4">
          <FaFire className="text-orange-500 mr-2" />
          <h3 className="text-xl font-semibold">Trending Now</h3>
        </div>
        
        {trendingLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : trendingError ? (
          <div className="bg-red-50 p-4 rounded-md text-red-500">
            Error loading trending polls
          </div>
        ) : trendingData?.data?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingData.data.map((poll) => (
              <motion.div
                key={poll._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PollCard poll={poll} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-dark-bg-secondary rounded-md p-8 text-center">
            <p>No trending polls available right now.</p>
          </div>
        )}
      </div>
      
      {/* Suggested Polls (for authenticated users) */}
      {isAuthenticated && (
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <FaMagic className="text-purple-500 mr-2" />
            <h3 className="text-xl font-semibold">Suggested For You</h3>
          </div>
          
          {suggestedLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : suggestedError ? (
            <div className="bg-red-50 p-4 rounded-md text-red-500">
              Error loading suggestions
            </div>
          ) : suggestedData?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedData.data.map((poll) => (
                <motion.div
                  key={poll._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PollCard poll={poll} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-dark-bg-secondary rounded-md p-8 text-center">
              <p>No suggested polls available.</p>
              <p className="text-gray-500 text-sm mt-2">
                Vote on more polls to get personalized suggestions!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoverSection;
