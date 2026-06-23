import mongoose from 'mongoose';

/**
 * Complaint Schema
 * Stores railway complaints submitted by passengers
 */
const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: [
        'Train-related',
        'Station-related',
        'Staff-related',
        'Cleanliness',
        'Safety',
        'Ticketing',
        'Facilities',
        'Other',
      ],
      required: true,
    },
    locationType: {
      type: String,
      enum: ['Station', 'Train'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Resolved', 'Closed'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    attachmentURL: {
      type: String,
      trim: true,
    },
    // Media attachments
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    // AI-generated fields
    aiSummary: {
      type: String,
      maxlength: 500,
    },
    aiCategory: {
      type: String,
    },
    aiPriority: {
      type: String,
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', 'Frustrated'],
    },
    // Complaint details
    trainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Train',
      index: true,
    },
    trainNumber: {
      type: String,
      trim: true,
    },
    stationName: {
      type: String,
      trim: true,
    },
    pnrNumber: {
      type: String,
      trim: true,
    },
    dateOfIncident: {
      type: Date,
    },
    // Assignment details
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Resolution details
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    // Historical data flag (for AI training, not shown in UI)
    isHistoricalData: {
      type: Boolean,
      default: false,
      index: true,
    },
    remarks: [
      {
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Proof of work
    proofOfWork: {
      type: String, // URL to image/document
      trim: true,
    },
    proofOfWorkNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to update resolvedAt
complaintSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// Virtual for complaint age in days
complaintSchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to add remark
complaintSchema.methods.addRemark = function (userId, comment) {
  this.remarks.push({
    addedBy: userId,
    comment: comment,
    addedAt: new Date(),
  });
  return this.save();
};

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
