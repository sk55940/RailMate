import Notification from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * @desc    Get notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.readStatus = false;
    }

    // Get total count
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, readStatus: false });

    // Get notifications
    const notifications = await Notification.find(query)
      .populate('complaintId', 'title status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return successResponse(res, {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    notification.readStatus = true;
    await notification.save();

    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse(res, 'Failed to update notification', 500);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { readStatus: true }
    );

    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all as read error:', error);
    return errorResponse(res, 'Failed to update notifications', 500);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    await notification.deleteOne();

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, 'Failed to delete notification', 500);
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
export const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      readStatus: true,
    });

    return successResponse(res, { deletedCount: result.deletedCount }, 'Read notifications cleared');
  } catch (error) {
    console.error('Clear notifications error:', error);
    return errorResponse(res, 'Failed to clear notifications', 500);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    console.log('[NOTIFICATIONS] Getting unread count for user:', req.user._id, 'Clerk ID:', req.user.clerkId, 'Email:', req.user.email);
    const count = await Notification.countDocuments({
      userId: req.user._id,
      readStatus: false,
    });
    console.log('Unread count:', count);

    return successResponse(res, { count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return errorResponse(res, 'Failed to fetch unread count', 500);
  }
};

/**
 * @desc    Create notification (Admin only)
 * @route   POST /api/notifications
 * @access  Private (Admin)
 */
export const createNotification = async (req, res) => {
  try {
    const { userId, type, message, complaintId } = req.body;

    if (!userId || !type || !message) {
      return errorResponse(res, 'User ID, type, and message are required', 400);
    }

    const notification = await Notification.create({
      userId,
      type,
      message,
      complaintId,
    });

    return successResponse(res, notification, 'Notification created successfully', 201);
  } catch (error) {
    console.error('Create notification error:', error);
    return errorResponse(res, 'Failed to create notification', 500);
  }
};
