import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Import routes
import PrivateRoute from './routes/PrivateRoute';

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GuestLogin = lazy(() => import('./pages/GuestLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatePoll = lazy(() => import('./pages/CreatePoll'));
const PollDetail = lazy(() => import('./pages/PollDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const EmbeddedPage = lazy(() => import('./pages/EmbeddedPage'));
const EmbedPoll = lazy(() => import('./pages/EmbedPoll'));
// Add more lazy-loaded pages here

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mpesa-green"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/guest-login" element={<GuestLogin />} />
              <Route path="/discover" element={<MainLayout><DiscoverPage /></MainLayout>} />
              <Route path="/embed/:id" element={<EmbedPoll />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<CreatePoll />} />
                <Route path="/my-polls" element={<div>My Polls Page</div>} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/embedded" element={<EmbeddedPage />} />
                <Route path="/profile" element={<div>Profile Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
                <Route path="/polls/:id" element={<PollDetail />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              
              {/* Fallback for undefined routes */}
              <Route path="*" element={
                <MainLayout>
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-lg mb-8">The page you're looking for doesn't exist.</p>
                    <a 
                      href="/"
                      className="px-4 py-2 bg-mpesa-green text-white rounded hover:bg-mpesa-dark transition-colors"
                    >
                      Go Home
                    </a>
                  </div>
                </MainLayout>
              } />
            </Routes>
          </Suspense>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
