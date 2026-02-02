import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { complaintAPI, userAPI } from '../utils/api';
import { FileText, Clock, CheckCircle, ClipboardList, Briefcase, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../components/common/Loader';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { getRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import Chatbot from '../components/common/Chatbot';
import SpecializationModal from '../components/common/SpecializationModal';

const StaffDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkFirstTimeSetup();
  }, []);

  const checkFirstTimeSetup = () => {
    // Show modal if staff hasn't set specialization yet
    if (!user?.specialization || !user?.expertise || user?.expertise?.length === 0) {
      setIsFirstTime(true);
      setShowSpecializationModal(true);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await userAPI.getStats();
      setStats(statsResponse.data);

      // Fetch assigned complaints (staff role gets only their assigned complaints)
      const complaintsResponse = await complaintAPI.getAll({ 
        assignedToMe: true, 
        limit: 5,
        sort: '-updatedAt' 
      });
      setAssignments(complaintsResponse.data.complaints || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const statCards = [
    {
      title: 'Assigned Complaints',
      value: stats?.total || 0,
      icon: <ClipboardList className="h-8 w-8" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: <Clock className="h-8 w-8" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Resolved',
      value: stats?.resolved || 0,
      icon: <CheckCircle className="h-8 w-8" />,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                Staff Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, {user?.name}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <Briefcase className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Your Profile
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Specialization: </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.specialization || 'Not set'}
                    </span>
                  </div>
                  {user?.expertise && user.expertise.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Expertise: </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.expertise.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSpecializationModal(true)}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Update Profile
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="stat-card group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`${stat.color} text-white p-3 rounded-xl shadow-lg`}
                >
                  {stat.icon}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Assigned Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assigned Complaints</h2>
            <Link to="/complaints?assigned=true" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
              View All Assigned
            </Link>
          </div>

          {assignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ClipboardList className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">No complaints assigned yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {assignments.map((complaint, index) => (
                <motion.div
                  key={complaint._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <Link
                    to={`/complaints/${complaint._id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md dark:bg-gray-800/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {complaint.title}
                      </h3>
                      <StatusBadge status={complaint.status} />
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {complaint.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-500 dark:text-gray-400">{complaint.category}</span>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Updated {getRelativeTime(complaint.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Specialization Modal */}
      <SpecializationModal
        isOpen={showSpecializationModal}
        onClose={() => {
          if (!isFirstTime) {
            setShowSpecializationModal(false);
          }
        }}
        onUpdate={() => {
          refreshUser();
          setIsFirstTime(false);
        }}
        isFirstTime={isFirstTime}
      />

      {/* AI Staff Chatbot */}
      <Chatbot role="staff" />
    </div>
  );
};

export default StaffDashboard;
