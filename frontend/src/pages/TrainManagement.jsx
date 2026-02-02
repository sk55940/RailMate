import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Plus, Edit, Trash2, Users, Search, Filter, X, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { trainAPI, userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const TrainManagement = () => {
  const [trains, setTrains] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    trainNumber: '',
    trainName: '',
    origin: '',
    destination: '',
    stops: '',
    departureTime: '',
    arrivalTime: '',
    frequency: 'Daily',
    type: 'Express',
    facilities: [],
    totalCoaches: '',
  });

  const [assignData, setAssignData] = useState({
    staffId: '',
  });
  
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  useEffect(() => {
    fetchTrains();
    fetchStaff();
  }, []);

  const fetchTrains = async () => {
    try {
      setLoading(true);
      const response = await trainAPI.getAll({ status: filter !== 'all' ? filter : undefined, search });
      setTrains(response.trains || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch trains');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await userAPI.getStaff();
      setStaff(response.data || response.staff || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrains();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filter]);

  // Update selectedTrain when trains data changes (after assignment/removal)
  useEffect(() => {
    if (selectedTrain && trains.length > 0) {
      const updatedTrain = trains.find(t => t._id === selectedTrain._id);
      if (updatedTrain) {
        setSelectedTrain(updatedTrain);
      }
    }
  }, [trains]);

  const handleOpenModal = (train = null) => {
    if (train) {
      setSelectedTrain(train);
      setFormData({
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        origin: train.route.origin,
        destination: train.route.destination,
        stops: train.route.stops?.join(', ') || '',
        departureTime: train.schedule.departureTime || '',
        arrivalTime: train.schedule.arrivalTime || '',
        frequency: train.schedule.frequency || 'Daily',
        type: train.type || 'Express',
        facilities: train.facilities || [],
        totalCoaches: train.totalCoaches || '',
      });
    } else {
      setSelectedTrain(null);
      setFormData({
        trainNumber: '',
        trainName: '',
        origin: '',
        destination: '',
        stops: '',
        departureTime: '',
        arrivalTime: '',
        frequency: 'Daily',
        type: 'Express',
        facilities: [],
        totalCoaches: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        trainNumber: formData.trainNumber,
        trainName: formData.trainName,
        route: {
          origin: formData.origin,
          destination: formData.destination,
          stops: formData.stops ? formData.stops.split(',').map(s => s.trim()) : [],
        },
        schedule: {
          departureTime: formData.departureTime,
          arrivalTime: formData.arrivalTime,
          frequency: formData.frequency,
        },
        type: formData.type,
        facilities: formData.facilities,
        totalCoaches: parseInt(formData.totalCoaches) || 0,
      };

      if (selectedTrain) {
        await trainAPI.update(selectedTrain._id, data);
        toast.success('Train updated successfully');
      } else {
        await trainAPI.create(data);
        toast.success('Train created successfully');
      }

      setShowModal(false);
      fetchTrains();
    } catch (error) {
      toast.error(error.message || 'Failed to save train');
    }
  };

  const handleDelete = async (trainId) => {
    if (!window.confirm('Are you sure you want to delete this train?')) return;

    try {
      await trainAPI.delete(trainId);
      toast.success('Train deleted successfully');
      fetchTrains();
    } catch (error) {
      toast.error(error.message || 'Failed to delete train');
    }
  };

  const handleOpenStaffModal = (train) => {
    setSelectedTrain(train);
    setAssignData({ staffId: '' });
    setAiRecommendation(null);
    setShowStaffModal(true);
    // Fetch AI recommendation
    fetchAIRecommendation(train);
  };

  const fetchAIRecommendation = async (train) => {
    try {
      setLoadingRecommendation(true);
      
      // Get available staff (not assigned to any train)
      const availableStaff = staff.filter(s => {
        const isAssignedToAnyTrain = trains.some(t => 
          t.assignedStaff?.some(assigned => assigned.userId._id === s._id)
        );
        return !isAssignedToAnyTrain;
      });

      if (availableStaff.length === 0) {
        setAiRecommendation(null);
        return;
      }

      // AI Scoring Algorithm
      const scoredStaff = availableStaff.map(staffMember => {
        let score = 0;
        let reasons = [];

        // Score based on specialization relevance
        const trainType = train.type || 'Express';
        const trainFacilities = train.facilities || [];
        
        if (staffMember.specialization === 'TTE') {
          score += 30;
          reasons.push('TTE specialization highly suitable for train operations');
        } else if (staffMember.specialization === 'Coach Attendant') {
          score += 25;
          reasons.push('Coach Attendant expertise valuable for passenger service');
        } else if (staffMember.specialization === 'Pantry Staff' && trainFacilities.includes('Pantry')) {
          score += 35;
          reasons.push('Pantry expertise matches train facilities');
        } else if (staffMember.specialization === 'Technical') {
          score += 28;
          reasons.push('Technical skills beneficial for train maintenance');
        } else if (staffMember.specialization === 'Security') {
          score += 22;
          reasons.push('Security expertise important for passenger safety');
        } else if (staffMember.specialization === 'Medical' && trainFacilities.includes('Medical')) {
          score += 32;
          reasons.push('Medical expertise critical for passenger health');
        } else {
          score += 15;
          reasons.push('General staff availability');
        }

        // Score based on expertise areas
        if (staffMember.expertise && staffMember.expertise.length > 0) {
          if (staffMember.expertise.includes('Train-related')) {
            score += 20;
            reasons.push('Specific train operations experience');
          }
          if (staffMember.expertise.includes('Safety')) {
            score += 15;
            reasons.push('Safety-focused expertise');
          }
          if (staffMember.expertise.includes('Facilities') && trainFacilities.length > 0) {
            score += 12;
            reasons.push('Facilities management skills');
          }
          // Bonus for multiple expertise areas
          if (staffMember.expertise.length >= 3) {
            score += 10;
            reasons.push('Versatile with multiple expertise areas');
          }
        }

        // Consider train route complexity (more stops = need experienced staff)
        const stops = train.stops ? train.stops.split(',').length : 0;
        if (stops > 5 && (staffMember.expertise?.includes('Train-related') || staffMember.specialization === 'TTE')) {
          score += 15;
          reasons.push('Complex route matches staff experience');
        }

        return {
          staff: staffMember,
          score: Math.min(score, 100), // Cap at 100
          reasons: reasons.slice(0, 3), // Top 3 reasons
          confidence: score > 70 ? 'High' : score > 50 ? 'Medium' : 'Low'
        };
      });

      // Sort by score and get top recommendation
      scoredStaff.sort((a, b) => b.score - a.score);
      
      if (scoredStaff.length > 0) {
        setAiRecommendation(scoredStaff[0]);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    
    try {
      await trainAPI.assignStaff(selectedTrain._id, assignData.staffId);
      toast.success('Staff assigned successfully');
      await fetchTrains();
      setShowStaffModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to assign staff');
    }
  };

  const handleRemoveStaff = async (trainId, staffId) => {
    if (!window.confirm('Remove this staff member from the train?')) return;

    try {
      await trainAPI.removeStaff(trainId, staffId);
      toast.success('Staff removed successfully');
      await fetchTrains();
      // Update selectedTrain if modal is open
      if (showStaffModal && selectedTrain._id === trainId) {
        const updatedTrain = trains.find(t => t._id === trainId);
        if (updatedTrain) setSelectedTrain(updatedTrain);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove staff');
    }
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const facilityOptions = ['AC', 'Sleeper', 'Pantry', 'WiFi', 'Charging Points', 'Reading Light'];

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Inactive: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      Maintenance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    return colors[status] || colors.Active;
  };

  if (loading && trains.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
                <Train className="h-10 w-10" />
                Train Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage trains and assign staff members
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Train
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search trains..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-full md:w-48"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </motion.div>

        {/* Trains Grid */}
        {trains.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <Train className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              No trains found
            </p>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              Add Your First Train
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trains.map((train, index) => (
              <motion.div
                key={train._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="card hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {train.trainNumber}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {train.trainName}
                    </p>
                  </div>
                  <span className={`badge ${getStatusColor(train.status)}`}>
                    {train.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Route:</span> {train.route.origin} → {train.route.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Type:</span> {train.type}
                  </p>
                  {train.schedule?.departureTime && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Departure:</span> {train.schedule.departureTime}
                    </p>
                  )}
                </div>

                {train.facilities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {train.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {train.assignedStaff?.length || 0} Staff Assigned
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenStaffModal(train)}
                    className="btn btn-secondary flex-1 text-sm py-2.5 inline-flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Staff</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(train)}
                    className="btn btn-secondary px-3 py-2"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(train._id)}
                    className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Train Modal */}
        <AnimatePresence>
          {showModal && (
            <Modal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              title={selectedTrain ? 'Edit Train' : 'Add New Train'}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Train Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.trainNumber}
                      onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                      className="input"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="label">Train Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.trainName}
                      onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                      className="input"
                      placeholder="Mumbai Express"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Origin Station *</label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="input"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="label">Destination Station *</label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="input"
                      placeholder="Delhi"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Intermediate Stops</label>
                  <input
                    type="text"
                    value={formData.stops}
                    onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                    className="input"
                    placeholder="Surat, Vadodara, Ahmedabad (comma separated)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Departure Time</label>
                    <input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Arrival Time</label>
                    <input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="input"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Alternate Days">Alternate Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Train Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                    >
                      <option value="Express">Express</option>
                      <option value="Superfast">Superfast</option>
                      <option value="Local">Local</option>
                      <option value="Mail">Mail</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Total Coaches</label>
                    <input
                      type="number"
                      value={formData.totalCoaches}
                      onChange={(e) => setFormData({ ...formData, totalCoaches: e.target.value })}
                      className="input"
                      placeholder="18"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Facilities</label>
                  <div className="grid grid-cols-3 gap-2">
                    {facilityOptions.map((facility) => (
                      <label
                        key={facility}
                        className="flex items-center gap-2 p-2 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={formData.facilities.includes(facility)}
                          onChange={() => handleFacilityToggle(facility)}
                          className="rounded text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {selectedTrain ? 'Update Train' : 'Create Train'}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* Staff Assignment Modal */}
        <AnimatePresence>
          {showStaffModal && selectedTrain && (
            <Modal
              isOpen={showStaffModal}
              onClose={() => setShowStaffModal(false)}
              title={`Manage Staff - ${selectedTrain.trainName}`}
            >
              <div className="space-y-6">
                {/* Current Staff */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Current Staff ({selectedTrain.assignedStaff?.length || 0})
                  </h3>
                  {selectedTrain.assignedStaff?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTrain.assignedStaff.map((assignment) => (
                        <div
                          key={assignment.userId._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {assignment.userId.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {assignment.role}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveStaff(selectedTrain._id, assignment.userId._id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No staff assigned yet</p>
                  )}
                </div>

                {/* Assign New Staff */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Assign New Staff
                  </h3>

                  {/* AI Recommendation */}
                  {loadingRecommendation && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing best staff match...</span>
                      </div>
                    </div>
                  )}

                  {!loadingRecommendation && aiRecommendation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-gradient-to-br from-purple-50 to-primary-50 dark:from-purple-900/20 dark:to-primary-900/20 p-4 rounded-xl border-2 border-primary-200 dark:border-primary-800"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">AI Recommendation</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                aiRecommendation.confidence === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                aiRecommendation.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {aiRecommendation.confidence} Confidence
                              </span>
                              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                {aiRecommendation.score}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {aiRecommendation.staff.name} - {aiRecommendation.staff.specialization}
                          </p>
                          <div className="space-y-1">
                            {aiRecommendation.reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <Zap className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignData({ staffId: aiRecommendation.staff._id })}
                        className="w-full btn btn-sm bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-700 hover:to-primary-700 text-white"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Use AI Recommendation
                      </button>
                    </motion.div>
                  )}

                  <form onSubmit={handleAssignStaff} className="space-y-4">
                    <div>
                      <label className="label">Select Staff</label>
                      <select
                        required
                        value={assignData.staffId}
                        onChange={(e) => setAssignData({ ...assignData, staffId: e.target.value })}
                        className="input"
                      >
                        <option value="">Choose a staff member</option>
                        {staff
                          .filter(s => {
                            // Check if staff is assigned to ANY train
                            const isAssignedToAnyTrain = trains.some(train => 
                              train.assignedStaff?.some(assigned => assigned.userId._id === s._id)
                            );
                            return !isAssignedToAnyTrain;
                          })
                          .map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} - {s.specialization || 'General'} {s.expertise && s.expertise.length > 0 ? `(${s.expertise.join(', ')})` : ''}
                            </option>
                          ))}
                      </select>
                      {staff.filter(s => {
                        const isAssignedToAnyTrain = trains.some(train => 
                          train.assignedStaff?.some(assigned => assigned.userId._id === s._id)
                        );
                        return !isAssignedToAnyTrain;
                      }).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          All staff members are currently assigned to trains
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowStaffModal(false)}
                        className="btn btn-secondary flex-1"
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary flex-1">
                        Assign Staff
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrainManagement;
