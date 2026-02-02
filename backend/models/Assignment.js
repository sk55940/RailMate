import mongoose from 'mongoose';

/**
 * Assignment Schema
 * Tracks complaint assignments to staff members
 */
const assignmentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Assigned', 'In-Progress', 'Completed'],
      default: 'Assigned',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
assignmentSchema.index({ staffId: 1, status: 1 });
assignmentSchema.index({ complaintId: 1 });

// Pre-save middleware to update completedAt
assignmentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
