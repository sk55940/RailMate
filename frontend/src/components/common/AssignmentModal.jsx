import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, TrendingUp, Award, Zap, CheckCircle, AlertCircle, MapPin, Train } from 'lucide-react';
import { trainAPI, assignmentAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import Loader from './Loader';

const AssignmentModal = ({ isOpen, onClose, complaint, onAssign }) => {
  const [staff, setStaff] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen && complaint) {
      fetchAvailableStaff();
    }
  }, [isOpen, complaint]);

  const fetchAvailableStaff = async () => {
    try {
      setLoading(true);
      const response = await trainAPI.getAvailableStaff(complaint._id);
      setStaff(response.staff || []);
      setAiRecommendation(response.recommendation || null);
      setContext(response.context || '');
    } catch (error) {
      toast.error('Failed to fetch available staff');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (staffId) => {
    try {
      setAssigning(true);
      await assignmentAPI.create({
        complaintId: complaint._id,
        staffId: staffId,
      });
      toast.success('Staff assigned successfully');
      if (onAssign) {
        await onAssign(); // Wait for the complaint to be refetched
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!aiRecommendation) return;
    await handleAssign(aiRecommendation.staffId._id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Assign Staff
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complaint #{complaint?.complaintId} - {complaint?.category}
              </p>
              {context && (
                <div className="flex items-center gap-2 mt-2">
                  {context.includes('Train') ? (
                    <Train className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {context}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Recommendation */}
                {aiRecommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-primary-50 dark:from-purple-900/20 dark:to-primary-900/20 p-5 rounded-xl border-2 border-primary-200 dark:border-primary-800"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-primary-600 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          AI Recommendation
                          <span className="text-sm font-normal px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            {aiRecommendation.score}% Match
                          </span>
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          Best match for this complaint
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {aiRecommendation.staffId.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {aiRecommendation.staffId.specialization || 'General'}
                          </p>
                        </div>
                        <Award className="h-8 w-8 text-yellow-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Match Score</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {aiRecommendation.score}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {aiRecommendation.confidence}
                          </p>
                        </div>
                      </div>

                      {aiRecommendation.reasons && aiRecommendation.reasons.length > 0 && (
                        <div className="space-y-1">
                          {aiRecommendation.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAutoAssign}
                      disabled={assigning}
                      className="w-full btn btn-primary bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 py-3 text-lg font-semibold"
                    >
                      {assigning ? 'Assigning...' : '✨ Auto-Assign (Recommended)'}
                    </button>
                  </motion.div>
                )}

                {/* Available Staff List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    All Available Staff ({staff.length})
                  </h3>

                  {staff.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No staff available for this complaint
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staff.map((member) => (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            aiRecommendation?.staffId._id === member._id
                              ? 'border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {member.name}
                                </p>
                                {aiRecommendation?.staffId._id === member._id && (
                                  <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-primary-600 text-white text-xs rounded-full font-medium">
                                    ✨ AI Recommended
                                  </span>
                                )}
                                {/* Availability Badge */}
                                {member.availability && (
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    member.availability === 'On Train' 
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {member.availability === 'On Train' ? '🚂' : '📍'} {member.availability}
                                  </span>
                                )}
                                {/* Train Info Badge */}
                                {member.trainName && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
                                    {member.trainName} #{member.trainNumber}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                {/* Specialization */}
                                {member.specialization && (
                                  <div className="flex items-center gap-1">
                                    <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {member.specialization}
                                    </span>
                                  </div>
                                )}
                                {/* Expertise */}
                                {member.expertise && member.expertise.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    <span className="text-gray-700 dark:text-gray-300 text-xs">
                                      {member.expertise.slice(0, 2).join(', ')}
                                      {member.expertise.length > 2 && ` +${member.expertise.length - 2}`}
                                    </span>
                                  </div>
                                )}
                                {member.currentWorkload !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {member.currentWorkload || 0} active
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAssign(member._id)}
                              disabled={assigning}
                              className="btn btn-primary px-6 ml-4 whitespace-nowrap"
                            >
                              {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignmentModal;
