import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import User from './models/User.js';

dotenv.config();

/**
 * Clean complaints for real users (not dummy user)
 * This will delete all complaints except those belonging to dummy.passenger@railmate.internal
 */
const cleanUserComplaints = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the dummy passenger user ID
    const dummyUser = await User.findOne({ email: 'dummy.passenger@railmate.internal' });
    
    if (!dummyUser) {
      console.log('⚠️  No dummy user found. Cannot proceed.');
      process.exit(1);
    }

    console.log(`\n🔍 Found dummy user: ${dummyUser.email} (ID: ${dummyUser._id})`);

    // Count complaints before deletion
    const totalBefore = await Complaint.countDocuments();
    const dummyComplaints = await Complaint.countDocuments({ userId: dummyUser._id });
    const realUserComplaints = totalBefore - dummyComplaints;

    console.log(`\n📊 Current state:`);
    console.log(`   Total complaints: ${totalBefore}`);
    console.log(`   Dummy user complaints: ${dummyComplaints}`);
    console.log(`   Real user complaints: ${realUserComplaints}`);

    // Delete all complaints EXCEPT the dummy user's
    const result = await Complaint.deleteMany({ 
      userId: { $ne: dummyUser._id } 
    });

    console.log(`\n✅ Deleted ${result.deletedCount} complaints from real users`);
    
    const totalAfter = await Complaint.countDocuments();
    console.log(`\n📊 Final state:`);
    console.log(`   Total complaints: ${totalAfter}`);
    console.log(`   (All are dummy data for testing)`);

    console.log('\n🎉 Cleanup complete! Real users now have empty dashboards.');
    console.log('💡 Dummy data is preserved for admin/staff testing.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning complaints:', error);
    process.exit(1);
  }
};

cleanUserComplaints();
