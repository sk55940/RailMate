import express from 'express';
import {
  getCurrentUser,
  updateCurrentUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getStaffMembers,
  getUserStats,
  syncUserFromClerk,
} from '../controllers/userController.js';
import { authenticateUser, authorizeRoles, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/users/sync
 * @desc    Sync user from Clerk (public for webhooks)
 * @access  Public
 */
router.post('/sync', syncUserFromClerk);

// Protected routes - All user routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', updateCurrentUser);

/**
 * @route   GET /api/users/me/stats
 * @desc    Get current user statistics
 * @access  Private
 */
router.get('/me/stats', getUserStats);

/**
 * @route   GET /api/users/staff
 * @desc    Get all staff members
 * @access  Private (Admin)
 */
router.get('/staff/list', authorizeRoles('admin'), getStaffMembers);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/', authorizeRoles('admin'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put('/:id/role', authorizeRoles('admin'), updateUserRole);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.put('/:id/toggle-status', authorizeRoles('admin'), toggleUserStatus);

export default router;
