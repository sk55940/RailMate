import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import User from './models/User.js';

dotenv.config();

const assignDummyComplaints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a staff member
    const staff = await User.findOne({ role: 'staff' });
    
    if (!staff) {
      console.log('No staff member found. Please create a staff user first.');
      process.exit(1);
    }

    console.log('Found staff:', staff.name, staff.email);

    // Get some unassigned complaints
    const unassignedComplaints = await Complaint.find({ 
      assignedTo: { $exists: false } 
    }).limit(2);

    console.log(`Found ${unassignedComplaints.length} unassigned complaints`);

    // Assign them to the staff
    for (const complaint of unassignedComplaints) {
      complaint.assignedTo = staff._id;
      if (complaint.status === 'Pending') {
        complaint.status = 'In-Progress';
      }
      await complaint.save();
      console.log(`✓ Assigned complaint "${complaint.title}" to ${staff.name}`);
    }

    console.log('\nDone! Staff now has', unassignedComplaints.length, 'assigned complaints.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

assignDummyComplaints();
