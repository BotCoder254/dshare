import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaUndoAlt, FaSpinner, FaTimes } from 'react-icons/fa';
import { getPollVersions, rollbackVersion } from '../services/poll.service';

const VersionHistoryModal = ({ isOpen, onClose, pollId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [activeVersion, setActiveVersion] = useState(null);
  const [error, setError] = useState(null);
  
  // Format date in a readable format
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
  
  // Fetch version history when modal opens
  useEffect(() => {
    if (isOpen && pollId) {
      fetchVersions();
    }
  }, [isOpen, pollId]);
  
  // Fetch poll versions
  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPollVersions(pollId);
      if (response.success) {
        setVersions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch poll versions:', err);
      setError('Failed to load version history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle rollback to a previous version
  const handleRollback = async (versionIndex) => {
    try {
      setRollingBack(true);
      setError(null);
      const response = await rollbackVersion(pollId, versionIndex);
      if (response.success) {
        onClose();
        // Refresh the page to show the rolled back version
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to rollback version:', err);
      setError('Failed to rollback to this version. Please try again.');
    } finally {
      setRollingBack(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 w-full h-full"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-11/12 md:w-full mx-auto max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b dark:border-gray-700">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <FaHistory size={20} />
                <h2 className="text-xl font-semibold">Poll Version History</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-mpesa-green" size={24} />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Loading versions...</span>
                </div>
              ) : versions && versions.length > 0 ? (
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-md ${
                        activeVersion === index 
                          ? 'border-mpesa-green bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setActiveVersion(activeVersion === index ? null : index)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          <span className="text-gray-800 dark:text-gray-200">Version {versions.length - index}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            {formatDate(version.versionDate)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRollback(index);
                          }}
                          disabled={rollingBack}
                          className={`px-3 py-1 flex items-center gap-1 text-xs rounded-md ${
                            rollingBack 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-mpesa-green text-white hover:bg-mpesa-dark'
                          }`}
                        >
                          {rollingBack ? (
                            <>
                              <FaSpinner className="animate-spin" size={12} />
                              <span>Rolling back...</span>
                            </>
                          ) : (
                            <>
                              <FaUndoAlt size={12} />
                              <span>Restore</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {activeVersion === index && (
                        <div className="mt-3 pl-3 border-l-2 border-mpesa-green">
                          <div className="text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Title: </span>
                            <span className="text-gray-800 dark:text-gray-200">{version.title}</span>
                          </div>
                          
                          {version.description && (
                            <div className="text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">Description: </span>
                              <span className="text-gray-800 dark:text-gray-200">{version.description}</span>
                            </div>
                          )}
                          
                          <div className="text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Options: </span>
                            <ul className="list-disc pl-5 mt-1">
                              {version.options.map((option, idx) => (
                                <li key={idx} className="text-gray-800 dark:text-gray-200">{option.text}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mt-2">
                            <span>Privacy: <b>{version.privacy}</b></span>
                            <span>Results: <b>{version.showResults}</b></span>
                            <span>Guest voting: <b>{version.allowGuestVoting ? 'Allowed' : 'Not allowed'}</b></span>
                            {version.expiresAt && (
                              <span>Expires: <b>{formatDate(version.expiresAt)}</b></span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No version history available for this poll.
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4 pt-3 border-t dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VersionHistoryModal;
