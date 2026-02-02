import React, { useState, useEffect } from 'react';
import { complaintAPI, userAPI } from '../utils/api';
import { Users, FileText, CheckCircle, TrendingUp, Activity, AlertCircle, Clock, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { getRelativeTime } from '../utils/helpers';
import Chatbot from '../components/common/Chatbot';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await userAPI.getStats();
      setStats(statsResponse.data);

      // Fetch complaint stats
      const complaintStatsResponse = await complaintAPI.getStats();
      setStats(prev => ({ ...prev, complaintStats: complaintStatsResponse.data }));

      // Fetch recent complaints
      const complaintsResponse = await complaintAPI.getAll({ limit: 10, sort: '-createdAt' });
      setRecentComplaints(complaintsResponse.data.complaints || []);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
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
      value: stats?.complaints?.total || stats?.complaintStats?.total || 0,
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-blue-500',
      link: '/complaints',
    },
    {
      title: 'Pending',
      value: stats?.complaints?.pending || stats?.complaintStats?.pending || 0,
      icon: <Clock className="h-8 w-8" />,
      color: 'bg-yellow-500',
      link: '/complaints?status=Pending',
    },
    {
      title: 'In Progress',
      value: stats?.complaints?.inProgress || stats?.complaintStats?.inProgress || 0,
      icon: <Activity className="h-8 w-8" />,
      color: 'bg-blue-400',
      link: '/complaints?status=In-Progress',
    },
    {
      title: 'Resolved',
      value: stats?.complaints?.resolved || stats?.complaintStats?.resolved || 0,
      icon: <CheckCircle className="h-8 w-8" />,
      color: 'bg-green-500',
      link: '/complaints?status=Resolved',
    },
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: <Users className="h-8 w-8" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Staff Members',
      value: stats?.users?.staff || 0,
      icon: <UserCheck className="h-8 w-8" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Passengers',
      value: stats?.users?.passengers || 0,
      icon: <Users className="h-8 w-8" />,
      color: 'bg-teal-500',
    },
    {
      title: 'High Priority',
      value: stats?.complaintStats?.byPriority?.find(p => p._id === 'High')?.count || 0,
      icon: <AlertCircle className="h-8 w-8" />,
      color: 'bg-red-500',
      link: '/complaints?priority=High',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System overview and management
          </p>
        </motion.div>

        {/* Stats Cards - 8 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const CardContent = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  {stat.change && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.change} from last week</p>
                  )}
                </div>
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`${stat.color} text-white p-3 rounded-xl shadow-lg`}
                >
                  {stat.icon}
                </motion.div>
              </motion.div>
            );

            return (
              <div key={index} className="stat-card">
                {stat.link ? (
                  <Link to={stat.link} className="block hover:opacity-90 transition-opacity">
                    {CardContent}
                  </Link>
                ) : (
                  CardContent
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="w-full"
          >
            <Link to="/complaints" className="card hover:shadow-xl transition-shadow cursor-pointer block w-full">
              <div>
                <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400 mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Complaints</h3>
              <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">View, filter, and manage all complaints</p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="w-full"
          >
            <Link to="/complaints?status=Pending" className="card hover:shadow-xl transition-shadow cursor-pointer block w-full">
              <div>
                <AlertCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending Complaints</h3>
              <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">Review and assign pending complaints to staff</p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="w-full"
          >
            <Link to="/complaints?priority=High" className="card hover:shadow-xl transition-shadow cursor-pointer block w-full">
              <div>
                <TrendingUp className="h-10 w-10 text-red-600 dark:text-red-400 mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">High Priority</h3>
              <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">Urgent complaints requiring immediate attention</p>
            </Link>
          </motion.div>
        </div>

        {/* Recent Complaints & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* By Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complaints by Category</h3>
            {stats?.complaintStats?.byCategory && stats.complaintStats.byCategory.length > 0 ? (
              <div className="space-y-3">
                {stats.complaintStats.byCategory.map((cat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{cat._id || 'Unknown'}</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{cat.count}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
            )}
          </motion.div>

          {/* By Priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complaints by Priority</h3>
            {stats?.complaintStats?.byPriority && stats.complaintStats.byPriority.length > 0 ? (
              <div className="space-y-3">
                {stats.complaintStats.byPriority.map((priority, index) => {
                  const colors = {
                    Critical: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
                    High: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
                    Medium: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
                    Low: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
                  };
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ x: 5 }}
                      className={`flex items-center justify-between p-2 rounded ${colors[priority._id] || 'bg-gray-50 dark:bg-gray-800'}`}
                    >
                      <span className="font-medium">{priority._id || 'Unknown'}</span>
                      <span className="font-bold">{priority.count}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
            )}
          </motion.div>

          {/* By Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complaints by Status</h3>
            {stats?.complaintStats?.byStatus && stats.complaintStats.byStatus.length > 0 ? (
              <div className="space-y-3">
                {stats.complaintStats.byStatus.map((status, index) => {
                  const colors = {
                    Pending: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
                    'In-Progress': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
                    Resolved: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
                    Closed: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
                  };
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.05 }}
                      whileHover={{ x: 5 }}
                      className={`flex items-center justify-between p-2 rounded ${colors[status._id] || 'bg-gray-50 dark:bg-gray-800'}`}
                    >
                      <span className="font-medium">{status._id || 'Unknown'}</span>
                      <span className="font-bold">{status.count}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
            )}
          </motion.div>
        </div>

        {/* Recent Complaints Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Complaints</h3>
            <Link to="/complaints" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm">
              View All →
            </Link>
          </div>

          {recentComplaints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentComplaints.slice(0, 5).map((complaint, index) => (
                    <motion.tr
                      key={complaint._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{complaint.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{complaint.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{complaint.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={complaint.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getRelativeTime(complaint.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/complaints/${complaint._id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No complaints found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Admin Chatbot */}
      <Chatbot role="admin" />
    </div>
  );
};

export default AdminDashboard;
