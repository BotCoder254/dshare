import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { searchPolls } from '../services/search.service';
import PollCard from '../components/PollCard';
import LoadingSpinner from '../components/LoadingSpinner';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'votes', label: 'Most Votes' },
  { value: 'shares', label: 'Most Shared' }
];

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract search params
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedTags, setSelectedTags] = useState(tags);
  const [selectedSortBy, setSelectedSortBy] = useState(sortBy);
  const [selectedSortOrder, setSelectedSortOrder] = useState(sortOrder);
  
  // Search query
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['polls', query, category, tags, sortBy, sortOrder, page],
    queryFn: () => searchPolls(query, {
      category,
      tags,
      sortBy,
      sortOrder,
      page,
      limit: 12
    }),
    keepPreviousData: true,
    staleTime: 30000 // 30 seconds
  });
  
  // Removed unused updateSearchParams function that was causing update cycles
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL and trigger search
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    params.delete('page'); // Reset to first page
    setSearchParams(params);
  };
  
  // Handle filter changes
  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    
    switch (type) {
      case 'category':
        setSelectedCategory(value);
        if (value) {
          params.set('category', value);
        } else {
          params.delete('category');
        }
        break;
        
      case 'tags':
        setSelectedTags(value);
        if (value.length) {
          params.set('tags', value.join(','));
        } else {
          params.delete('tags');
        }
        break;
        
      case 'sortBy':
        setSelectedSortBy(value);
        if (value !== 'createdAt') {
          params.set('sortBy', value);
        } else {
          params.delete('sortBy');
        }
        break;
        
      case 'sortOrder':
        setSelectedSortOrder(value);
        if (value !== 'desc') {
          params.set('sortOrder', value);
        } else {
          params.delete('sortOrder');
        }
        break;
        
      default:
        break;
    }
    
    params.delete('page'); // Reset to first page
    setSearchParams(params);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    setSearchParams(params);
  };
  
  // Handle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      handleFilterChange('tags', selectedTags.filter(t => t !== tag));
    } else {
      handleFilterChange('tags', [...selectedTags, tag]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
    setSelectedSortBy('createdAt');
    setSelectedSortOrder('desc');
    
    // Clear URL params except query
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
  };
  
  // View poll details
  const viewPoll = (pollId) => {
    navigate(`/poll/${pollId}`);
  };
  
  // Update search query when URL changes
  useEffect(() => {
    // Only update state if the values are different from the URL params
    // This prevents unnecessary state updates that could cause infinite loops
    if (searchQuery !== query) {
      setSearchQuery(query);
    }
    if (selectedCategory !== category) {
      setSelectedCategory(category);
    }
    if (JSON.stringify(selectedTags) !== JSON.stringify(tags)) {
      setSelectedTags(tags);
    }
    if (selectedSortBy !== sortBy) {
      setSelectedSortBy(sortBy);
    }
    if (selectedSortOrder !== sortOrder) {
      setSelectedSortOrder(sortOrder);
    }
  }, [query, category, tags, sortBy, sortOrder, searchQuery, selectedCategory, selectedTags, selectedSortBy, selectedSortOrder]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Polls</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search polls..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary rounded-l-md focus:outline-none focus:ring-2 focus:ring-mpesa-green focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => {
                  setSearchQuery('');
                  const params = new URLSearchParams(searchParams);
                  params.delete('q');
                  setSearchParams(params);
                }}
              >
                <FaTimes className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-mpesa-green text-white px-4 py-2 rounded-r-md hover:bg-mpesa-dark focus:outline-none"
          >
            Search
          </button>
          <button
            type="button"
            className="ml-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary rounded-md flex items-center hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </form>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg mb-6"
        >
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-mpesa-green hover:text-mpesa-dark"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {data?.filters?.categories?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex">
                <select
                  value={selectedSortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-l-md"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', selectedSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 border-l-0 rounded-r-md"
                >
                  {selectedSortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Popular Tags */}
          {data?.filters?.popularTags && data.filters.popularTags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Popular Tags</label>
              <div className="flex flex-wrap gap-2">
                {data.filters.popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-mpesa-green text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Results Status */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>Error loading polls. Please try again later.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-mpesa-green text-white rounded-md hover:bg-mpesa-dark"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Result Stats */}
          <div className="mb-4 text-gray-600">
            {data?.count > 0 ? (
              <p>
                Showing {data.count} {data.count === 1 ? 'result' : 'results'}
                {query && ` for "${query}"`}
                {selectedCategory && ` in ${selectedCategory}`}
                {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
              </p>
            ) : (
              <p>No polls found matching your criteria.</p>
            )}
          </div>
          
          {/* Poll Grid */}
          {data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((poll) => (
                <PollCard key={poll._id} poll={poll} onClick={() => viewPoll(poll.slug || poll._id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl">No polls found.</p>
              <p className="mt-2 text-gray-600">Try adjusting your search or filters.</p>
            </div>
          )}
          
          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-l-md border ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-mpesa-green hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                {[...Array(data.pagination.pages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`px-3 py-1 border-t border-b ${
                      idx + 1 === page
                        ? 'bg-mpesa-green text-white'
                        : 'bg-white text-mpesa-green hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.pages}
                  className={`px-3 py-1 rounded-r-md border ${
                    page === data.pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-mpesa-green hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverPage;
