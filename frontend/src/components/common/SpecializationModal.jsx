import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, CheckCircle } from 'lucide-react';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const SpecializationModal = ({ isOpen, onClose, onUpdate, isFirstTime = false }) => {
  const [formData, setFormData] = useState({
    specialization: '',
    expertise: [],
  });
  const [loading, setLoading] = useState(false);

  const specializationOptions = [
    'TTE',
    'Coach Attendant',
    'Pantry Staff',
    'Security',
    'Cleaning',
    'Technical',
    'Medical',
    'General'
  ];

  const expertiseOptions = [
    'Train-related',
    'Station-related',
    'Staff-related',
    'Cleanliness',
    'Safety',
    'Ticketing',
    'Facilities',
    'Other'
  ];

  const handleExpertiseToggle = (expertise) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.specialization) {
      toast.error('Please select a specialization');
      return;
    }

    if (formData.expertise.length === 0) {
      toast.error('Please select at least one expertise area');
      return;
    }

    try {
      setLoading(true);
      await userAPI.updateProfile({
        specialization: formData.specialization,
        expertise: formData.expertise
      });
      toast.success('Profile updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isFirstTime ? 'Welcome! Set Up Your Profile' : 'Update Specialization'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isFirstTime 
                    ? 'Please provide your specialization and expertise to get started'
                    : 'Update your specialization and expertise areas'
                  }
                </p>
              </div>
            </div>
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            )}
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Specialization */}
              <div>
                <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Your Specialization <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setFormData({ ...formData, specialization: spec })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.specialization === spec
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                    >
                      <span className="font-medium text-sm">{spec}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Expertise Areas <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    (Select all that apply)
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expertiseOptions.map((exp) => (
                    <label
                      key={exp}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.expertise.includes(exp)
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.expertise.includes(exp)}
                        onChange={() => handleExpertiseToggle(exp)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {exp}
                      </span>
                      {formData.expertise.includes(exp) && (
                        <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {!isFirstTime && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Saving...' : isFirstTime ? 'Get Started' : 'Update Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SpecializationModal;
