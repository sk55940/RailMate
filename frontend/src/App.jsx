import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import Home from './pages/Home';
import About from './pages/About';
import PassengerDashboard from './pages/PassengerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintDetails from './pages/ComplaintDetails';
import SubmitComplaint from './pages/SubmitComplaint';
import NotificationsPage from './pages/NotificationsPage';
import TrainManagement from './pages/TrainManagement';

// Page Transition Wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <PageTransition>{children}</PageTransition>;
};

// Dashboard Router based on role
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'passenger':
    default:
      return <PassengerDashboard />;
  }
};

function AppContent() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            
            <Route
              path="/about"
              element={
                <PageTransition>
                  <About />
                </PageTransition>
              }
            />
            
            {/* Auth Routes */}
            <Route
              path="/sign-in/*"
              element={
                <PageTransition>
                  <div className="flex justify-center items-center min-h-[80vh]">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignIn routing="path" path="/sign-in" />
                    </motion.div>
                  </div>
                </PageTransition>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <PageTransition>
                  <div className="flex justify-center items-center min-h-[80vh]">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignUp routing="path" path="/sign-up" />
                    </motion.div>
                  </div>
                </PageTransition>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <ComplaintsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-complaints"
              element={
                <ProtectedRoute allowedRoles={['passenger']}>
                  <ComplaintsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complaints/new"
              element={
                <ProtectedRoute>
                  <SubmitComplaint />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute>
                  <ComplaintDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trains"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TrainManagement />
                </ProtectedRoute>
              }
            />

            {/* Catch all - 404 */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
                      <motion.a
                        href="/"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary"
                      >
                        Go Home
                      </motion.a>
                    </motion.div>
                  </div>
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
