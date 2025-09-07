import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy, FaCode, FaGlobe, FaChartBar, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { getUserPolls } from '../services/poll.service';
import { getEmbedStats, generateEmbedToken } from '../services/embed.service';
import LoadingSpinner from '../components/LoadingSpinner';

// Code snippet component for embedding
const EmbedCodeSnippet = ({ poll }) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState('iframe'); // iframe or script

  // Generate iframe embed code
  const iframeCode = `<iframe 
  src="${window.location.origin}/embed/${poll._id}" 
  width="100%" 
  height="400" 
  frameborder="0" 
  scrolling="no"
  title="${poll.title}"
  allow="clipboard-write"
></iframe>`;

  // Generate script embed code (more advanced)
  const scriptCode = `<div id="dshare-poll-${poll._id}"></div>
<script async src="${window.location.origin}/embed.js" 
  data-poll-id="${poll._id}"
  data-theme="auto"
  data-width="100%"
  data-height="auto"
></script>`;

  const embedCode = embedType === 'iframe' ? iframeCode : scriptCode;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="mt-4 bg-gray-50 dark:bg-dark-bg-primary rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button
            onClick={() => setEmbedType('iframe')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              embedType === 'iframe' 
                ? 'bg-mpesa-green/10 text-mpesa-green border border-mpesa-green/30' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            IFrame Embed
          </button>
          <button
            onClick={() => setEmbedType('script')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              embedType === 'script' 
                ? 'bg-mpesa-green/10 text-mpesa-green border border-mpesa-green/30' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Script Embed
          </button>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition text-sm"
        >
          {copied ? 'Copied!' : 'Copy Code'} <FaCopy size={14} />
        </button>
      </div>

      <div className="p-4">
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
          {embedCode}
        </pre>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-500 dark:text-gray-400">
        <p>Paste this code into your website or blog to display this poll.</p>
      </div>
    </div>
  );
};

// Preview component
const EmbedPreview = ({ poll }) => {
  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-dark-bg-primary px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium">Preview</h3>
        <span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-md">
          {window.location.origin}/embed/{poll._id}
        </span>
      </div>
      <div className="p-4 bg-white dark:bg-dark-bg-secondary">
        <iframe 
          src={`/embed/${poll._id}`} 
          title={`Preview of ${poll.title}`}
          className="w-full border-0 h-[400px]"
        />
      </div>
    </div>
  );
};

// Poll card component 
const EmbeddablePollCard = ({ poll }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [embedToken, setEmbedToken] = useState(poll.embedToken);
  
  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  
  // Generate new embed token for private polls
  const handleGenerateToken = async () => {
    if (isGeneratingToken) return;
    
    try {
      setIsGeneratingToken(true);
      const response = await generateEmbedToken(poll._id);
      if (response.success) {
        setEmbedToken(response.data.embedToken);
      }
    } catch (err) {
      console.error('Error generating embed token:', err);
    } finally {
      setIsGeneratingToken(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg mb-6">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{poll.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span>Created: {new Date(poll.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{totalVotes} votes</span>
            </div>
            {poll.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-3">{poll.description}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/poll/${poll._id}`, '_blank')}
              className="flex items-center gap-1 p-2 text-gray-500 hover:text-mpesa-green hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
              title="View Poll"
            >
              <FaEye size={16} />
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 p-2 rounded-md ${
                showPreview 
                  ? 'text-mpesa-green bg-mpesa-green/10'
                  : 'text-gray-500 hover:text-mpesa-green hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Preview Embedded Poll"
            >
              <FaGlobe size={16} />
            </button>
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className={`flex items-center gap-1 p-2 rounded-md ${
                showEmbed 
                  ? 'text-mpesa-green bg-mpesa-green/10'
                  : 'text-gray-500 hover:text-mpesa-green hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Get Embed Code"
            >
              <FaCode size={16} />
            </button>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-dark-bg-primary rounded-md p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Votes</div>
            <div className="text-xl font-semibold">{totalVotes}</div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-bg-primary rounded-md p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
            <div className="text-xl font-semibold">{poll.viewCount || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-bg-primary rounded-md p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
            <div className="text-xl font-semibold">
              {poll.ended ? (
                <span className="text-red-500">Closed</span>
              ) : (
                <span className="text-green-500">Active</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Embed code section */}
      <AnimatePresence>
        {showEmbed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-5">
              <EmbedCodeSnippet poll={poll} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Preview section */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-5">
              <EmbedPreview poll={poll} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Embedded Page component
const EmbeddedPage = () => {
  const [filter, setFilter] = useState('all'); // all, active, closed
  const [sortBy, setSortBy] = useState('createdAt'); // votes, createdAt, embedCount
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch user polls
  const {
    data: pollsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-polls', filter, sortBy, sortOrder],
    queryFn: () => getUserPolls(),
  });
  
  // Sort and filter polls
  const sortAndFilterPolls = (polls) => {
    if (!polls) return [];

    let filteredPolls = [...polls];
    
    // Apply filter
    if (filter === 'active') {
      filteredPolls = filteredPolls.filter(poll => !poll.ended);
    } else if (filter === 'closed') {
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
        case 'embedCount':
          valueA = a.embedCount || 0;
          valueB = b.embedCount || 0;
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
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Embeddable Polls</h1>
        
        <div className="mt-3 md:mt-0 flex items-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <FaFilter size={14} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      <AnimatePresence>
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
                className="text-mpesa-green hover:text-mpesa-dark transition"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter Options */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-mpesa-green"
                >
                  <option value="all">All Polls</option>
                  <option value="active">Active Polls</option>
                  <option value="closed">Closed Polls</option>
                </select>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort By</label>
                <div className="flex">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-gray-100 rounded-l-md focus:outline-none focus:ring-1 focus:ring-mpesa-green"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="votes">Most Votes</option>
                    <option value="embedCount">Most Embeds</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md bg-white dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                  </button>
                </div>
              </div>
              
              {/* Other potential filters would go here */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-blue-800 dark:text-blue-300">
        <h3 className="font-semibold flex items-center gap-2">
          <FaInfoCircle /> Embed Your Polls
        </h3>
        <p className="mt-1">
          Share your polls on any website or blog. Click the <FaCode className="inline" /> icon on any poll to get the embed code.
        </p>
      </div>
      
      {/* Polls List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-300">
          <p>Error loading your polls. Please try again later.</p>
        </div>
      ) : (
        <>
          {pollsData?.data && pollsData.data.length > 0 ? (
            <div>
              {sortAndFilterPolls(pollsData.data).map(poll => (
                <EmbeddablePollCard key={poll._id} poll={poll} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No Polls Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any polls that can be embedded yet.
              </p>
              <a
                href="/create"
                className="px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition"
              >
                Create Your First Poll
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmbeddedPage;
