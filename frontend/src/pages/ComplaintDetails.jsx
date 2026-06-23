import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../utils/api';
import { 
  ArrowLeft, Clock, User, Calendar, MapPin, FileText, 
  MessageSquare, Activity, Sparkles, Edit, Trash2, Brain, Zap, UserPlus, X, CheckCircle, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/common/Loader';
import StatusBadge, { PriorityBadge } from '../components/common/Badges';
import { formatDateTime, getRelativeTime } from '../utils/helpers';
import AssignmentModal from '../components/common/AssignmentModal';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [assignmentSuggestion, setAssignmentSuggestion] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [proofOfWorkFile, setProofOfWorkFile] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    remarks: '',
    proofOfWorkNote: '',
  });

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await complaintAPI.getById(id);
      setComplaint(response.data);
      setUpdateData({
        status: response.data.status,
        priority: response.data.priority,
        remarks: '',
        proofOfWorkNote: '',
      });
    } catch (error) {
      console.error('Fetch complaint error:', error);
      toast.error('Failed to load complaint details');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      
      const formData = new FormData();
      formData.append('status', updateData.status);
      formData.append('priority', updateData.priority);
      if (updateData.remarks) formData.append('remark', updateData.remarks);
      if (updateData.proofOfWorkNote) formData.append('proofOfWorkNote', updateData.proofOfWorkNote);
      if (proofOfWorkFile) formData.append('proofOfWork', proofOfWorkFile);

      await complaintAPI.updateStatus(id, formData);
      toast.success('Complaint updated successfully');
      setShowUpdateModal(false);
      // Refresh complaint details
      await fetchComplaintDetails();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      await complaintAPI.delete(id);
      toast.success('Complaint deleted successfully');
      navigate('/complaints');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete complaint');
    }
  };
  const fetchPrediction = async () => {
    try {
      setLoadingPrediction(true);
      const response = await api.get(`/chatbot/predict-resolution/${id}`);
      console.log('Prediction response:', response);
      setPrediction(response.data || response);
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.message || 'Failed to load prediction');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const fetchAssignmentSuggestion = async () => {
    try {
      setLoadingSuggestion(true);
      const response = await api.get(`/chatbot/suggest-assignment/${id}`);
      console.log('Assignment response:', response);
      setAssignmentSuggestion(response.data || response);
    } catch (error) {
      console.error('Assignment suggestion error:', error);
      toast.error(error.response?.data?.message || 'Failed to load suggestion');
    } finally {
      setLoadingSuggestion(false);
    }
  };
  if (loading) {
    return <Loader fullScreen />;
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Complaint not found</h3>
            <Link to="/complaints" className="btn btn-primary mt-4">
              Back to Complaints
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const canUpdateComplaint = user?.role === 'admin' || user?.role === 'staff';
  const canDeleteComplaint = user?.role === 'admin' || complaint.userId?._id === user?._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{complaint.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complaint ID: {complaint._id}
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {user?.role === 'admin' && 
               !complaint.assignedTo && 
               (complaint.status === 'Pending' || complaint.status === 'In-Progress') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAssignmentModal(true)}
                  className="btn btn-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Staff
                </motion.button>
              )}
              {canUpdateComplaint && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUpdateModal(true)}
                  className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-800/40"
                >
                  <Edit className="h-4 w-4" />
                  Update
                </motion.button>
              )}
              {canDeleteComplaint && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteComplaint}
                  className="btn bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 dark:shadow-red-800/40"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status and Priority Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            {complaint.category}
          </span>
          {complaint.sentiment && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              complaint.sentiment === 'Frustrated' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
              complaint.sentiment === 'Negative' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
              complaint.sentiment === 'Neutral' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
            }`}>
              {complaint.sentiment}
            </span>
          )}
        </motion.div>

        {/* AI Features Section - Admin Only */}
        {canUpdateComplaint && user?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-1 gap-6 mb-6"
          >
            {/* Similar Complaints & Patterns */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
                  <Brain className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Similar Complaints & Patterns
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchPrediction}
                  disabled={loadingPrediction}
                  className="btn btn-sm btn-outline"
                >
                  {loadingPrediction ? 'Loading...' : 'Find Similar'}
                </motion.button>
              </div>
              {prediction ? (
                <div className="space-y-4">
                  {/* Pattern Analysis */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {prediction.historicalData?.similarResolved || 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Similar Cases</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {prediction.historicalData?.successRate || '0%'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Resolution Rate</div>
                    </div>
                  </div>

                  {/* Insights */}
                  {prediction.historicalData?.similarResolved > 0 ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Pattern Detected
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {prediction.historicalData.similarResolved > 3 
                          ? `⚠️ This is a recurring issue! ${prediction.historicalData.similarResolved} similar complaints found. Consider investigating root cause and implementing preventive measures.`
                          : `${prediction.historicalData.similarResolved} similar complaint(s) found. Review past resolutions for effective solutions.`}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        ✓ No similar complaints found. This appears to be an isolated incident.
                      </p>
                    </div>
                  )}

                  {/* Quick Action Suggestions */}
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Recommended Actions
                      </h4>
                      <div className="space-y-2">
                        {prediction.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="mt-1">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                {idx + 1}
                              </div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">
                    Identify Patterns & Similar Issues
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    Find similar complaints, success rates, and recommended actions
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{complaint.description}</p>
            </motion.div>

            {/* Proof of Work Display */}
            {(complaint.proofOfWork || complaint.proofOfWorkNote) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Proof of Completion</h2>
                </div>
                
                {complaint.proofOfWork && (
                  <div className="mb-4">
                    {(() => {
                      const proofUrl = complaint.proofOfWork.startsWith('http') 
                        ? complaint.proofOfWork 
                        : complaint.proofOfWork.startsWith('/') ? complaint.proofOfWork : `/${complaint.proofOfWork}`;
                      return (
                        <img 
                          src={proofUrl} 
                          alt="Proof of Work" 
                          className="w-full max-h-[400px] object-contain rounded-lg border border-green-200 dark:border-green-700 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setSelectedMedia(proofUrl);
                            setMediaType('image');
                          }}
                        />
                      );
                    })()}
                  </div>
                )}
                
                {complaint.proofOfWorkNote && (
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      "{complaint.proofOfWorkNote}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Media Attachments - Admin & Staff Only */}
            {(user?.role === 'admin' || user?.role === 'staff') && (complaint.images?.length > 0 || complaint.videos?.length > 0 || complaint.attachmentURL) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Media Attachments
                </h2>
                
                {/* Images */}
                {complaint.images && complaint.images.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {complaint.images.map((image, idx) => {
                        // Handle both full URLs and relative paths
                        const imageUrl = image.startsWith('http') 
                          ? image 
                          : image.startsWith('/') ? image : `/${image}`;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedMedia(imageUrl);
                              setMediaType('image');
                            }}
                            className="group relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
                          >
                            <img 
                              src={imageUrl} 
                              alt={`Attachment ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {complaint.videos && complaint.videos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complaint.videos.map((video, idx) => {
                        // Handle both full URLs and relative paths
                        const videoUrl = video.startsWith('http') 
                          ? video 
                          : video.startsWith('/') ? video : `/${video}`;
                        return (
                          <div key={idx} className="relative group">
                            <video 
                              controls
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <source src={videoUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <button
                              onClick={() => {
                                setSelectedMedia(videoUrl);
                                setMediaType('video');
                              }}
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="View fullscreen"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Legacy Attachment URL */}
                {complaint.attachmentURL && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachment</h3>
                    {(() => {
                      const attachmentUrl = complaint.attachmentURL.startsWith('http') 
                        ? complaint.attachmentURL 
                        : complaint.attachmentURL.startsWith('/') ? complaint.attachmentURL : `/${complaint.attachmentURL}`;
                      return (
                        <a 
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          View Attachment
                        </a>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Analysis - Admin & Staff Only */}
            {(user?.role === 'admin' || user?.role === 'staff') && complaint.aiSummary && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800"
              >
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      AI Analysis
                    </h2>
                    <div className="space-y-3">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {complaint.aiSummary}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {complaint.aiCategory && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category:</span>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                              {complaint.aiCategory}
                            </span>
                          </div>
                        )}
                        {complaint.aiPriority && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              complaint.aiPriority === 'Critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                              complaint.aiPriority === 'High' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                              complaint.aiPriority === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}>
                              {complaint.aiPriority}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Activity Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Activity Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Complaint Submitted</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(complaint.createdAt)}</p>
                  </div>
                </div>

                {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Status Updated</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(complaint.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Complaint Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Complaint Information</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Submitted By</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {complaint.userId?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{complaint.userId?.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Submitted On</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(complaint.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(complaint.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(complaint.updatedAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(complaint.updatedAt)}</p>
                  </div>
                </div>

                {complaint.stationName && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.stationName}</p>
                    </div>
                  </div>
                )}

                {complaint.trainNumber && (
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Train Number</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{complaint.trainNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            {canUpdateComplaint && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUpdateModal(true)}
                    className="w-full btn btn-primary"
                  >
                    Update Status
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Update Complaint
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateComplaint} className="space-y-5">
              <div>
                <label className="label">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Priority
                </label>
                <select
                  value={updateData.priority}
                  onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Remarks (Optional)
                </label>
                <textarea
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData({ ...updateData, remarks: e.target.value })}
                  className="input w-full resize-none"
                  rows={4}
                  placeholder="Add any notes or updates..."
                />
              </div>

              {(user?.role === 'staff' || user?.role === 'admin') && (
                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Proof of Work
                  </h4>
                  <div>
                    <label className="label !text-xs">Proof Image</label>
                    <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-xl hover:border-primary-500 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                            <span>{proofOfWorkFile ? proofOfWorkFile.name : 'Upload a file'}</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => setProofOfWorkFile(e.target.files[0])}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label !text-xs">Completion Note</label>
                    <textarea
                      value={updateData.proofOfWorkNote || ''}
                      onChange={(e) => setUpdateData({ ...updateData, proofOfWorkNote: e.target.value })}
                      className="input w-full resize-none"
                      rows={2}
                      placeholder="Briefly describe what was done..."
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={updating}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-800/40 flex-1"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Complaint'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        complaint={complaint}
        onAssign={fetchComplaintDetails}
      />

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => {
              setSelectedMedia(null);
              setMediaType(null);
            }}
          >
            <button
              onClick={() => {
                setSelectedMedia(null);
                setMediaType(null);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-7xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaType === 'image' && (
                <img
                  src={selectedMedia}
                  alt="Full size"
                  className="w-full h-full object-contain rounded-lg"
                />
              )}
              {mediaType === 'video' && (
                <video
                  src={selectedMedia}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                >
                  <source src={selectedMedia} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintDetails;
