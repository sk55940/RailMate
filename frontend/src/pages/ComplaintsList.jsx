import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../utils/api';
import { 
  FileText, Filter, Search, ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../components/common/Loader';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { getRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const ComplaintsList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: filters.page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
      };

      // Passengers see their own complaints, staff see assigned complaints
      // Backend handles filtering based on user role
      if (user?.role === 'staff') {
        params.assignedToMe = true;
      }
      const response = await complaintAPI.getAll(params);
      setComplaints(response.data.complaints || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Fetch complaints error:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
      page: 1,
    });
    setSearchParams({});
  };

  if (loading && filters.page === 1) {
    return <Loader fullScreen />;
  }

  const categories = [
    'Train-related',
    'Station-related',
    'Staff-related',
    'Cleanliness',
    'Safety',
    'Ticketing',
    'Facilities',
    'Other',
  ];

  const statuses = ['Pending', 'In-Progress', 'Resolved', 'Closed'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text">
            {user?.role === 'admin' ? 'All Complaints' : user?.role === 'staff' ? 'Assigned Complaints' : 'My Complaints'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {user?.role === 'admin' 
              ? 'View and manage all system complaints' 
              : user?.role === 'staff'
              ? 'Complaints assigned to you'
              : 'Track and manage your submitted complaints'}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </h3>
            {(filters.status || filters.priority || filters.category || filters.search) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
              >
                Clear All ✕
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Showing {complaints.length > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total || 0} complaints
          </p>
          {user?.role === 'passenger' && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/complaints/new" className="btn btn-primary inline-flex items-center">
              Submit New Complaint
            </Link>
          </motion.div>
          )}
        </motion.div>

        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : complaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileText className="h-20 w-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No complaints found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.status || filters.priority || filters.category || filters.search
                ? 'Try adjusting your filters'
                : user?.role === 'passenger'
                ? 'You haven\'t submitted any complaints yet'
                : 'No complaints to display'}
            </p>
            {user?.role === 'passenger' && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/complaints/new" className="btn btn-primary inline-flex items-center">
                  Submit Your First Complaint
                </Link>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <Link
                  to={`/complaints/${complaint._id}`}
                  className="card hover:shadow-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{complaint.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">{complaint.description}</p>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-4 flex-shrink-0" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                      {complaint.category}
                    </span>
                    {complaint.sentiment && (
                      <span className={`badge ${
                        complaint.sentiment === 'Frustrated' ? 'badge-critical' :
                        complaint.sentiment === 'Negative' ? 'badge-high' :
                        complaint.sentiment === 'Neutral' ? 'badge-in-progress' :
                        'badge-resolved'
                      }`}>
                        {complaint.sentiment}
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400 ml-auto font-medium">
                      {getRelativeTime(complaint.createdAt)}
                    </span>
                  </div>

                  {complaint.aiSummary && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-primary-600 dark:text-primary-400">AI Summary:</span> {complaint.aiSummary}
                      </p>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </motion.button>

            <div className="flex items-center space-x-2">
              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        page === pagination.page
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {page}
                    </motion.button>
                  );
                } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                  return <span key={page} className="text-gray-500 dark:text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsList;
