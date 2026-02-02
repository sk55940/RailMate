import Notification from '../models/Notification.js';

/**
 * Create notification utility
 * @param {String} userId - User to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} complaintId - Related complaint ID (optional)
 * @param {Object} metadata - Additional data (optional)
 */
export const createNotification = async (userId, type, title, message, complaintId = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      complaintId,
      metadata,
      readStatus: false,
    });

    console.log(`✓ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

/**
 * Create multiple notifications at once
 */
export const createBulkNotifications = async (notifications) => {
  try {
    const created = await Notification.insertMany(notifications);
    console.log(`✓ ${created.length} notifications created`);
    return created;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    return [];
  }
};

/**
 * Notify user about new complaint (for admin/staff)
 */
export const notifyNewComplaint = async (adminIds, complaint) => {
  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    type: 'new_complaint',
    title: 'New Complaint Submitted',
    message: `New complaint "${complaint.title}" has been submitted`,
    complaintId: complaint._id,
    readStatus: false,
  }));

  return createBulkNotifications(notifications);
};

/**
 * Notify passenger about status change
 */
export const notifyStatusChange = async (userId, complaint, oldStatus, newStatus) => {
  return createNotification(
    userId,
    'status_update',
    'Complaint Status Updated',
    `Your complaint "${complaint.title}" status changed from ${oldStatus} to ${newStatus}`,
    complaint._id,
    { oldStatus, newStatus }
  );
};

/**
 * Notify staff about assignment
 */
export const notifyAssignment = async (staffId, complaint, assignedBy) => {
  return createNotification(
    staffId,
    'assignment',
    'New Complaint Assigned',
    `You have been assigned to complaint "${complaint.title}"`,
    complaint._id,
    { assignedBy: assignedBy.name }
  );
};

/**
 * Notify passenger about resolution
 */
export const notifyResolution = async (userId, complaint) => {
  return createNotification(
    userId,
    'resolution',
    'Complaint Resolved',
    `Your complaint "${complaint.title}" has been resolved`,
    complaint._id
  );
};

/**
 * Notify about new remark/comment
 */
export const notifyNewRemark = async (userId, complaint, remarkBy) => {
  return createNotification(
    userId,
    'remark',
    'New Comment on Your Complaint',
    `${remarkBy.name} added a comment to your complaint "${complaint.title}"`,
    complaint._id,
    { addedBy: remarkBy.name }
  );
};
