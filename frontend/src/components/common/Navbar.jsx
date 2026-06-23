import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Train, Bell, Menu, X, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../utils/api';

const Navbar = () => {
  const { user } = useAuth();
  const { isSignedIn } = useUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      if (!user) return; // Don't fetch if user not authenticated
      console.log('Fetching unread count for user:', user);
      const response = await notificationAPI.getUnreadCount();
      console.log('Unread count response:', response);
      setUnreadCount(response.data?.count || response.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      console.error('Error details:', error.response?.data);
      // Silently fail if unauthorized
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await notificationAPI.getAll({ limit: 5 });
      setNotifications(response.data?.notifications || response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchRecentNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      fetchUnreadCount();
      fetchRecentNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'staff':
        return '/staff';
      case 'passenger':
      default:
        return '/dashboard';
    }
  };

  const navLinks = isSignedIn
    ? [
        { name: 'Dashboard', path: getDashboardPath() },
        { name: 'Complaints', path: user?.role === 'passenger' ? '/my-complaints' : '/complaints' },
        ...(user?.role === 'admin' ? [{ name: 'Trains', path: '/trains' }] : []),
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-lg'
          : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/30"
              >
                <Train className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold">
                <span className="text-gray-900 dark:text-white">Rail</span>
                <span className="gradient-text">Mate</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Link
                  to={link.path}
                  className="relative group"
                >
                  <span
                    className={`${
                      isActive(link.path)
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    } transition-colors`}
                  >
                    {link.name}
                  </span>
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5 text-yellow-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5 text-gray-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {isSignedIn && (
              <>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNotificationClick}
                    className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </motion.button>

                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        <button
                          onClick={() => {
                            navigate('/notifications');
                            setShowNotifications(false);
                          }}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => {
                              if (!notification.readStatus) handleMarkAsRead(notification._id);
                              if (notification.complaintId) {
                                const complaintId = typeof notification.complaintId === 'object' 
                                  ? notification.complaintId._id 
                                  : notification.complaintId;
                                navigate(`/complaints/${complaintId}`);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                              !notification.readStatus ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.type === 'complaint_submitted' && 'Complaint Submitted'}
                              {notification.type === 'status_updated' && 'Status Updated'}
                              {notification.type === 'complaint_assigned' && 'New Assignment'}
                              {notification.type === 'remark_added' && 'New Remark'}
                              {notification.type === 'complaint_resolved' && 'Complaint Resolved'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-10 h-10 ring-2 ring-primary-500/20',
                      },
                    }}
                  />

                  {user && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-right"
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {!isSignedIn && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4"
              >
                <Link
                  to="/sign-in"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/sign-up" className="btn btn-primary text-sm">
                  Sign Up
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <motion.div
                  key={link.path}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${
                      isActive(link.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } block px-4 py-3 rounded-xl text-base transition-colors`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {isSignedIn && (
                <motion.div whileHover={{ x: 4 }}>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 block px-4 py-3 rounded-xl text-base transition-colors"
                  >
                    Notifications
                  </Link>
                </motion.div>
              )}

              {!isSignedIn && (
                <>
                  <motion.div whileHover={{ x: 4 }}>
                    <Link
                      to="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 block px-4 py-3 rounded-xl text-base transition-colors"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <Link
                      to="/sign-up"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary block text-center mt-2"
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
