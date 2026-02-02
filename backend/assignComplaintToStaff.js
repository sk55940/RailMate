import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import User from './models/User.js';

dotenv.config();

const assignComplaintToStaff = async (complaintId, staffEmail) => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the staff user
    const staff = await User.findOne({ email: staffEmail, role: 'staff' });
    if (!staff) {
      console.log('❌ Staff user not found with email:', staffEmail);
      console.log('Make sure the user exists and has staff role');
      process.exit(1);
    }

    console.log(`✅ Found staff: ${staff.name} (${staff.email})`);

    // Find the complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.log('❌ Complaint not found with ID:', complaintId);
      process.exit(1);
    }

    console.log(`✅ Found complaint: ${complaint.title}`);

    // Assign the complaint
    complaint.assignedTo = staff._id;
    complaint.status = 'In-Progress';
    
    if (!complaint.statusHistory) {
      complaint.statusHistory = [];
    }
    
    complaint.statusHistory.push({
      status: 'In-Progress',
      timestamp: new Date(),
      updatedBy: staff._id,
      remarks: 'Complaint assigned to staff member'
    });

    await complaint.save();

    console.log('\n🎉 Successfully assigned complaint!');
    console.log(`   Complaint: ${complaint.title}`);
    console.log(`   Assigned to: ${staff.name}`);
    console.log(`   Status: ${complaint.status}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Get command line arguments
const complaintId = process.argv[2];
const staffEmail = process.argv[3];

if (!complaintId || !staffEmail) {
  console.log('Usage: node assignComplaintToStaff.js <complaintId> <staffEmail>');
  console.log('Example: node assignComplaintToStaff.js 697cc20f5e825a4ba6eceb5f vishu029saini@gmail.com');
  process.exit(1);
}

assignComplaintToStaff(complaintId, staffEmail);
