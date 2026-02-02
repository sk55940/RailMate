import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI, trainAPI } from '../utils/api';
import { ArrowLeft, Upload, Sparkles, X, Image as ImageIcon, Video, MapPin, Train } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import api from '../utils/api';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    locationType: '', // 'Station' or 'Train'
    location: '',
    prnNumber: '',
    trainNumber: '',
    trainId: '',
  });

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

  useEffect(() => {
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    try {
      const response = await trainAPI.getActive();
      setTrains(response.trains || []);
    } catch (error) {
      console.error('Failed to fetch trains:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per image.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedVideos.length > 2) {
      toast.error('Maximum 2 videos allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 50MB per video.`);
        return false;
      }
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video file.`);
        return false;
      }
      return true;
    });

    setSelectedVideos(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews(prev => [...prev, { url: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeVideo = (index) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImage = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setAnalyzingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result.split(',')[1];
          const response = await api.post('/chatbot/analyze-image', {
            image: base64Image,
            complaintText: formData.description
          });
          
          console.log('API Response:', response.data);
          
          // Backend returns { success: true, analysis: {...} }
          const analysis = response.data?.analysis || response.data;
          
          if (!analysis || typeof analysis !== 'object') {
            throw new Error('Invalid analysis response');
          }
          
          setImageAnalysis(analysis);
          
          // Auto-fill form with AI suggestions
          if (!formData.category && analysis.category) {
            setFormData(prev => ({ ...prev, category: analysis.category }));
          }
          if (!formData.description.trim() && analysis.description) {
            setFormData(prev => ({ 
              ...prev, 
              description: analysis.description 
            }));
          }
          
          toast.success('Image analyzed successfully!');
        } catch (innerError) {
          console.error('Image analysis error:', innerError);
          toast.error(innerError.response?.data?.message || innerError.message || 'Failed to analyze image');
        } finally {
          setAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(selectedImages[0]);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read image file');
      setAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare multipart form data with image files
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('category', formData.category);
      form.append('locationType', formData.locationType);
      if (formData.location) form.append('stationName', formData.location);
      if (formData.trainNumber) form.append('trainNumber', formData.trainNumber);
      if (formData.trainId) form.append('trainId', formData.trainId);
      if (formData.pnrNumber) form.append('pnrNumber', formData.pnrNumber);
      if (formData.dateOfIncident) form.append('dateOfIncident', formData.dateOfIncident);

      // Append image files (as 'images')
      selectedImages.forEach((file) => {
        form.append('images', file);
      });

      // Append video files (as 'videos')
      selectedVideos.forEach((file) => {
        form.append('videos', file);
      });

      const response = await api.post('/complaints', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Complaint submitted successfully!');

      // Navigate to the created complaint details page
      setTimeout(() => {
        navigate(`/complaints/${response.data._id}`);
      }, 1000);
    } catch (error) {
      toast.error(error.message || 'Failed to submit complaint');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-3">Submit New Complaint</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Our AI will automatically analyze and prioritize your complaint for faster resolution
            </p>
          </div>
        </motion.div>

        {/* AI Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-strong bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-start">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white/20 p-3 rounded-lg mr-4"
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-blue-50 leading-relaxed">
                Your complaint will be automatically analyzed by our advanced AI to determine priority level, 
                detect sentiment, and generate a summary for faster resolution.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Complaint Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                Complaint Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Dirty washroom at Platform 3"
                className="input"
                required
                maxLength={200}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* PRN Number */}
            <div>
              <label htmlFor="prnNumber" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                PNR Number <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="prnNumber"
                name="prnNumber"
                value={formData.prnNumber}
                onChange={handleInputChange}
                placeholder="e.g., 1234567890"
                className="input"
                maxLength={10}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Enter your 10-digit PNR number if complaint is related to a booked journey
              </p>
            </div>

            {/* Category & Location Type Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  ✨ AI will verify and may adjust based on your description
                </p>
              </div>

              {/* Location Type */}
              <div>
                <label htmlFor="locationType" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationType"
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select location type</option>
                  <option value="Station">🏛️ Station</option>
                  <option value="Train">🚆 Train</option>
                </select>
              </div>
            </div>

            {/* Conditional Location/Train Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              {formData.locationType === 'Station' && (
                <div>
                  <label htmlFor="location" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                    <MapPin className="inline h-5 w-5 mr-1" />
                    Station Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., New Delhi Station"
                    className="input"
                    required
                  />
                </div>
              )}
              
              {formData.locationType === 'Train' && (
                <div className="md:col-span-2">
                  <label htmlFor="trainId" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                    <Train className="inline h-5 w-5 mr-1" />
                    Select Train <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="trainId"
                    name="trainId"
                    value={formData.trainId}
                    onChange={(e) => {
                      const selectedTrain = trains.find(t => t._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        trainId: e.target.value,
                        trainNumber: selectedTrain ? selectedTrain.trainNumber : ''
                      }));
                    }}
                    className="input"
                    required
                  >
                    <option value="">Choose a train</option>
                    {trains.map((train) => (
                      <option key={train._id} value={train._id}>
                        {train.trainNumber} - {train.trainName} ({train.route.origin} → {train.route.destination})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Select the train where you experienced the issue
                  </p>
                </div>
              )}
              
              {/* Moved to separate section below to match old structure */}
              {formData.locationType === 'Train' && formData.trainNumber && (
                <div style={{display: 'none'}}>
                  <label htmlFor="trainNumber" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                    <Train className="inline h-5 w-5 mr-1" />
                    Train Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="trainNumber"
                    name="trainNumber"
                    value={formData.trainNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 12345"
                    className="input"
                    required
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your complaint in detail. Include what happened, when it occurred, and any other relevant information that will help us resolve the issue quickly."
                className="textarea resize-none"
                rows={6}
                required
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Image Upload */}
            <div className="glass bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
              <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
                <ImageIcon className="h-5 w-5 inline mr-2" />
                Attach Images <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">(Optional)</span>
              </label>
              
              {/* Upload Area */}
              <div className="space-y-4">
                {selectedImages.length < 3 && (
                  <label className="border-3 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-white/50 dark:hover:bg-white/10 transition-all cursor-pointer block bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={selectedImages.length >= 3}
                    />
                    <Upload className="h-10 w-10 text-purple-500 dark:text-purple-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PNG, JPG up to 5MB each (Max 3 images)</p>
                  </label>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Uploaded Images ({imagePreviews.length}/3)
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Upload */}
            <div className="glass bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
              <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
                <Video className="h-5 w-5 inline mr-2" />
                Attach Videos <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">(Optional)</span>
              </label>
              
              {/* Upload Area */}
              <div className="space-y-4">
                {selectedVideos.length < 2 && (
                  <label className="border-3 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white/50 dark:hover:bg-white/10 transition-all cursor-pointer block bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoSelect}
                      className="hidden"
                      disabled={selectedVideos.length >= 2}
                    />
                    <Upload className="h-10 w-10 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300">Click to upload video</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">MP4, MOV, AVI up to 50MB each (Max 2 videos)</p>
                  </label>
                )}

                {/* Video Previews */}
                {videoPreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Uploaded Videos ({videoPreviews.length}/2)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {videoPreviews.map((video, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <video 
                            src={video.url}
                            controls
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md bg-black"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {video.name}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="glass bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">📋 What happens next?</h4>
              <ol className="space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  <span className="text-gray-700 dark:text-gray-300">Your complaint is submitted to our system</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <span className="text-gray-700 dark:text-gray-300">AI analyzes and assigns priority (High, Medium, Low)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <span className="text-gray-700 dark:text-gray-300">Staff receives the complaint for review</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <span className="text-gray-700 dark:text-gray-300">You'll receive notifications on status updates</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                  <span className="text-gray-700 dark:text-gray-300">Track your complaint progress anytime</span>
                </li>
              </ol>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Submit Complaint
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="card p-4 inline-block">
            <p className="text-gray-600 dark:text-gray-400">
              Need immediate assistance? Call Railway Helpline:{' '}
              <a href="tel:139" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xl">139</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitComplaint;
