import mongoose from 'mongoose';

const trainSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  trainName: {
    type: String,
    required: true,
    trim: true,
  },
  route: {
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    stops: [String], // Intermediate stations
  },
  schedule: {
    departureTime: String,
    arrivalTime: String,
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Alternate Days'],
      default: 'Daily',
    },
    activeDays: [String], // ['Monday', 'Tuesday', etc.]
  },
  type: {
    type: String,
    enum: ['Express', 'Superfast', 'Local', 'Mail', 'Special'],
    default: 'Express',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Cancelled'],
    default: 'Active',
  },
  assignedStaff: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String, // 'TTE', 'Coach Attendant', 'Pantry Staff', etc.
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  }],
  facilities: [String], // ['AC', 'Sleeper', 'Pantry', 'WiFi', etc.]
  totalCoaches: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for faster searches
trainSchema.index({ trainNumber: 1 });
trainSchema.index({ status: 1 });
trainSchema.index({ 'route.origin': 1, 'route.destination': 1 });

export default mongoose.model('Train', trainSchema);
