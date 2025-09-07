import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'mpesa-green' }) => {
  let sizeClass;
  switch (size) {
    case 'sm':
      sizeClass = 'h-4 w-4';
      break;
    case 'lg':
      sizeClass = 'h-12 w-12';
      break;
    case 'xl':
      sizeClass = 'h-16 w-16';
      break;
    case 'md':
    default:
      sizeClass = 'h-8 w-8';
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClass} animate-spin rounded-full border-b-2 border-${color}`}></div>
    </div>
  );
};

export default LoadingSpinner;
