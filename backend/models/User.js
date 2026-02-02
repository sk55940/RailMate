import mongoose from 'mongoose';

/**
 * User Schema
 * Stores user information synced with Clerk
 */
const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['passenger', 'staff', 'admin'],
      default: 'passenger',
    },
    // Staff-specific fields
    specialization: {
      type: String,
      enum: [
        'TTE',
        'Coach Attendant',
        'Pantry Staff',
        'Security',
        'Cleaning',
        'Technical',
        'Medical',
        'General'
      ],
    },
    expertise: [{
      type: String,
      enum: [
        'Train-related',
        'Station-related',
        'Staff-related',
        'Cleanliness',
        'Safety',
        'Ticketing',
        'Facilities',
        'Other'
      ]
    }],
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Index for faster queries (email already has unique index from schema)
userSchema.index({ role: 1 });
userSchema.index({ clerkId: 1 });

// Virtual for user's complaints
userSchema.virtual('complaints', {
  ref: 'Complaint',
  localField: '_id',
  foreignField: 'userId',
});

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
