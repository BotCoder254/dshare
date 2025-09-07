import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSun, FaMoon, FaBars, FaTimes, FaUserCircle, FaPoll, FaSignOutAlt, FaGithub, 
  FaHome, FaPlus, FaList, FaChartBar, FaUser, FaCog, FaChevronLeft, FaChevronRight, 
  FaThLarge, FaHistory, FaTrophy, FaInfoCircle, FaQuestionCircle, FaBell, FaSearch, FaCode } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { logout } from '../services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { getUserPolls } from '../services/poll.service';
import NotificationBell from '../components/NotificationBell';

const MainLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for saved theme preference on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
    
    // Check for saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu if clicking outside
      if (!event.target.closest('#user-menu-container')) {
        setUserMenuOpen(false);
      }
      
      // Close mobile sidebar when clicking outside
      if (mobileSidebarOpen && !event.target.closest('#mobile-sidebar') && !event.target.closest('#mobile-sidebar-toggle')) {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileSidebarOpen]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary transition-colors duration-200">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white dark:bg-dark-bg-secondary shadow-md">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <FaPoll className="text-mpesa-green h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-mpesa-green">DShare</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/polls" className="hover:text-mpesa-green transition duration-200">
                Polls
              </Link>
              <Link to="/about" className="hover:text-mpesa-green transition duration-200">
                About
              </Link>
              
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-primary transition duration-200"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>

              {/* User menu or Auth buttons */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* Notification Bell */}
                  <NotificationBell />
                  
                  {/* User Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()} id="user-menu-container">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-1 focus:outline-none"
                    >
                      <span>{user?.name}</span>
                      <FaUserCircle size={24} className="text-mpesa-green" />
                    </button>
                    
                    {/* User dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg py-1 z-50">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-primary"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-primary"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/notifications"
                          className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-primary"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <FaBell className="mr-2" />
                            Notifications
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-primary"
                        >
                          <div className="flex items-center">
                            <FaSignOutAlt className="mr-2" />
                            Logout
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md border border-mpesa-green text-mpesa-green hover:bg-mpesa-green hover:text-white transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-md bg-mpesa-green text-white hover:bg-mpesa-dark transition duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 focus:outline-none"
              >
                {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
          </nav>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/polls"
                className="block py-2 hover:text-mpesa-green transition duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Polls
              </Link>
              <Link
                to="/about"
                className="block py-2 hover:text-mpesa-green transition duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex items-center py-2 hover:text-mpesa-green transition duration-200"
              >
                {darkMode ? (
                  <>
                    <FaSun className="mr-2" /> Light Mode
                  </>
                ) : (
                  <>
                    <FaMoon className="mr-2" /> Dark Mode
                  </>
                )}
              </button>

              {/* Authentication links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block py-2 hover:text-mpesa-green transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/discover"
                    className="block py-2 hover:text-mpesa-green transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FaSearch className="mr-2" />
                      Discover
                    </div>
                  </Link>
                  <Link
                    to="/profile"
                    className="block py-2 hover:text-mpesa-green transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/notifications"
                    className="block py-2 hover:text-mpesa-green transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FaBell className="mr-2" />
                      Notifications
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block py-2 w-full text-left hover:text-mpesa-green transition duration-200"
                  >
                    <div className="flex items-center">
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 mt-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md border border-mpesa-green text-center text-mpesa-green hover:bg-mpesa-green hover:text-white transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-md text-center bg-mpesa-green text-white hover:bg-mpesa-dark transition duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-grow relative">
        {/* Sidebar overlay for mobile */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          <motion.aside
            key={sidebarCollapsed ? 'collapsed' : 'expanded'}
            initial={{ width: sidebarCollapsed ? 80 : 240, x: -240 }}
            animate={{ width: sidebarCollapsed ? 80 : 240, x: 0 }}
            exit={{ width: 0, x: -240 }}
            transition={{ duration: 0.3 }}
            className={`bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] sticky top-16 ${
              mobileSidebarOpen ? 'fixed z-30 md:relative' : 'hidden md:block'
            }`}
          >
            {/* Sidebar content */}
            <div className="flex flex-col h-full py-4">
              {/* Sidebar navigation */}
              <nav className="flex-grow px-2 overflow-y-auto">
                <ul className="space-y-1">
                  <li>
                    <Link 
                      to="/dashboard" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/dashboard' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaThLarge className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/discover" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/discover' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaSearch className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Discover</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/create" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/create' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaPlus className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Create Poll</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/my-polls" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/my-polls' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaList className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">My Polls</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/results" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/results' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaChartBar className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Results</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/embedded" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/embedded' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaCode className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Embed Polls</span>}
                    </Link>
                  </li>
                </ul>
                
                {!sidebarCollapsed && (
                  <div className="mt-8 px-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Account</p>
                  </div>
                )}
                
                <ul className="space-y-1">
                  <li>
                    <Link 
                      to="/profile" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/profile' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaUser className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Profile</span>}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/settings" 
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        location.pathname === '/settings' 
                          ? 'bg-mpesa-green/10 text-mpesa-green' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FaCog className="flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-3">Settings</span>}
                    </Link>
                  </li>
                </ul>
              </nav>
              
              {/* Sidebar toggle button */}
              <div className="px-2 mt-2">
                <button
                  onClick={() => {
                    setSidebarCollapsed(!sidebarCollapsed);
                    localStorage.setItem('sidebarCollapsed', !sidebarCollapsed);
                  }}
                  className="flex items-center justify-center w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                  {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
                </button>
              </div>
            </div>
          </motion.aside>
        </AnimatePresence>

        {/* Mobile sidebar toggle */}
        <button
          className="fixed bottom-4 right-4 md:hidden z-20 w-12 h-12 rounded-full bg-mpesa-green text-white shadow-lg flex items-center justify-center"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>

        {/* Main content area */}
        <main className="flex-grow px-4 py-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Right sidebar - Your Polls Results */}
        <UserPollsResults isAuthenticated={isAuthenticated} />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bg-secondary py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo and description */}
            <div>
              <div className="flex items-center">
                <FaPoll className="text-mpesa-green h-6 w-6" />
                <span className="ml-2 text-lg font-bold text-mpesa-green">DShare</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Create polls, run fair votes, share results — open source.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-base font-medium mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/polls" className="hover:text-mpesa-green transition duration-200">
                    Explore Polls
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="hover:text-mpesa-green transition duration-200">
                    Create Poll
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-mpesa-green transition duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-mpesa-green transition duration-200">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-base font-medium mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/dshare-project"
                    className="flex items-center hover:text-mpesa-green transition duration-200"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaGithub className="mr-2" /> GitHub
                  </a>
                </li>
                <li>
                  <Link to="/contribute" className="hover:text-mpesa-green transition duration-200">
                    Contribute
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="hover:text-mpesa-green transition duration-200">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">
            <p>© {new Date().getFullYear()} DShare. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Right sidebar component for showing user's polls results
const UserPollsResults = ({ isAuthenticated }) => {
  // Fetch user polls if authenticated
  const {
    data: userPollsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['userPolls'],
    queryFn: () => getUserPolls(1, 5),
    enabled: !!isAuthenticated, // Only fetch if user is authenticated
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (!isAuthenticated) {
    return null; // Don't show this panel for unauthenticated users
  }

  return (
    <aside className="hidden lg:block w-80 bg-white dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4">
        <h3 className="font-medium text-lg mb-4 flex items-center">
          <FaChartBar className="mr-2 text-mpesa-green" />
          Your Poll Results
        </h3>

        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpesa-green"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Failed to load your polls</p>
          </div>
        )}

        {!isLoading && !isError && userPollsData?.data?.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>You haven't created any polls yet</p>
            <Link to="/create" className="text-mpesa-green hover:underline mt-2 inline-block">
              Create your first poll
            </Link>
          </div>
        )}

        {!isLoading && !isError && userPollsData?.data?.length > 0 && (
          <div className="space-y-4">
            {userPollsData.data.map(poll => (
              <div key={poll._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 line-clamp-1">{poll.title}</h4>
                
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {poll.options.reduce((sum, option) => sum + option.votes, 0)} votes
                </div>
                
                {/* Show the top 3 options */}
                {poll.options.slice(0, 3).map(option => {
                  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={option._id} className="mb-1.5">
                      <div className="flex justify-between items-center text-xs mb-0.5">
                        <span className="truncate">{option.text}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-mpesa-green h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                
                <Link 
                  to={`/polls/${poll._id}`} 
                  className="text-xs text-mpesa-green hover:underline mt-2 inline-block"
                >
                  View full results
                </Link>
              </div>
            ))}
            
            <Link 
              to="/my-polls" 
              className="block text-center text-sm text-mpesa-green hover:underline mt-4"
            >
              View all your polls
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MainLayout;
