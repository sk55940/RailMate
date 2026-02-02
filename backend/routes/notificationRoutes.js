import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
  createNotification,
} from '../controllers/notificationController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user
 * @access  Private
 */
router.get('/', getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    Clear all read notifications
 * @access  Private
 */
router.delete('/clear-read', clearReadNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Create notification (Admin only)
 * @access  Private (Admin)
 */
router.post('/', authorizeRoles('admin'), createNotification);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

export default router;
