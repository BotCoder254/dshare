import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

// Animation variants
const alertVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
};

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  // Alert configurations based on type
  const configs = {
    success: {
      icon: <FaCheckCircle size={20} />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-400 dark:border-green-500',
      iconColor: 'text-green-500'
    },
    error: {
      icon: <FaExclamationCircle size={20} />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-400 dark:border-red-500',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: <FaExclamationTriangle size={20} />,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-400 dark:border-yellow-500',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: <FaInfoCircle size={20} />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-400 dark:border-blue-500',
      iconColor: 'text-blue-500'
    }
  };

  const { icon, bgColor, textColor, borderColor, iconColor } = configs[type] || configs.info;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={alertVariants}
      transition={{ duration: 0.3 }}
      className={`rounded-md border-l-4 p-4 mb-4 ${bgColor} ${borderColor} ${className}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 mr-3 ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-medium mb-1 ${textColor}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${textColor}`}>
            {message}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${textColor} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type}-50 focus:ring-${type}-500`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Alert;
