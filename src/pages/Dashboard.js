import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaPlus, FaFilter, FaChartBar, FaFire, FaSort, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getPolls } from '../services/poll.service';
import PollCard from '../components/PollCard';

const Dashboard = () => {
  const [sortBy, setSortBy] = useState('newest');
  const [filter, setFilter] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#filter-button') && !event.target.closest('#filter-dropdown')) {
        setFilterDropdownOpen(false);
      }
      
      if (!event.target.closest('#sort-button') && !event.target.closest('#sort-dropdown')) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const {
    data: pollsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['polls', sortBy, filter],
    queryFn: () => getPolls(1, 12, filter === 'expired'),
    refetchInterval: 60000 // Refetch every minute for real-time updates
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mpesa-green"></div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 text-center mb-4">
            Error loading polls: {error.message || 'Something went wrong'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!pollsData?.data?.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FaChartBar size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No active polls found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Be the first to create a poll and start collecting votes!
          </p>
          <Link 
            to="/create" 
            className="px-6 py-3 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Create New Poll
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pollsData.data.map(poll => (
          <PollCard key={poll._id} poll={poll} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Poll Feed</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and vote on active polls from the community
          </p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-4">
          <div className="relative">
            <button 
              id="filter-button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            >
              <FaFilter className="mr-2" />
              {filter === 'all' ? 'All Polls' : filter === 'active' ? 'Active Polls' : 'Expired Polls'}
            </button>
            
            {/* Filter dropdown */}
            <div 
              id="filter-dropdown" 
              className={`${filterDropdownOpen ? 'block' : 'hidden'} absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg py-1 z-10`}
            >
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${filter === 'all' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setFilter('all');
                  setFilterDropdownOpen(false);
                }}
              >
                All Polls
              </button>
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${filter === 'active' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setFilter('active');
                  setFilterDropdownOpen(false);
                }}
              >
                Active Polls
              </button>
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${filter === 'expired' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setFilter('expired');
                  setFilterDropdownOpen(false);
                }}
              >
                Expired Polls
              </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              id="sort-button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <FaSort className="mr-2" />
              {sortBy === 'newest' ? 'Newest' : sortBy === 'popular' ? 'Popular' : 'Ending Soon'}
            </button>
            
            {/* Sort dropdown */}
            <div 
              id="sort-dropdown" 
              className={`${sortDropdownOpen ? 'block' : 'hidden'} absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg py-1 z-10`}
            >
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'newest' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setSortBy('newest');
                  setSortDropdownOpen(false);
                }}
              >
                Newest First
              </button>
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'popular' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setSortBy('popular');
                  setSortDropdownOpen(false);
                }}
              >
                Most Popular
              </button>
              <button 
                className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'ending' ? 'text-mpesa-green' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={() => {
                  setSortBy('ending');
                  setSortDropdownOpen(false);
                }}
              >
                Ending Soon
              </button>
            </div>
          </div>
          
          <Link 
            to="/create" 
            className="px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Poll
          </Link>
        </div>
      </div>
      
      {/* Poll category tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          <button className="border-b-2 border-mpesa-green text-mpesa-green py-4 px-1 font-medium text-sm flex items-center">
            <FaFire className="mr-2" />
            Trending
          </button>
          <button className="border-b-2 border-transparent hover:text-mpesa-green py-4 px-1 font-medium text-sm flex items-center">
            <FaClock className="mr-2" />
            Latest
          </button>
          <button className="border-b-2 border-transparent hover:text-mpesa-green py-4 px-1 font-medium text-sm">
            Politics
          </button>
          <button className="border-b-2 border-transparent hover:text-mpesa-green py-4 px-1 font-medium text-sm">
            Entertainment
          </button>
          <button className="border-b-2 border-transparent hover:text-mpesa-green py-4 px-1 font-medium text-sm">
            Sports
          </button>
          <button className="border-b-2 border-transparent hover:text-mpesa-green py-4 px-1 font-medium text-sm">
            Technology
          </button>
        </nav>
      </div>

      {/* Feature section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-mpesa-green/10 dark:bg-mpesa-green/20 rounded-lg p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to DShare
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Create polls, run fair votes, share results — all open source and easy to use.
            </p>
          </div>
          <Link
            to="/create"
            className="px-6 py-3 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark transition-colors whitespace-nowrap"
          >
            Create Free Poll
          </Link>
        </div>
      </motion.div>

      {/* Polls grid */}
      {renderContent()}

      {/* Pagination */}
      {pollsData?.data?.length > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button 
              className="px-3 py-1 border rounded-md border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Previous
            </button>
            <button 
              className="px-3 py-1 bg-mpesa-green/20 border border-mpesa-green rounded-md text-mpesa-green"
            >
              1
            </button>
            <button 
              className="px-3 py-1 border rounded-md border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
