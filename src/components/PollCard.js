import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaClock, FaUser, FaVoteYea, FaEllipsisV, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { deletePoll } from '../services/poll.service';
import DeletePollModal from './DeletePollModal';

const PollCard = ({ poll, refetch }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle poll deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deletePoll(poll._id);
      if (response.success) {
        if (refetch) {
          refetch();
        }
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle edit poll
  const handleEdit = () => {
    navigate(`/polls/${poll._id}/edit`);
    setShowMenu(false);
  };
  
  // Format the date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Calculate time remaining if the poll has an expiry date
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

  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Card header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {poll.privacy !== 'public' && (
              <FaLock className="text-amber-500 mr-2" size={14} />
            )}
            <h3 className="font-medium text-lg text-gray-900 dark:text-white line-clamp-1">
              {poll.title}
            </h3>
            {poll.isEdited && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                Edited
              </span>
            )}
          </div>
          
          {/* Three dots menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FaEllipsisV size={14} />
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-36 z-10">
                <button 
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <FaPencilAlt size={12} className="mr-2" />
                  Edit Poll
                </button>
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                >
                  <FaTrashAlt size={12} className="mr-2" />
                  Delete Poll
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <FaUser className="mr-1" size={12} />
          <span className="mr-3">{poll.creator?.name || 'Anonymous'}</span>
          
          {poll.expiresAt && (
            <>
              <FaClock className="mr-1" size={12} />
              <span>{getTimeRemaining(poll.expiresAt)}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Card body */}
      <div className="p-4">
        {poll.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {poll.description}
          </p>
        )}
        
        <div className="mb-4">
          {poll.options.slice(0, 3).map((option, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{option.text}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-mpesa-green h-2 rounded-full" 
                  style={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
          
          {poll.options.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              +{poll.options.length - 3} more options
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          {poll.isEdited && poll.updatedAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Last edited: {formatDate(poll.updatedAt)}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FaVoteYea className="mr-1" />
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
            </div>
            
            <Link 
              to={`/polls/${poll._id}`}
              className="px-4 py-2 bg-mpesa-green text-white text-sm rounded-md hover:bg-mpesa-dark transition-colors"
            >
              Vote Now
            </Link>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeletePollModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        pollTitle={poll.title}
      />
    </motion.div>
  );
};

export default PollCard;
