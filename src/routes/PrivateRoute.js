import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mpesa-green"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, otherwise wrap the route in MainLayout
  return isAuthenticated ? (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ) : <Navigate to="/login" />;
};

export default PrivateRoute;
