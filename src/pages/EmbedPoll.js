import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaChartBar, FaPoll } from 'react-icons/fa';
import { getPollById, votePoll } from '../services/poll.service';
import { trackPollView } from '../services/search.service';
import LoadingSpinner from '../components/LoadingSpinner';
import io from 'socket.io-client';

// Enhanced embedded poll page with voting and real-time results
const EmbedPoll = () => {
  const { id } = useParams();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const socketRef = useRef(null);
  
  // Check if in preview mode
  const isPreviewMode = window.location.pathname.includes('/preview/');
  
  // Check if user has already voted
  useEffect(() => {
    const hasVoted = localStorage.getItem(`voted-${id}`);
    if (hasVoted) {
      setVoted(true);
      setShowResults(true);
    }
  }, [id]);
  
  // Query for poll data
  const {
    data: poll,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['embedded-poll', id],
    queryFn: () => getPollById(id),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
  
  // Track view
  useEffect(() => {
    if (poll?.data) {
      trackPollView(id);
    }
  }, [poll?.data, id]);
  
  // Set up real-time updates
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    if (showResults && !socketRef.current && id) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit('join-poll', id);
      
      socketRef.current.on('poll-vote', (updatedPoll) => {
        if (updatedPoll._id === id) {
          setRealTimeData(updatedPoll);
        }
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-poll', id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id, showResults]);
  
  // Embedded styles
  useEffect(() => {
    // Add embedded styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = 'transparent';
    
    // Check for dark mode preference from parent
    try {
      // First check for system dark mode preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDarkMode) {
        document.documentElement.classList.add('dark');
      }
      
      // Then listen for messages from parent frame
      window.addEventListener('message', (event) => {
        if (event.data === 'enable-dark-mode') {
          document.documentElement.classList.add('dark');
        } else if (event.data === 'disable-dark-mode') {
          document.documentElement.classList.remove('dark');
        }
      });
      
      // Notify parent that we're ready
      if (window.parent !== window) {
        window.parent.postMessage('poll-embedded', '*');
      }
    } catch (e) {
      // Ignore cross-origin frame errors
    }
    
    return () => {
      // Cleanup
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);
  
  // Generate or get device token for vote tracking
  const getDeviceToken = () => {
    let deviceToken = localStorage.getItem('dshare-device-token');
    if (!deviceToken) {
      // Generate a random token for this device
      deviceToken = 'dt-' + Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      localStorage.setItem('dshare-device-token', deviceToken);
    }
    return deviceToken;
  };
  
  // Handle voting
  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      const deviceToken = getDeviceToken();
      const response = await votePoll(id, { 
        optionId: selectedOption, 
        deviceToken,
        isEmbedded: true 
      });
      
      if (response.success) {
        setVoted(true);
        setShowResults(true);
        // Store vote in local storage to prevent multiple votes
        localStorage.setItem(`voted-${id}`, 'true');
        // Refetch to get updated data
        refetch();
      } else {
        setError(response.message || 'Failed to vote. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while voting. Please try again.');
      console.error('Voting error:', err);
    } finally {
      setIsVoting(false);
    }
  };
  
  // Reset vote to let user change their mind before submitting
  const resetSelection = () => {
    if (!isVoting) {
      setSelectedOption(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 h-full">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!poll?.data) {
    return (
      <div className="p-4 text-red-500 text-center bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm">
        <p>Error loading poll. The poll may have been deleted or is not available.</p>
      </div>
    );
  }
  
  const pollData = realTimeData || poll.data;
  const totalVotes = pollData.options.reduce((sum, option) => sum + option.votes, 0);
  
  return (
    <div className="bg-white dark:bg-dark-bg-secondary p-4 rounded-lg shadow-sm max-w-full transition duration-200">
      {/* Poll header with title and description */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-mpesa-green mt-1">
          <FaPoll size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pollData.title}</h1>
          
          {pollData.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {pollData.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <AnimatePresence mode="wait">
        {!showResults ? (
          /* Voting interface */
          <motion.div 
            key="voting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <div className="space-y-2">
              {pollData.options.map((option, index) => (
                <button
                  key={option._id || index}
                  onClick={() => setSelectedOption(option._id)}
                  disabled={isVoting}
                  className={`w-full text-left transition duration-200 p-3 rounded-md border ${
                    selectedOption === option._id
                      ? 'border-mpesa-green bg-mpesa-green/5 dark:bg-mpesa-green/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-mpesa-green/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.text}</span>
                    {selectedOption === option._id && (
                      <FaCheckCircle className="text-mpesa-green" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-between mt-4">
              <button
                onClick={resetSelection}
                disabled={!selectedOption || isVoting}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  !selectedOption
                    ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Clear Selection
              </button>
              
              <button
                onClick={handleVote}
                disabled={!selectedOption || isVoting || isPreviewMode}
                className={`px-4 py-1.5 text-sm font-medium rounded-md bg-mpesa-green text-white transition duration-200 ${
                  !selectedOption || isVoting || isPreviewMode
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:bg-mpesa-dark'
                }`}
              >
                {isVoting ? 'Voting...' : isPreviewMode ? 'Preview Only' : 'Vote'}
              </button>
            </div>
            
            {!voted && !isPreviewMode && (
              <button
                onClick={() => setShowResults(true)}
                className="w-full mt-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-mpesa-green hover:underline"
              >
                Show Results Without Voting
              </button>
            )}
            {isPreviewMode && !showResults && (
              <button
                onClick={() => setShowResults(true)}
                className="w-full mt-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-mpesa-green hover:underline"
              >
                Show Results Preview
              </button>
            )}
          </motion.div>
        ) : (
          /* Results display */
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center">
                <FaChartBar className="mr-2" /> Results
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                {voted && <span className="ml-2 text-mpesa-green">• Voted</span>}
              </div>
            </div>
            
            <div className="space-y-3">
              {pollData.options.map((option, index) => {
                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                return (
                  <div key={option._id || index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[70%]">
                        {option.text}
                      </span>
                      <span className="text-sm">
                        {percentage.toFixed(1)}% ({option.votes})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-mpesa-green h-2.5 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!voted && (
              <button
                onClick={() => setShowResults(false)}
                className="w-full mt-4 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-mpesa-green hover:underline"
              >
                Back to Vote
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer with branding */}
      {!isPreviewMode && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          <a 
            href={`${window.location.origin.replace(/\/embed$/, '')}/poll/${pollData._id}`}
            target="_blank"
            rel="noreferrer"
            className="text-mpesa-green hover:underline"
          >
            View on DShare
          </a>
        </div>
      )}
    </div>
  );
};

export default EmbedPoll;
