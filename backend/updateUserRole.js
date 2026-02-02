import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

/**
 * Quick Script to Update User Roles
 * Run: node updateUserRole.js <email> <role>
 * Example: node updateUserRole.js user@test.com admin
 */

const updateUserRole = async () => {
  try {
    const email = process.argv[2];
    const role = process.argv[3];

    if (!email || !role) {
      console.log('❌ Usage: node updateUserRole.js <email> <role>');
      console.log('   Example: node updateUserRole.js admin@test.com admin');
      console.log('\n   Available roles: passenger, staff, admin');
      process.exit(1);
    }

    if (!['passenger', 'staff', 'admin'].includes(role)) {
      console.log('❌ Invalid role. Use: passenger, staff, or admin');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Find and update user
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('   Make sure the user has signed up first!');
      process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log('✅ User role updated successfully!');
    console.log('─────────────────────────────────────────────');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log('─────────────────────────────────────────────');
    console.log('\n⚠️  User must sign out and sign in again to see changes');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
    process.exit(1);
  }
};

updateUserRole();
