import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user with backend
  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && clerkUser) {
        try {
          // Sync user with backend
          await userAPI.syncFromClerk({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          });

          // Get full user profile from backend
          const response = await userAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to sync user:', error);
          toast.error('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        setUser(null);
        setLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, isLoaded, isSignedIn]);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Update user profile
  const updateProfile = async (data) => {
    try {
      const response = await userAPI.updateCurrentUser(data);
      setUser(response.data);
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    clerkUser,
    isLoaded,
    isSignedIn,
    loading,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
