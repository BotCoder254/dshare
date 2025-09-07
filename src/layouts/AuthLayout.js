import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout for authentication pages with split design
const AuthLayout = ({ children, imageUrl, imageSide = 'left' }) => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Default image if none provided
  const defaultImage = 'https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?q=80&w=2070&auto=format&fit=crop';
  const finalImageUrl = imageUrl || defaultImage;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Image Section */}
      <div 
        className={`hidden md:block md:w-1/2 bg-cover bg-center ${imageSide === 'right' ? 'order-2' : 'order-1'}`}
        style={{ backgroundImage: `url(${finalImageUrl})` }}
      >
        <div className="h-full w-full bg-mpesa-green bg-opacity-20 flex items-center justify-center">
          <div className="text-white text-center p-8 max-w-md">
            <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Make decisions together.
            </h1>
            <p className="text-xl drop-shadow-lg">
              Create polls, run fair votes, share results — open source.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className={`w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white dark:bg-dark-bg-primary ${imageSide === 'right' ? 'order-1' : 'order-2'}`}>
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
