import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkAndFixStaff = async () => {
  try {
    await connectDB();
    
    console.log('\n📋 Checking staff users...\n');
    
    // Find all staff users
    const allStaff = await User.find({ role: 'staff' });
    console.log(`Total staff users found: ${allStaff.length}`);
    
    if (allStaff.length === 0) {
      console.log('❌ No staff users found in database!');
      process.exit(0);
    }
    
    // Show all staff with their isActive status
    console.log('\nStaff users:');
    allStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.email})`);
      console.log(`   - Role: ${staff.role}`);
      console.log(`   - isActive: ${staff.isActive}`);
      console.log(`   - ClerkId: ${staff.clerkId || 'N/A'}`);
      console.log('');
    });
    
    // Find active staff
    const activeStaff = await User.find({ role: 'staff', isActive: true });
    console.log(`\n✅ Active staff count: ${activeStaff.length}`);
    
    // If there are staff but none active, activate them all
    if (allStaff.length > 0 && activeStaff.length === 0) {
      console.log('\n⚠️  Found staff but none are active. Activating all staff...');
      
      const result = await User.updateMany(
        { role: 'staff' },
        { $set: { isActive: true } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} staff users to active status`);
      
      // Verify
      const verifyActive = await User.find({ role: 'staff', isActive: true });
      console.log(`\n✅ Now ${verifyActive.length} active staff members`);
      verifyActive.forEach((staff, index) => {
        console.log(`   ${index + 1}. ${staff.name} (${staff.email})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAndFixStaff();
