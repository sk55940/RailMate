import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    // Get Clerk session token
    if (window.Clerk) {
      try {
        const session = await window.Clerk.session;
        if (session) {
          const token = await session.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error('Error getting Clerk token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - redirect to sign in
      if (window.location.pathname !== '/') {
        window.location.href = '/sign-in';
      }
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Complaint API calls
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
  updateStatus: (id, data) => {
    const isFormData = data instanceof FormData;
    return api.put(`/complaints/${id}/status`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  addRemark: (id, comment) => api.post(`/complaints/${id}/remarks`, { comment }),
  getStats: (params) => api.get('/complaints/stats', { params }),
  getAIInsights: (id) => api.get(`/complaints/${id}/ai-insights`),
};

// User API calls
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (data) => api.put('/users/me', data),
  updateProfile: (data) => api.put('/users/me', data), // Alias for updateCurrentUser
  getStats: () => api.get('/users/me/stats'),
  getAllUsers: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  getStaff: () => api.get('/users/staff/list'),
  syncFromClerk: (data) => api.post('/users/sync', data),
};

// Assignment API calls
export const assignmentAPI = {
  create: (data) => api.post('/assignments', data),
  getAll: (params) => api.get('/assignments', { params }),
  getStaffAssignments: (staffId, params) => api.get(`/assignments/staff/${staffId}`, { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  reassign: (id, newStaffId, notes) => api.put(`/assignments/${id}/reassign`, { newStaffId, notes }),
  delete: (id) => api.delete(`/assignments/${id}`),
};

// Notification API calls
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
  create: (data) => api.post('/notifications', data),
};

// Train API calls
export const trainAPI = {
  getAll: (params) => api.get('/trains', { params }),
  getActive: () => api.get('/trains/active'),
  getById: (id) => api.get(`/trains/${id}`),
  create: (data) => api.post('/trains', data),
  update: (id, data) => api.put(`/trains/${id}`, data),
  delete: (id) => api.delete(`/trains/${id}`),
  assignStaff: (id, staffId) => api.post(`/trains/${id}/assign-staff`, { staffId }),
  removeStaff: (id, staffId) => api.delete(`/trains/${id}/staff/${staffId}`),
  getAvailableStaff: (complaintId) => api.get('/trains/available-staff', { params: { complaintId } }),
  getStats: () => api.get('/trains/stats'),
};

export default api;
