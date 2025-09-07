import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FaChartBar, FaChartPie, FaChartLine, FaSortAmountDown, FaSortAmountUp, FaFilter, FaTimes, FaTable, FaDotCircle, FaRegCircle } from 'react-icons/fa';
import { getUserPolls, getPollHistory } from '../services/poll.service';
import LoadingSpinner from '../components/LoadingSpinner';
import io from 'socket.io-client';

// Chart components
const PollBarChart = ({ poll }) => {
  if (!poll || !poll.options) return null;

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="space-y-2">
      {poll.options.map((option, index) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        return (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{option.text}</span>
              <span className="text-sm font-medium">{option.votes} votes ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-mpesa-green h-4 rounded-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PollPieChart = ({ poll }) => {
  if (!poll || !poll.options) return null;

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const colors = [
    'bg-mpesa-green', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
  ];
  
  // Hex color versions for SVG elements
  const hexColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#6366F1', '#EC4899', '#14B8A6'
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            let cumulativePercentage = 0;
            
            for (let i = 0; i < index; i++) {
              cumulativePercentage += totalVotes > 0 ? (poll.options[i].votes / totalVotes) * 100 : 0;
            }
            
            const startX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercentage / 100);
            const startY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercentage / 100);
            
            const endX = 50 + 40 * Math.cos(2 * Math.PI * (cumulativePercentage + percentage) / 100);
            const endY = 50 + 40 * Math.sin(2 * Math.PI * (cumulativePercentage + percentage) / 100);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            // If percentage is very small, don't render to avoid visual glitches
            if (percentage < 1) return null;
            
            return (
              <path
                key={index}
                d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                fill={hexColors[index % hexColors.length]}
                className="opacity-80 hover:opacity-100 transition-opacity"
                strokeWidth="1"
                stroke="var(--chart-stroke-color, #fff)"
                style={{
                  "--chart-stroke-color": "var(--color-bg-primary, #fff)",
                }}
              />
            );
          })}
          {/* Add a subtle inner circle for better aesthetics */}
          <circle cx="50" cy="50" r="20" fill="none" 
            className="stroke-gray-100 dark:stroke-gray-800" 
            strokeWidth="0.5" />
        </svg>
        {totalVotes === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-xl font-semibold">No votes yet</div>
              <div className="text-sm">Chart will appear when votes are cast</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend with improved dark mode support */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {poll.options.map((option, index) => (
          <div key={index} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: hexColors[index % hexColors.length] }}></div>
            <span className="text-sm truncate text-gray-800 dark:text-gray-200">{option.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut chart component - a new visualization option
const PollDonutChart = ({ poll }) => {
  if (!poll || !poll.options) return null;

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const hexColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#6366F1', '#EC4899', '#14B8A6'
  ];
  
  // Calculate stroke-dasharray and stroke-dashoffset for each segment
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Sort options by votes (highest first) for better visualization
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  
  let cumulativePercentage = 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Background circle */}
          <circle 
            cx="60" cy="60" r={radius} 
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-700" 
            strokeWidth="12" 
          />
          
          {/* Data segments */}
          {sortedOptions.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const dashLength = (percentage / 100) * circumference;
            const dashOffset = ((100 - cumulativePercentage) / 100) * circumference;
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={hexColors[index % hexColors.length]}
                strokeWidth="12"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-500 ease-in-out"
              />
            );
          })}
          
          {/* Center text */}
          <text 
            x="60" y="55" 
            textAnchor="middle" 
            className="fill-gray-800 dark:fill-gray-100 text-lg font-medium"
          >
            {totalVotes}
          </text>
          <text 
            x="60" y="70" 
            textAnchor="middle" 
            className="fill-gray-600 dark:fill-gray-300 text-xs"
          >
            Total Votes
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {sortedOptions.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          return (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: hexColors[index % hexColors.length] }}></div>
              <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                {option.text} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line chart for time-series data
const PollLineChart = ({ poll, historyData }) => {
  if (!poll || !poll.options) return null;
  
  // If we don't have history data yet, show placeholder
  if (!historyData) {
    return (
      <div className="flex items-center justify-center h-40 text-center text-gray-500 dark:text-gray-400">
        <div>
          <LoadingSpinner size="sm" />
          <p className="mt-2">Loading historical data...</p>
        </div>
      </div>
    );
  }
  
  // If history data is empty, show message
  if (historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-center text-gray-500 dark:text-gray-400">
        <div>
          <p>No historical data available</p>
          <p className="text-sm">(Vote activity will generate trends over time)</p>
        </div>
      </div>
    );
  }
  
  // Calculate max value for scaling
  const maxValue = Math.max(...historyData.flatMap(point => 
    Object.values(point.votes).map(Number)
  ));
  
  // Get option names and prepare colors
  const options = poll.options;
  const hexColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#6366F1', '#EC4899', '#14B8A6'
  ];
  
  // Chart dimensions
  const width = 300;
  const height = 150;
  const padding = 20;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  // X-axis points - we'll use timestamps
  const timestamps = historyData.map(point => new Date(point.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  
  // Create line paths for each option
  const createLinePath = (optionId) => {
    const points = historyData.map((point, i) => {
      // Calculate x position based on timestamp
      const x = padding + ((point.timestamp - minTime) / (maxTime - minTime)) * chartWidth;
      // Calculate y position based on vote count
      const voteCount = point.votes[optionId] || 0;
      const y = height - padding - ((voteCount / maxValue) * chartHeight) || height - padding;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return points;
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-40 relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Time axis (x-axis) - subtle line */}
          <line 
            x1={padding} 
            y1={height - padding} 
            x2={width - padding} 
            y2={height - padding}
            className="stroke-gray-300 dark:stroke-gray-600" 
            strokeWidth="1" 
          />
          
          {/* Draw lines for each option */}
          {options.map((option, i) => (
            <path 
              key={i}
              d={createLinePath(option._id || i.toString())}
              fill="none" 
              stroke={hexColors[i % hexColors.length]} 
              strokeWidth="2"
              className="transition-all duration-500"
            />
          ))}
          
          {/* Draw dots for the last data point of each line */}
          {options.map((option, i) => {
            const lastPoint = historyData[historyData.length - 1];
            const x = padding + ((lastPoint.timestamp - minTime) / (maxTime - minTime)) * chartWidth;
            const voteCount = lastPoint.votes[option._id || i.toString()] || 0;
            const y = height - padding - ((voteCount / maxValue) * chartHeight) || height - padding;
            
            return (
              <circle 
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill={hexColors[i % hexColors.length]}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        
        {/* Time indicators - start and end date */}
        <div className="absolute bottom-0 left-0 text-xs text-gray-500 dark:text-gray-400">
          {new Date(minTime).toLocaleDateString()}
        </div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          {new Date(maxTime).toLocaleDateString()}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map((option, i) => (
          <div key={i} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: hexColors[i % hexColors.length] }}></div>
            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{option.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Data table visualization
const PollDataTable = ({ poll }) => {
  if (!poll || !poll.options) return null;
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Option
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Votes
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {poll.options.map((option, idx) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  {option.text}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  {option.votes}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  <div className="flex items-center">
                    <span className="mr-2">{percentage.toFixed(1)}%</span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-mpesa-green h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="row" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total
            </th>
            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
              {totalVotes}
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
              100%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// Results card component
const ResultCard = ({ poll }) => {
  const [chartType, setChartType] = useState('bar');
  const [historyData, setHistoryData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const socketRef = useRef(null);
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  // Fetch historical data for the poll
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await getPollHistory(poll._id, '7d');
        if (response.success && response.data) {
          setHistoryData(response.data);
        }
      } catch (err) {
        console.error('Error fetching poll history:', err);
        // Set empty array to avoid loading state persisting
        setHistoryData([]);
      }
    };

    if (chartType === 'line' && !historyData) {
      fetchHistoryData();
    }
  }, [poll._id, chartType, historyData]);

  // Set up real-time updates for this poll
  useEffect(() => {
    // Only connect to socket if needed for this poll
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    if (chartType !== 'table' && !socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit('join-poll', poll._id);
      
      socketRef.current.on('poll-vote', (updatedPoll) => {
        if (updatedPoll._id === poll._id) {
          setRealTimeData(updatedPoll);
        }
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-poll', poll._id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [poll._id, chartType]);

  // Use real-time data if available, otherwise use the original poll data
  const displayPoll = realTimeData || poll;

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-5 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold truncate">{displayPoll.title}</h3>
        <div className="flex space-x-2">
          <button
            className={`p-1.5 rounded-md transition ${chartType === 'bar' ? 'bg-mpesa-green/10 text-mpesa-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setChartType('bar')}
            title="Bar Chart"
          >
            <FaChartBar size={16} />
          </button>
          <button
            className={`p-1.5 rounded-md transition ${chartType === 'pie' ? 'bg-mpesa-green/10 text-mpesa-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setChartType('pie')}
            title="Pie Chart"
          >
            <FaChartPie size={16} />
          </button>
          <button
            className={`p-1.5 rounded-md transition ${chartType === 'donut' ? 'bg-mpesa-green/10 text-mpesa-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setChartType('donut')}
            title="Donut Chart"
          >
            <FaDotCircle size={16} />
          </button>
          <button
            className={`p-1.5 rounded-md transition ${chartType === 'line' ? 'bg-mpesa-green/10 text-mpesa-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setChartType('line')}
            title="Line Chart (Trends)"
          >
            <FaChartLine size={16} />
          </button>
          <button
            className={`p-1.5 rounded-md transition ${chartType === 'table' ? 'bg-mpesa-green/10 text-mpesa-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setChartType('table')}
            title="Data Table"
          >
            <FaTable size={16} />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Total votes: {displayPoll.options.reduce((sum, option) => sum + option.votes, 0)}
          {realTimeData && <span className="ml-2 inline-block animate-pulse text-mpesa-green">• Live</span>}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Created: {new Date(displayPoll.createdAt).toLocaleDateString()}
        </div>
      </div>
      
      <div className="mt-4">
        {chartType === 'bar' && <PollBarChart poll={displayPoll} />}
        {chartType === 'pie' && <PollPieChart poll={displayPoll} />}
        {chartType === 'donut' && <PollDonutChart poll={displayPoll} />}
        {chartType === 'line' && <PollLineChart poll={displayPoll} historyData={historyData} />}
        {chartType === 'table' && <PollDataTable poll={displayPoll} />}
      </div>
    </div>
  );
};

// Main Results Page component
const ResultsPage = () => {
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('votes'); // votes, createdAt, popularity
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const socketRef = useRef(null);
  
  // Fetch user polls with real-time updates
  const {
    data: pollsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-polls', filter, sortBy, sortOrder],
    queryFn: () => getUserPolls(),
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
  
  // Set up global socket connection for real-time updates
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    if (autoRefresh && !socketRef.current && pollsData?.data) {
      socketRef.current = io(SOCKET_URL);
      
      // Join rooms for all polls to get updates
      pollsData.data.forEach(poll => {
        socketRef.current.emit('join-poll', poll._id);
      });
      
      // Listen for poll updates
      socketRef.current.on('poll-update', () => {
        refetch();
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoRefresh, pollsData, refetch]);

  // Sort and filter polls
  const sortAndFilterPolls = (polls) => {
    if (!polls) return [];

    let filteredPolls = [...polls];
    
    // Apply filter
    if (filter === 'active') {
      filteredPolls = filteredPolls.filter(poll => !poll.ended);
    } else if (filter === 'completed') {
      filteredPolls = filteredPolls.filter(poll => poll.ended);
    }
    
    // Apply sorting
    filteredPolls.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'votes':
          valueA = a.options.reduce((sum, option) => sum + option.votes, 0);
          valueB = b.options.reduce((sum, option) => sum + option.votes, 0);
          break;
        case 'popularity':
          valueA = a.viewCount || 0;
          valueB = b.viewCount || 0;
          break;
        case 'createdAt':
        default:
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    return filteredPolls;
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter('all');
    setSortBy('votes');
    setSortOrder('desc');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Poll Results</h1>
        
        {/* Live updates toggle */}
        <div className="mt-3 md:mt-0 flex items-center">
          <label htmlFor="auto-refresh" className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                id="auto-refresh" 
                className="sr-only" 
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <div className={`block w-10 h-6 rounded-full ${autoRefresh ? 'bg-mpesa-green' : 'bg-gray-300 dark:bg-gray-600'} transition`}></div>
              <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition ${autoRefresh ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {autoRefresh ? 'Live Updates On' : 'Live Updates Off'}
              {autoRefresh && <span className="ml-1 inline-block animate-pulse text-mpesa-green">•</span>}
            </div>
          </label>
        </div>
      </div>
      
      {/* Filter and sort controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            <span>Filter & Sort</span>
          </button>
          
          <div className="flex flex-1 justify-end space-x-2">
            <button
              className={`px-4 py-2 rounded-md transition duration-150 ${filter === 'all' ? 'bg-mpesa-green/10 text-mpesa-green border border-mpesa-green/30' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-md transition duration-150 ${filter === 'active' ? 'bg-mpesa-green/10 text-mpesa-green border border-mpesa-green/30' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 rounded-md transition duration-150 ${filter === 'completed' ? 'bg-mpesa-green/10 text-mpesa-green border border-mpesa-green/30' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sort & Filter</h2>
            <button
              onClick={clearFilters}
              className="text-mpesa-green hover:text-mpesa-dark transition duration-150"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort By</label>
              <div className="flex">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-gray-100 rounded-l-md focus:outline-none focus:ring-1 focus:ring-mpesa-green"
                >
                  <option value="votes">Most Votes</option>
                  <option value="popularity">Popularity</option>
                  <option value="createdAt">Date Created</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md bg-white dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                >
                  {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                </button>
              </div>
            </div>
            
            {/* Display Options */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Display Options</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex-1 px-3 py-2 rounded-md border ${
                    autoRefresh 
                      ? 'border-mpesa-green/30 bg-mpesa-green/10 text-mpesa-green' 
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } transition duration-150`}
                >
                  {autoRefresh ? 'Live Updates On' : 'Live Updates Off'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Results Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>Error loading results. Please try again later.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {pollsData?.data && pollsData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortAndFilterPolls(pollsData.data).map((poll) => (
                <ResultCard key={poll._id} poll={poll} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-lg shadow">
              <FaChartBar className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-xl font-semibold">No polls found</p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {filter !== 'all' 
                  ? `No ${filter} polls available. Try changing your filter.` 
                  : "You haven't created any polls yet."}
              </p>
              <button
                onClick={() => window.location.href = '/create'}
                className="mt-4 px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark"
              >
                Create a Poll
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsPage;
