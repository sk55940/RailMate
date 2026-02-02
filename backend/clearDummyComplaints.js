import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';

dotenv.config();

const clearDummyComplaints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count total complaints before deletion
    const totalBefore = await Complaint.countDocuments();
    console.log(`Total complaints before deletion: ${totalBefore}`);

    // Delete all complaints (or you can add a condition to keep certain ones)
    const result = await Complaint.deleteMany({});
    
    console.log(`✓ Deleted ${result.deletedCount} complaints`);
    console.log('Database cleaned! Now staff will only see complaints assigned to them.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearDummyComplaints();
