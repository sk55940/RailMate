import mongoose from 'mongoose';

/**
 * Notification Schema
 * Stores notifications for users about complaint updates
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    type: {
      type: String,
      enum: [
        'complaint_submitted',
        'status_updated',
        'complaint_assigned',
        'remark_added',
        'complaint_resolved',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, readStatus: 1, createdAt: -1 });
notificationSchema.index({ complaintId: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.readStatus = true;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (userId, type, message, complaintId = null, metadata = {}) {
  return this.create({
    userId,
    type,
    message,
    complaintId,
    metadata,
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
