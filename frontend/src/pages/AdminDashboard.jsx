import React, { useState, useEffect } from 'react';
import { complaintAPI, userAPI } from '../utils/api';
import { Users, FileText, CheckCircle, TrendingUp, Activity, AlertCircle, Clock, UserCheck, List, BarChart2, PieChart as PieChartIcon, LayoutGrid, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { getRelativeTime } from '../utils/helpers';
import Chatbot from '../components/common/Chatbot';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Label,
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModes, setViewModes] = useState({
    trend: 'graph',
    category: 'graph',
    priority: 'graph',
    status: 'graph'
  });
  const [trendChartType, setTrendChartType] = useState('area');

  const [trendDays, setTrendDays] = useState(7);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const DONUT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#F97316', '#06B6D4'];

  const toggleViewMode = (type) => {
    setViewModes(prev => ({
      ...prev,
      [type]: prev[type] === 'graph' ? 'table' : 'graph'
    }));
  };

  useEffect(() => {
    fetchDashboardData(trendDays);
  }, [trendDays]);

  const fetchDashboardData = async (days = 7) => {
    try {
      setLoading(true);

      // Fetch user stats
      const statsResponse = await userAPI.getStats();
      
      // Fetch complaint stats with dynamic days
      const complaintStatsResponse = await complaintAPI.getStats({ days });
      
      setStats({
        ...statsResponse.data,
        complaintStats: complaintStatsResponse.data
      });

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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  const PRIORITY_COLORS = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#10B981',
  };
  const STATUS_COLORS = {
    Pending: '#F59E0B',
    'In-Progress': '#3B82F6',
    Resolved: '#10B981',
    Closed: '#6B7280',
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium">
            Complaints: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-xl">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
            <p className="text-primary-600 dark:text-primary-400 font-bold">
              {payload[0].value} <span className="text-xs font-normal text-gray-500">Complaints</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <path d={`M${cx},${cy}L${sx},${sy}`} stroke={fill} fill="none" />
        <circle cx={sx} cy={sy} r={2} fill={fill} stroke="none" />
        <motion.path
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          d={`M${cx},${cy}m${(outerRadius + 10) * cos},${(outerRadius + 10) * sin} L${mx},${my} L${ex},${ey}`}
          stroke={fill}
          strokeWidth={2}
          fill="none"
        />
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill={fill} style={{ fontSize: '12px', fontWeight: '800' }}>{payload._id}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill="#94A3B8" style={{ fontSize: '10px', fontWeight: 'bold' }}>
          {`${value} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
    if (stats?.complaintStats?.byCategory) {
      setHoveredCategory(stats.complaintStats.byCategory[index]);
    }
  };

  const onPieLeave = () => {
    setHoveredCategory(null);
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
        {/* High Priority Cases Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card mb-8 border-l-4 border-red-500 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">High Priority Cases</h2>
            </div>
            <Link 
              to="/complaints?priority=High" 
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-bold flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Complaint</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {recentComplaints
                  .filter(c => c.priority === 'High' || c.priority === 'Critical')
                  .slice(0, 5)
                  .map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-red-50/10 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/complaints/${complaint._id}`} className="block">
                          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{complaint.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{complaint.description}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PriorityBadge priority={complaint.priority} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                        {getRelativeTime(complaint.createdAt)}
                      </td>
                    </tr>
                  ))}
                {recentComplaints.filter(c => c.priority === 'High' || c.priority === 'Critical').length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                      No high priority cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Defs for Gradients */}
          <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card lg:col-span-3 hover:shadow-2xl transition-all duration-500 border-t-4 border-blue-500"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl shadow-inner">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">System Growth</h3>
                  <p className="text-xs text-gray-500 font-medium">Complaint trends over time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100/50 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => setTrendChartType('area')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trendChartType === 'area' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setTrendChartType('bar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trendChartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setTrendChartType('line')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trendChartType === 'line' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Line
                  </button>
                </div>
                <div className="flex bg-gray-100/50 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  {[7, 15, 30, 90, 'all'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTrendDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trendDays === d ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {d === 'all' ? 'All' : `${d}D`}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100/50 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => toggleViewMode('trend')}
                    className={`p-2 rounded-lg transition-all ${viewModes.trend === 'graph' ? 'bg-white dark:bg-gray-700 shadow-md text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleViewMode('trend')}
                    className={`p-2 rounded-lg transition-all ${viewModes.trend === 'table' ? 'bg-white dark:bg-gray-700 shadow-md text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full mt-4">
              {viewModes.trend === 'graph' ? (
                stats?.complaintStats?.byTrend && stats.complaintStats.byTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {trendChartType === 'area' ? (
                      <AreaChart data={stats.complaintStats.byTrend} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.4} />
                        <XAxis
                          dataKey="_id"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                          dy={15}
                          interval={Math.ceil((stats?.complaintStats?.byTrend?.length || 0) / 7)}
                          minTickGap={10}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }} />
                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#trendFill)" animationDuration={2000} activeDot={{ r: 8, strokeWidth: 0, fill: '#3B82F6', className: 'animate-pulse' }} />
                      </AreaChart>
                    ) : trendChartType === 'bar' ? (
                      <BarChart data={stats.complaintStats.byTrend} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.4} />
                        <XAxis
                          dataKey="_id"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                          dy={15}
                          interval={Math.ceil((stats?.complaintStats?.byTrend?.length || 0) / 7)}
                          minTickGap={10}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9', opacity: 0.5 }} />
                        <Bar dataKey="count" fill="url(#blueGradient)" radius={[10, 10, 0, 0]} barSize={40} animationDuration={1800} />
                      </BarChart>
                    ) : (
                      <AreaChart data={stats.complaintStats.byTrend} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.4} />
                        <XAxis
                          dataKey="_id"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                          dy={15}
                          interval={Math.ceil((stats?.complaintStats?.byTrend?.length || 0) / 7)}
                          minTickGap={10}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={4} fill="none" animationDuration={2000} activeDot={{ r: 6 }} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700 animate-pulse">
                      <Activity className="h-10 w-10 opacity-30" />
                    </div>
                    <p className="text-sm font-semibold tracking-wide uppercase opacity-40">Insufficient system data for trend</p>
                  </div>
                )
              ) : (
                <div className="overflow-auto h-full rounded-2xl border border-gray-100 dark:border-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Reporting Date</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Total Reports</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                      {stats?.complaintStats?.byTrend?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-semibold group-hover:text-blue-600 transition-colors">{item._id}</td>
                          <td className="px-6 py-4 text-sm text-right font-black text-gray-900 dark:text-white tabular-nums">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

          {/* By Category */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card group hover:shadow-xl transition-all border-b-4 border-indigo-500"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Categorization</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Fault Distribution</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                <button
                  onClick={() => toggleViewMode('category')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.category === 'graph' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-400'}`}
                >
                  <PieChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleViewMode('category')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.category === 'table' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={`w-full ${viewModes.category === 'graph' ? 'h-[250px]' : 'h-[280px]'}`}>
              {viewModes.category === 'graph' ? (
                stats?.complaintStats?.byCategory && stats.complaintStats.byCategory.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center h-full gap-4">
                    <div className="w-full lg:w-3/5 h-full relative flex items-center justify-center">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                        {hoveredCategory ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center"
                          >
                            <span className="text-3xl font-black text-primary-600 dark:text-primary-400">
                              {hoveredCategory.count}
                            </span>
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-wider uppercase mt-1 px-4 text-center line-clamp-1">
                              {hoveredCategory._id}
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center"
                          >
                            <span className="text-3xl font-black text-gray-900 dark:text-white">
                              {stats.complaintStats.byCategory.reduce((acc, curr) => acc + curr.count, 0)}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase mt-1">
                              TOTAL
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <div className="w-full h-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <Pie
                              activeIndex={activeIndex}
                              data={stats.complaintStats.byCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              dataKey="count"
                              nameKey="_id"
                              onMouseEnter={onPieEnter}
                              onMouseLeave={onPieLeave}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {stats.complaintStats.byCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#${['blue', 'green', 'purple', 'red', 'yellow', 'orange', 'cyan'][index % 7]}Gradient)`} />
                              ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="w-full lg:w-2/5 flex flex-col justify-center space-y-2 pr-4 overflow-y-auto max-h-full scrollbar-none">
                      {stats.complaintStats.byCategory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between group/item">
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">{item._id}</span>
                          </div>
                          <span className="text-[10px] font-black text-gray-900 dark:text-white tabular-nums">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No data profiles found</div>
                )
              ) : (
                <div className="space-y-2.5 overflow-auto h-full px-1">
                  {stats?.complaintStats?.byCategory?.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat._id || 'Standard'}</span>
                      </div>
                      <span className="font-black text-gray-900 dark:text-white px-4 py-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm">{cat.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* By Priority */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="card group hover:shadow-xl transition-all border-b-4 border-orange-500"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Urgency Matrix</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Priority Load</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                <button
                  onClick={() => toggleViewMode('priority')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.priority === 'graph' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-400'}`}
                >
                  <BarChart2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleViewMode('priority')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.priority === 'table' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {viewModes.priority === 'graph' ? (
                stats?.complaintStats?.byPriority && stats.complaintStats.byPriority.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.complaintStats.byPriority} layout="vertical" margin={{ left: -10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.2} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="_id"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                        width={90}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9', opacity: 0.5 }} />
                      <Bar dataKey="count" radius={[0, 15, 15, 0]} barSize={24} animationDuration={1800}>
                        {stats.complaintStats.byPriority.map((entry, index) => {
                          const gradId = entry._id === 'Critical' ? 'red' : entry._id === 'High' ? 'orange' : entry._id === 'Medium' ? 'yellow' : 'green';
                          return <Cell key={`cell-${index}`} fill={`url(#${gradId}Gradient)`} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No priority metrics</div>
                )
              ) : (
                <div className="space-y-4 overflow-auto h-full px-2">
                  {['Critical', 'High', 'Medium', 'Low'].map((pLevel) => {
                    const found = stats?.complaintStats?.byPriority?.find(p => p._id === pLevel);
                    return (
                      <div key={pLevel} className="relative group">
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/20 border border-transparent hover:border-orange-200 dark:hover:border-orange-900/40 rounded-3xl transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-2.5 h-10 rounded-full shadow-lg" style={{ backgroundColor: PRIORITY_COLORS[pLevel] }}></div>
                            <span className="font-black text-gray-800 dark:text-gray-100 tracking-tight">{pLevel}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-gray-900 dark:text-white block leading-tight">{found?.count || 0}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Tasks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* By Status */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card group hover:shadow-xl transition-all border-b-4 border-emerald-500"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Status Lifecycle</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Resolution Flow</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                <button
                  onClick={() => toggleViewMode('status')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.status === 'graph' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600' : 'text-gray-400'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleViewMode('status')}
                  className={`p-1.5 rounded-lg transition-all ${viewModes.status === 'table' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {viewModes.status === 'graph' ? (
                stats?.complaintStats?.byStatus && stats.complaintStats.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.complaintStats.byStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={15}
                        dataKey="count"
                        nameKey="_id"
                        animationDuration={1500}
                        startAngle={90}
                        endAngle={450}
                      >
                        {stats.complaintStats.byStatus.map((entry, index) => {
                          const statusGrad = entry._id === 'Pending' ? 'yellow' : entry._id === 'In-Progress' ? 'blue' : entry._id === 'Resolved' ? 'green' : 'cyan';
                          return <Cell key={`cell-${index}`} fill={`url(#${statusGrad}Gradient)`} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />;
                        })}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No status lifecycle data</div>
                )
              ) : (
                <div className="grid grid-cols-2 gap-4 h-full px-1 py-1">
                  {stats?.complaintStats?.byStatus?.map((status, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center justify-center p-6 rounded-[2.5rem] border border-white/5 dark:border-white/5 shadow-lg backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
                      style={{ backgroundColor: `${STATUS_COLORS[status._id]}10` }}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                        <Activity className="h-16 w-16" style={{ color: STATUS_COLORS[status._id] }} />
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ backgroundColor: STATUS_COLORS[status._id], boxShadow: `0 0 12px ${STATUS_COLORS[status._id]}` }}></div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50" style={{ color: STATUS_COLORS[status._id] }}>{status._id}</span>
                      <span className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter group-hover:scale-110 transition-transform duration-500">{status.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
