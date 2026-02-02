import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { complaintAPI, userAPI } from '../utils/api';
import { 
  FileText, Clock, CheckCircle, AlertCircle, Plus, TrendingUp 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../components/common/Loader';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import Chatbot from '../components/common/Chatbot';

const PassengerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await userAPI.getStats();
      setStats(statsResponse.data);

      // Fetch recent complaints
      const complaintsResponse = await complaintAPI.getAll({ limit: 5 });
      setRecentComplaints(complaintsResponse.data.complaints);
    } catch (error) {
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
      title: 'Total Complaints',
      value: stats?.total || 0,
      icon: <FileText className="h-8 w-8" />,
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
      icon: <TrendingUp className="h-8 w-8" />,
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="gradient-text">{user?.name}</span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Track and manage your railway complaints
          </p>
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/complaints/new" className="btn btn-primary inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Submit New Complaint
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/my-complaints" className="btn btn-secondary inline-flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                View All Complaints
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Complaints</h2>
            <Link to="/my-complaints" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              View All →
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">No complaints submitted yet</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/complaints/new" className="btn btn-primary inline-flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Submit Your First Complaint
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <Link
                    to={`/complaints/${complaint._id}`}
                    className="block p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg dark:hover:shadow-primary-500/20 transition-all bg-white dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{complaint.title}</h3>
                      <StatusBadge status={complaint.status} />
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {complaint.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{complaint.category}</span>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {getRelativeTime(complaint.createdAt)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Chatbot */}
      <Chatbot role="passenger" />
    </div>
  );
};

export default PassengerDashboard;
