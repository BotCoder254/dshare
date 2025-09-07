
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FaUser, FaCalendarAlt, FaCheck, FaEye, FaEyeSlash, FaLock, 
  FaShare, FaTwitter, FaFacebook, FaLink, FaChartBar, FaFileAlt, FaDownload,
  FaArrowLeft, FaClock, FaVoteYea, FaShieldAlt, FaExclamationCircle, FaStopwatch,
  FaImage, FaCameraRetro, FaHistory, FaPauseCircle, FaPlayCircle, FaTags, FaUserFriends
} from 'react-icons/fa';
import { getPoll, votePoll, getPollHistory } from '../services/poll.service';
import { useAuth } from '../contexts/AuthContext';

// Chart component for ranked-choice voting
const RankedChoiceChart = ({ poll }) => {
  // For ranked-choice voting, we need to process all the votes to show the rounds
  // This is a simplified visualization showing just the first-choice votes
  
  // Count first-choice votes for each option
  const firstChoiceVotes = {};
  let totalFirstChoiceVotes = 0;
  
  // Initialize with zeros
  poll.options.forEach(option => {
    firstChoiceVotes[option._id] = 0;
  });
  
  // Count first-choice votes from all voters
  poll.voters.forEach(voter => {
    if (voter.choices && voter.choices.length > 0) {
      const firstChoice = voter.choices.find(choice => choice.rank === 1);
      if (firstChoice && firstChoice.option) {
        firstChoiceVotes[firstChoice.option] = (firstChoiceVotes[firstChoice.option] || 0) + 1;
        totalFirstChoiceVotes++;
      }
    }
  });
  
  // Sort options by first-choice votes
  const sortedOptions = [...poll.options].sort((a, b) => 
    (firstChoiceVotes[b._id] || 0) - (firstChoiceVotes[a._id] || 0)
  );
  
  return (
    <div className="space-y-4">
      <div className="mb-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Showing first-choice votes for ranked-choice poll
      </div>
      
      {sortedOptions.map(option => {
        const votes = firstChoiceVotes[option._id] || 0;
        const percentage = totalFirstChoiceVotes > 0 
          ? Math.round((votes / totalFirstChoiceVotes) * 100) 
          : 0;
        
        return (
          <div key={option._id} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{option.text}</span>
              <span className="text-gray-600 dark:text-gray-300">
                {votes} first choice vote{votes !== 1 ? 's' : ''} ({percentage}%)
              </span>
            </div>
            <div className="relative h-10 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-mpesa-green rounded-md"
              />
              <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                <span className="text-sm font-medium text-white drop-shadow-md">
                  {percentage > 10 ? `${percentage}%` : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium mb-2">About Ranked-Choice Voting</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          In ranked-choice voting, voters rank options in order of preference. If no option receives a majority of first-choice votes, the option with the fewest votes is eliminated, and votes are redistributed based on the next choices on each ballot. This process continues until an option receives a majority.
        </p>
      </div>
    </div>
  );
};

// Chart component for score voting
const ScoreVotingChart = ({ poll }) => {
  // Calculate average score for each option
  const scores = {};
  const voteCount = {};
  
  // Initialize
  poll.options.forEach(option => {
    scores[option._id] = 0;
    voteCount[option._id] = 0;
  });
  
  // Calculate total scores
  poll.voters.forEach(voter => {
    if (voter.choices && voter.choices.length > 0) {
      voter.choices.forEach(choice => {
        if (choice.option && typeof choice.score === 'number') {
          scores[choice.option] = (scores[choice.option] || 0) + choice.score;
          voteCount[choice.option] = (voteCount[choice.option] || 0) + 1;
        }
      });
    }
  });
  
  // Calculate average scores
  const averageScores = {};
  Object.keys(scores).forEach(optionId => {
    averageScores[optionId] = voteCount[optionId] > 0 
      ? scores[optionId] / voteCount[optionId] 
      : 0;
  });
  
  // Sort options by average score
  const sortedOptions = [...poll.options].sort((a, b) => 
    averageScores[b._id] - averageScores[a._id]
  );
  
  return (
    <div className="space-y-4">
      {sortedOptions.map(option => {
        const avgScore = averageScores[option._id] || 0;
        const roundedScore = Math.round(avgScore * 10) / 10; // Round to 1 decimal place
        const percentage = Math.round((avgScore / 10) * 100); // Convert to percentage (scale of 10)
        
        return (
          <div key={option._id} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{option.text}</span>
              <span className="text-gray-600 dark:text-gray-300">
                Average: <span className="font-bold">{roundedScore.toFixed(1)}</span>/10 
                ({voteCount[option._id] || 0} vote{voteCount[option._id] !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="relative h-10 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-mpesa-green rounded-md"
              />
              <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                <span className="text-sm font-medium text-white drop-shadow-md">
                  {percentage > 10 ? `${roundedScore.toFixed(1)}/10` : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium mb-2">About Score Voting</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          In score voting, voters rate each option on a scale (1-10). The option with the highest average score wins. This method allows voters to express the strength of their preferences for multiple options.
        </p>
      </div>
    </div>
  );
};

// Bar chart component for poll results
const PollBarChart = ({ options, totalVotes }) => {
  // Sort options by votes (highest first)
  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);
  
  return (
    <div className="space-y-4 mt-4">
      {sortedOptions.map(option => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        
        return (
          <div key={option._id} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{option.text}</span>
              <span className="text-gray-600 dark:text-gray-300">
                {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage}%)
              </span>
            </div>
            <div className="relative h-10 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-mpesa-green rounded-md"
              />
              <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                <span className="text-sm font-medium text-white drop-shadow-md">
                  {percentage > 10 ? `${percentage}%` : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Historical trend line chart component
const PollTrendChart = ({ historyData, options }) => {
  // Process historical data into a time series format
  const processedData = historyData?.map(snapshot => {
    const dataPoint = {
      timestamp: new Date(snapshot.timestamp),
      total: 0,
    };
    
    // Add vote count for each option
    options.forEach(option => {
      const optionData = snapshot.options.find(opt => opt._id === option._id);
      const votes = optionData ? optionData.votes : 0;
      dataPoint[option._id] = votes;
      dataPoint.total += votes;
    });
    
    return dataPoint;
  }) || [];
  
  // Sort by timestamp
  processedData.sort((a, b) => a.timestamp - b.timestamp);
  
  // If no historical data is available
  if (!processedData.length) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-8 text-center">
        <FaHistory className="mx-auto text-gray-400 mb-4" size={32} />
        <h3 className="text-lg font-medium mb-2">No historical data available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Historical data will appear as more votes come in.
        </p>
      </div>
    );
  }
  
  // Format the date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Calculate chart dimensions
  const chartWidth = 100;
  const chartHeight = 50;
  const padding = 5;
  const innerWidth = chartWidth - (padding * 2);
  const innerHeight = chartHeight - (padding * 2);
  
  // Calculate scales for x and y axes
  const xMin = Math.min(...processedData.map(d => d.timestamp));
  const xMax = Math.max(...processedData.map(d => d.timestamp));
  const yMax = Math.max(...processedData.map(d => d.total), 10);
  
  // Map data point to SVG coordinates
  const mapX = (timestamp) => {
    const range = xMax - xMin;
    const normalized = (timestamp - xMin) / range;
    return padding + (normalized * innerWidth);
  };
  
  const mapY = (value) => {
    const normalized = value / yMax;
    return (chartHeight - padding) - (normalized * innerHeight);
  };
  
  // Generate SVG path for each option
  const generatePath = (optionId) => {
    if (processedData.length < 2) return "";
    
    return processedData.map((point, i) => {
      const votes = point[optionId] || 0;
      const x = mapX(point.timestamp);
      const y = mapY(votes);
      
      return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(" ");
  };
  
  return (
    <div className="mt-4">
      <div className="mb-4 text-sm">
        <div className="font-medium">Vote Trend Over Time</div>
        <div className="text-gray-500 dark:text-gray-400">
          {formatDate(new Date(xMin))} to {formatDate(new Date(xMax))}
        </div>
      </div>
      
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-60 max-w-full">
          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} 
                className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} 
                className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          
          {/* Option lines */}
          {options.map((option, index) => {
            const colors = ['#4caf50', '#80e27e', '#2e7d32', '#a5d6a7', '#1b5e20'];
            const color = colors[index % colors.length];
            
            return (
              <path 
                key={option._id}
                d={generatePath(option._id)}
                fill="none"
                stroke={color}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Data points */}
          {options.map((option, optIndex) => {
            const colors = ['#4caf50', '#80e27e', '#2e7d32', '#a5d6a7', '#1b5e20'];
            const color = colors[optIndex % colors.length];
            
            return processedData.map((point, i) => {
              const votes = point[option._id] || 0;
              const x = mapX(point.timestamp);
              const y = mapY(votes);
              
              return (
                <circle 
                  key={`${option._id}-${i}`}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill={color}
                >
                  <title>{option.text}: {votes} vote{votes !== 1 ? 's' : ''} at {formatDate(point.timestamp)}</title>
                </circle>
              );
            });
          })}
          
          {/* X-axis labels */}
          {processedData.filter((_, i) => i === 0 || i === processedData.length - 1 || i === Math.floor(processedData.length / 2)).map((point, i) => {
            const x = mapX(point.timestamp);
            return (
              <text 
                key={i}
                x={x}
                y={chartHeight - 1}
                textAnchor={i === 0 ? "start" : i === processedData.length - 1 ? "end" : "middle"}
                className="fill-gray-500 dark:fill-gray-400"
                style={{ fontSize: "2px" }}
              >
                {formatDate(point.timestamp)}
              </text>
            );
          })}
          
          {/* Y-axis labels */}
          {[0, Math.floor(yMax / 2), yMax].map((value, i) => {
            const y = mapY(value);
            return (
              <text 
                key={i}
                x={padding - 0.5}
                y={y + 0.5}
                textAnchor="end"
                alignmentBaseline="middle"
                className="fill-gray-500 dark:fill-gray-400"
                style={{ fontSize: "2px" }}
              >
                {value}
              </text>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map((option, index) => {
          const colors = ['#4caf50', '#80e27e', '#2e7d32', '#a5d6a7', '#1b5e20'];
          const color = colors[index % colors.length];
          
          return (
            <div key={option._id} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm truncate">{option.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Donut chart component
const PollDonutChart = ({ options, totalVotes }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative pt-[100%]">
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          {totalVotes > 0 ? (
            <>
              {options.reduce((acc, option, index) => {
                const percentage = (option.votes / totalVotes) || 0;
                const colors = ['#4caf50', '#80e27e', '#2e7d32', '#a5d6a7', '#1b5e20'];
                const color = colors[index % colors.length];
                
                // Calculate the slice position
                const prevOffset = acc.offset;
                const slicePercentage = percentage * 100;
                const strokeDasharray = `${slicePercentage} ${100 - slicePercentage}`;
                
                // Rotate so each slice starts where the previous ended
                const strokeDashoffset = 25 + prevOffset;
                
                acc.offset += slicePercentage;
                
                return {
                  offset: acc.offset,
                  elements: [
                    ...acc.elements,
                    <circle
                      key={option._id}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={`${strokeDashoffset}`}
                      className="transition-all duration-700 ease-out"
                    >
                      <title>{option.text}: {option.votes} vote{option.votes !== 1 ? 's' : ''}</title>
                    </circle>
                  ]
                };
              }, { offset: 0, elements: [] }).elements}
              
              {/* Inner circle for donut effect */}
              <circle
                cx="50"
                cy="50"
                r="30"
                className="fill-white dark:fill-dark-bg-primary"
              />
              
              {/* Total votes in the center */}
              <text
                x="50"
                y="48"
                textAnchor="middle"
                className="fill-gray-800 dark:fill-white text-lg font-bold"
                style={{ fontSize: '10px' }}
              >
                {totalVotes}
              </text>
              <text
                x="50"
                y="58"
                textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-300"
                style={{ fontSize: '6px' }}
              >
                VOTES
              </text>
            </>
          ) : (
            // No votes yet
            <g>
              <circle
                cx="50"
                cy="50"
                r="40"
                className="fill-transparent stroke-gray-300 dark:stroke-gray-700"
                strokeWidth="20"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                className="fill-white dark:fill-dark-bg-primary"
              />
              <text
                x="50"
                y="53"
                textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-400"
                style={{ fontSize: '8px' }}
              >
                NO VOTES YET
              </text>
            </g>
          )}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {options.map((option, index) => {
          const colors = ['#4caf50', '#80e27e', '#2e7d32', '#a5d6a7', '#1b5e20'];
          const color = colors[index % colors.length];
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          
          return (
            <div key={option._id} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm truncate">{option.text}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  // For single-choice voting
  const [selectedOption, setSelectedOption] = useState(null);
  
  // For multiple-choice voting
  const [selectedOptions, setSelectedOptions] = useState([]);
  
  // For ranked-choice voting
  const [rankedOptions, setRankedOptions] = useState([]);
  
  // For score voting
  const [optionScores, setOptionScores] = useState({});
  
  const [pollPassword, setPollPassword] = useState('');
  const [error, setError] = useState('');
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [chartType, setChartType] = useState('bar'); // 'bar', 'donut', 'line', or 'area'
  const [liveMode, setLiveMode] = useState(true); // Toggle between live and snapshot mode
  const [showHistory, setShowHistory] = useState(false); // Toggle to show historical data
  const [timeRange, setTimeRange] = useState('1h'); // Time range for historical data: '1h', '24h', '7d', '30d'
  const [snapshotTime, setSnapshotTime] = useState(null); // Timestamp for snapshot mode
  const chartRef = useRef(null); // Reference for exporting chart as image
  
  // Fetch poll data with real-time updates
  const {
    data: pollData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['poll', id],
    queryFn: () => getPoll(id),
    refetchInterval: liveMode ? 5000 : false, // Poll for updates every 5 seconds in live mode only
    refetchIntervalInBackground: liveMode // Continue polling even when tab is in background
  });
  
  // Fetch historical data
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError
  } = useQuery({
    queryKey: ['poll-history', id, timeRange],
    queryFn: () => getPollHistory(id, timeRange),
    enabled: showHistory, // Only fetch if history view is enabled
    refetchInterval: liveMode ? 30000 : false // Less frequent updates for historical data
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ pollId, voteData, password }) => {
      // The votePoll function needs to be updated in the service to handle different vote types
      return votePoll(pollId, voteData, password);
    },
    onSuccess: () => {
      // Reset form state
      setSelectedOption(null);
      setSelectedOptions([]);
      setRankedOptions([]);
      setOptionScores({});
      setPollPassword('');
      setError('');
      
      // Refetch poll data to get updated results
      queryClient.invalidateQueries(['poll', id]);
      
      // Show success message
      alert('Your vote has been recorded!');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Error submitting your vote');
    }
  });

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const poll = pollData.data;
    const votingSystem = poll.votingSystem || 'single-choice';
    
    // Validation based on voting system type
    if (votingSystem === 'single-choice' && !selectedOption) {
      setError('Please select an option');
      return;
    } else if (votingSystem === 'multiple-choice' && selectedOptions.length === 0) {
      setError('Please select at least one option');
      return;
    } else if (votingSystem === 'ranked-choice' && rankedOptions.length !== poll.options.length) {
      setError('Please rank all options');
      return;
    } else if (votingSystem === 'score-voting') {
      const allOptionsScored = poll.options.every(option => 
        typeof optionScores[option._id] === 'number' && 
        optionScores[option._id] >= 1 && 
        optionScores[option._id] <= 10
      );
      
      if (!allOptionsScored) {
        setError('Please assign a score to all options (1-10)');
        return;
      }
    }
    
    // Check if authentication is required
    if (poll.privacy !== 'public' && !isAuthenticated) {
      setError('You must be logged in to vote on this poll');
      return;
    }
    
    // Check if password is required
    if (poll.privacy === 'password-protected' && !pollPassword) {
      setError('This poll requires a password');
      return;
    }
    
    // Prepare vote data based on voting system
    let voteData;
    
    switch (votingSystem) {
      case 'single-choice':
        voteData = { type: 'single', optionId: selectedOption };
        break;
      
      case 'multiple-choice':
        voteData = { type: 'multiple', optionIds: selectedOptions };
        break;
        
      case 'ranked-choice':
        voteData = { 
          type: 'ranked',
          ranking: rankedOptions.map((optionId, index) => ({
            optionId,
            rank: index + 1
          }))
        };
        break;
        
      case 'score-voting':
        voteData = {
          type: 'score',
          scores: Object.entries(optionScores).map(([optionId, score]) => ({
            optionId,
            score
          }))
        };
        break;
        
      default:
        voteData = { type: 'single', optionId: selectedOption };
    }
    
    // Submit vote
    voteMutation.mutate({
      pollId: poll._id,
      voteData,
      password: poll.privacy === 'password-protected' ? pollPassword : null
    });
  };

  // Check if user has already voted
  const hasVoted = () => {
    if (!pollData?.data || !isAuthenticated || !user) return false;
    
    return pollData.data.voters.some(voter => voter.user === user.id);
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate time remaining
  const getTimeRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} left`;
    }
  };

  // Copy poll link to clipboard
  const copyPollLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Poll link copied to clipboard!');
    setShareDropdownOpen(false);
  };
  
  // Export poll results as CSV
  const exportToCSV = () => {
    if (!pollData?.data) return;
    
    const poll = pollData.data;
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    
    let csvContent = 'Option,Votes,Percentage\n';
    
    // Add each option's data
    poll.options.forEach(option => {
      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
      csvContent += `"${option.text}",${option.votes},${percentage.toFixed(2)}%\n`;
    });
    
    // Add total
    csvContent += `Total,${totalVotes},100%\n`;
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `poll-results-${poll._id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export poll chart as PNG image
  const exportToImage = () => {
    if (!chartRef.current) return;
    
    // Use html2canvas or similar library to capture chart as image
    // This is a simplified implementation - in production, use a proper library
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const chartElement = chartRef.current;
    
    canvas.width = chartElement.offsetWidth;
    canvas.height = chartElement.offsetHeight;
    
    // Create a screenshot using html2canvas (simplified implementation)
    alert('Image export functionality would capture the chart as PNG here');
    
    // In a real implementation:
    // html2canvas(chartElement).then(canvas => {
    //   const link = document.createElement('a');
    //   link.download = `poll-chart-${pollData.data._id}.png`;
    //   link.href = canvas.toDataURL('image/png');
    //   link.click();
    // });
  };

  // Check if poll results should be shown
  const shouldShowResults = () => {
    if (!pollData?.data) return false;
    
    const poll = pollData.data;
    
    // If results are hidden by the API
    if (pollData.hideResults) return false;
    
    // If poll is set to show results after voting
    if (poll.showResults === 'after-vote') {
      return hasVoted();
    }
    
    // If poll is set to show results after closing
    if (poll.showResults === 'after-close') {
      return poll.expiresAt && new Date(poll.expiresAt) < new Date();
    }
    
    // Default - always show results
    return true;
  };

  // Calculate total votes
  const totalVotes = pollData?.data ? 
    pollData.data.options.reduce((sum, option) => sum + option.votes, 0) : 0;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mpesa-green"></div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaExclamationCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Error Loading Poll</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We couldn't load this poll. It might have been removed or is no longer available.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors"
          >
            Try Again
          </button>
          <Link
            to="/dashboard"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const poll = pollData.data;
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const userIsCreator = isAuthenticated && user?.id === poll.creator?._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-mpesa-green hover:underline"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md overflow-hidden"
      >
        {/* Poll header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {poll.title}
            </h1>
            
            {/* Share dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaShare className="text-mpesa-green" />
              </button>
              
              {shareDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-primary rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={copyPollLink}
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <FaLink className="mr-2" />
                    Copy Link
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=Vote on this poll: ${poll.title}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShareDropdownOpen(false)}
                  >
                    <FaTwitter className="mr-2" />
                    Share on Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShareDropdownOpen(false)}
                  >
                    <FaFacebook className="mr-2" />
                    Share on Facebook
                  </a>
                </div>
              )}
            </div>
          </div>

          {poll.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-4">
              {poll.description}
            </p>
          )}

          <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-y-2">
            {/* Creator info */}
            <div className="flex items-center mr-4">
              <FaUser className="mr-1" />
              <span>By {poll.creator?.name || 'Anonymous'}</span>
            </div>
            
            {/* Created date */}
            <div className="flex items-center mr-4">
              <FaCalendarAlt className="mr-1" />
              <span>Created {formatDate(poll.createdAt)}</span>
            </div>
            
            {/* Expiry info */}
            {poll.expiresAt && (
              <div className="flex items-center mr-4">
                <FaClock className="mr-1" />
                <span>{isExpired ? 'Expired' : getTimeRemaining(poll.expiresAt)}</span>
              </div>
            )}
            
            {/* Total votes */}
            <div className="flex items-center mr-4">
              <FaVoteYea className="mr-1" />
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Privacy status */}
            {poll.privacy !== 'public' && (
              <div className="flex items-center mr-4">
                <FaLock className="mr-1" />
                <span>{poll.privacy === 'private' ? 'Private poll' : 'Password-protected'}</span>
              </div>
            )}
            
            {/* Results visibility */}
            <div className="flex items-center">
              {poll.showResults !== 'always' ? (
                <>
                  <FaEyeSlash className="mr-1" />
                  <span>
                    {poll.showResults === 'after-vote' ? 'Results shown after voting' : 'Results shown after poll ends'}
                  </span>
                </>
              ) : (
                <>
                  <FaEye className="mr-1" />
                  <span>Results visible to all</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="md:flex md:gap-8">
            {/* Voting form */}
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
              
              {isExpired ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4 text-amber-800 dark:text-amber-200">
                  <p className="flex items-center">
                    <FaExclamationCircle className="mr-2" />
                    This poll has expired. Voting is no longer allowed.
                  </p>
                </div>
              ) : hasVoted() ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 text-green-800 dark:text-green-200">
                  <p className="flex items-center">
                    <FaCheck className="mr-2" />
                    You have already voted in this poll.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {poll.privacy === 'private' && !isAuthenticated && (
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4 text-amber-800 dark:text-amber-200">
                      <div className="flex items-center">
                        <FaShieldAlt className="mr-2" />
                        <p>This is a private poll. Please <Link to="/login" className="underline">login</Link> to vote.</p>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3 text-red-800 dark:text-red-200">
                      {error}
                    </div>
                  )}
                  
                  {/* Voting mechanism description */}
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <h3 className="font-medium mb-1">
                      {poll.votingSystem === 'single-choice' && 'Single Choice Voting'}
                      {poll.votingSystem === 'multiple-choice' && 'Multiple Choice Voting'}
                      {poll.votingSystem === 'ranked-choice' && 'Ranked Choice Voting'}
                      {poll.votingSystem === 'score-voting' && 'Score Voting (1-10)'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {poll.votingSystem === 'single-choice' && 'Select one option that you prefer the most.'}
                      {poll.votingSystem === 'multiple-choice' && 'Select one or more options that you support.'}
                      {poll.votingSystem === 'ranked-choice' && 'Drag to rank all options from most preferred (top) to least preferred (bottom).'}
                      {poll.votingSystem === 'score-voting' && 'Rate each option on a scale from 1 (lowest) to 10 (highest).'}
                    </p>
                  </div>
                  
                  {/* Single Choice Voting */}
                  {poll.votingSystem === 'single-choice' && (
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <label 
                          key={option._id}
                          className={`block p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedOption === option._id 
                              ? 'border-mpesa-green bg-mpesa-green/5' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="poll-option"
                              value={option._id}
                              checked={selectedOption === option._id}
                              onChange={() => setSelectedOption(option._id)}
                              className="mr-3 text-mpesa-green focus:ring-mpesa-green"
                            />
                            <span>{option.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {/* Multiple Choice Voting */}
                  {poll.votingSystem === 'multiple-choice' && (
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <label 
                          key={option._id}
                          className={`block p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedOptions.includes(option._id) 
                              ? 'border-mpesa-green bg-mpesa-green/5' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              value={option._id}
                              checked={selectedOptions.includes(option._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOptions([...selectedOptions, option._id]);
                                } else {
                                  setSelectedOptions(selectedOptions.filter(id => id !== option._id));
                                }
                              }}
                              className="mr-3 text-mpesa-green focus:ring-mpesa-green rounded"
                            />
                            <span>{option.text}</span>
                          </div>
                        </label>
                      ))}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Selected {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                  
                  {/* Ranked Choice Voting */}
                  {poll.votingSystem === 'ranked-choice' && (
                    <div className="space-y-2 mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Drag to reorder options based on your preference (most preferred at the top)
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        {rankedOptions.length === 0 ? (
                          // Show options in original order if not yet ranked
                          poll.options.map((option, index) => (
                            <div 
                              key={option._id}
                              className="p-3 border-b last:border-b-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary flex items-center"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('optionId', option._id);
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const draggedId = e.dataTransfer.getData('optionId');
                                const newRankedOptions = [...poll.options.map(o => o._id)];
                                const draggedIndex = newRankedOptions.indexOf(draggedId);
                                const targetIndex = index;
                                
                                newRankedOptions.splice(draggedIndex, 1);
                                newRankedOptions.splice(targetIndex, 0, draggedId);
                                
                                setRankedOptions(newRankedOptions);
                              }}
                            >
                              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <span>{option.text}</span>
                            </div>
                          ))
                        ) : (
                          // Show options in ranked order
                          rankedOptions.map((optionId, index) => {
                            const option = poll.options.find(o => o._id === optionId);
                            return (
                              <div 
                                key={optionId}
                                className="p-3 border-b last:border-b-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary flex items-center"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('optionId', optionId);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const draggedId = e.dataTransfer.getData('optionId');
                                  const newRankedOptions = [...rankedOptions];
                                  const draggedIndex = newRankedOptions.indexOf(draggedId);
                                  const targetIndex = index;
                                  
                                  newRankedOptions.splice(draggedIndex, 1);
                                  newRankedOptions.splice(targetIndex, 0, draggedId);
                                  
                                  setRankedOptions(newRankedOptions);
                                }}
                              >
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                  {index + 1}
                                </div>
                                <span>{option.text}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setRankedOptions(poll.options.map(o => o._id))}
                        className="text-sm text-mpesa-green hover:underline mt-2"
                      >
                        {rankedOptions.length === 0 ? 'Start ranking' : 'Reset ranking'}
                      </button>
                    </div>
                  )}
                  
                  {/* Score Voting */}
                  {poll.votingSystem === 'score-voting' && (
                    <div className="space-y-4">
                      {poll.options.map((option) => (
                        <div key={option._id} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                          <div className="flex justify-between mb-2">
                            <span>{option.text}</span>
                            <span className="font-bold text-mpesa-green">
                              {optionScores[option._id] || '-'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-sm">1</span>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={optionScores[option._id] || 5}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                setOptionScores({
                                  ...optionScores,
                                  [option._id]: value
                                });
                              }}
                              className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-md appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mpesa-green"
                            />
                            <span className="ml-2 text-sm">10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {poll.privacy === 'password' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Poll Password
                      </label>
                      <input
                        type="password"
                        value={pollPassword}
                        onChange={(e) => setPollPassword(e.target.value)}
                        placeholder="Enter password to vote"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mpesa-green dark:bg-gray-800"
                        required={poll.privacy === 'password'}
                      />
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={!selectedOption || voteMutation.isLoading}
                    className="mt-4 w-full px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                  >
                    {voteMutation.isLoading ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </form>
              )}
            </div>
            
            {/* Results section */}
            <div className="md:w-1/2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Results</h2>
                
                {/* Live/Snapshot toggle */}
                {shouldShowResults() && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setLiveMode(!liveMode);
                        if (!liveMode) setSnapshotTime(null); // Clear snapshot time when switching to live
                      }}
                      className="flex items-center text-xs mr-2 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
                      title={liveMode ? "Pause live updates" : "Resume live updates"}
                    >
                      {liveMode ? (
                        <>
                          <FaPauseCircle className="mr-1 text-mpesa-green" /> Live
                        </>
                      ) : (
                        <>
                          <FaPlayCircle className="mr-1 text-gray-400" /> Snapshot {snapshotTime && `(${formatDate(snapshotTime)})`}
                        </>
                      )}
                    </button>
                    
                    {/* Export options */}
                    <div className="relative inline-block">
                      <button
                        onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <FaDownload className="inline mr-1" /> Export
                      </button>
                      
                      <div 
                        id="export-dropdown"
                        className="hidden absolute right-0 mt-1 w-36 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg py-1 z-10"
                      >
                        <button
                          onClick={exportToCSV}
                          className="flex items-center w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <FaFileAlt className="mr-2" /> Export as CSV
                        </button>
                        <button
                          onClick={exportToImage}
                          className="flex items-center w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <FaImage className="mr-2" /> Save as Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* View controls */}
              {shouldShowResults() && totalVotes > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {/* Chart type toggle */}
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <button
                      onClick={() => { 
                        setChartType('bar');
                        setShowHistory(false);
                      }}
                      className={`px-3 py-1 text-xs ${
                        chartType === 'bar' && !showHistory
                          ? 'bg-mpesa-green text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => {
                        setChartType('donut');
                        setShowHistory(false);
                      }}
                      className={`px-3 py-1 text-xs ${
                        chartType === 'donut' && !showHistory
                          ? 'bg-mpesa-green text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      Donut
                    </button>
                    <button
                      onClick={() => {
                        setShowHistory(true);
                      }}
                      className={`px-3 py-1 text-xs ${
                        showHistory
                          ? 'bg-mpesa-green text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      Trends
                    </button>
                  </div>
                  
                  {/* Time range selector (for history view) */}
                  {showHistory && (
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      {['1h', '24h', '7d', '30d'].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-3 py-1 text-xs ${
                            timeRange === range
                              ? 'bg-mpesa-green text-white' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {!shouldShowResults() ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-8 text-center">
                  <FaEyeSlash className="mx-auto text-gray-400 mb-4" size={32} />
                  <h3 className="text-lg font-medium mb-2">Results are hidden</h3>
                  {poll.showResults === 'after-vote' && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Results will be visible after you vote
                    </p>
                  )}
                  {poll.showResults === 'after-close' && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Results will be visible after the poll closes
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {totalVotes === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-8 text-center">
                      <FaChartBar className="mx-auto text-gray-400 mb-4" size={32} />
                      <h3 className="text-lg font-medium mb-2">No votes yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Be the first one to vote on this poll!
                      </p>
                    </div>
                  ) : (
                    <div ref={chartRef}>
                      {/* Live update indicator */}
                      {liveMode && (
                        <div className="flex items-center justify-end mb-2">
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Live updates</span>
                        </div>
                      )}
                      
                      {/* Chart display based on type and voting system */}
                      {showHistory ? (
                        historyLoading ? (
                          <div className="flex justify-center items-center h-60">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpesa-green"></div>
                          </div>
                        ) : (
                          <PollTrendChart 
                            historyData={historyData?.data || []} 
                            options={poll.options} 
                          />
                        )
                      ) : poll.votingSystem === 'ranked-choice' ? (
                        <RankedChoiceChart poll={poll} />
                      ) : poll.votingSystem === 'score-voting' ? (
                        <ScoreVotingChart poll={poll} />
                      ) : chartType === 'bar' ? (
                        <PollBarChart options={poll.options} totalVotes={totalVotes} />
                      ) : (
                        <PollDonutChart options={poll.options} totalVotes={totalVotes} />
                      )}
                      
                      {/* Additional statistics */}
                      {!showHistory && (
                        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-md">
                            <div className="text-3xl font-bold text-mpesa-green">{totalVotes}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Votes</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-md">
                            <div className="text-3xl font-bold text-mpesa-green">
                              {poll.voters.length > 0 && new Date(
                                Math.max(...poll.voters.map(voter => new Date(voter.votedAt)))
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Last Vote</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Show admin actions if user is the poll creator */}
              {userIsCreator && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-3">Poll Actions</h3>
                  <div className="flex space-x-2">
                    <Link
                      to={`/polls/${poll._id}/edit`}
                      className="px-3 py-1.5 border border-mpesa-green text-mpesa-green rounded hover:bg-mpesa-green/10 text-sm"
                    >
                      Edit Poll
                    </Link>
                    <button
                      className="px-3 py-1.5 border border-red-500 text-red-500 rounded hover:bg-red-500/10 text-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
                          // Add delete function here
                        }
                      }}
                    >
                      Delete Poll
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PollDetail;
