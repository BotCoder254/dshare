import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { searchPolls } from '../services/search.service';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [query]);
  
  // Get search suggestions
  const { data: suggestions, isFetching } = useQuery(
    ['search-suggestions', debouncedQuery],
    () => searchPolls(debouncedQuery, { limit: 5 }),
    {
      enabled: debouncedQuery.length >= 2 && isSearchOpen,
      staleTime: 30000, // 30 seconds
      keepPreviousData: true
    }
  );
  
  // Handle search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
    }
  };
  
  // Focus input when search is opened
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // Handle click outside
  const searchRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
        aria-label="Search"
      >
        <FaSearch />
      </button>
      
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '300px' }}
            exit={{ opacity: 0, width: 0 }}
            className="absolute right-0 top-full mt-2 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg z-10"
          >
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search polls..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-mpesa-green dark:bg-dark-bg-primary dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setQuery('')}
                >
                  <FaTimes />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mpesa-green"
              >
                <FaSearch />
              </button>
            </form>
            
            {/* Search suggestions */}
            {debouncedQuery.length >= 2 && (
              <div className="px-2 py-1 max-h-60 overflow-y-auto">
                {isFetching ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Searching...
                  </div>
                ) : suggestions?.data?.length > 0 ? (
                  <>
                    {suggestions.data.map(poll => (
                      <div
                        key={poll._id}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-primary cursor-pointer rounded-md"
                        onClick={() => {
                          navigate(`/poll/${poll.slug || poll._id}`);
                          setIsSearchOpen(false);
                        }}
                      >
                        <p className="font-medium text-sm">{poll.title}</p>
                        <p className="text-xs text-gray-500">
                          {poll.totalVotes} votes • {poll.options.length} options
                        </p>
                      </div>
                    ))}
                    <div
                      className="px-3 py-2 text-center text-sm text-mpesa-green hover:underline cursor-pointer"
                      onClick={handleSubmit}
                    >
                      See all results
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No polls found matching "{debouncedQuery}"
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
