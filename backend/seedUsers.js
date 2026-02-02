import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

/**
 * Seed Script to Create Admin and Staff Users
 * Run: node seedUsers.js
 */

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Users to create
    const users = [
      {
        clerkId: 'admin_test_001',
        email: 'admin@railmate.com',
        name: 'Admin User',
        role: 'admin',
      },
      {
        clerkId: 'staff_test_001',
        email: 'staff@railmate.com',
        name: 'Staff Member',
        role: 'staff',
      },
      {
        clerkId: 'staff_test_002',
        email: 'staff2@railmate.com',
        name: 'Staff Member 2',
        role: 'staff',
      },
      {
        clerkId: 'dummy_passenger_seed',
        email: 'dummy.passenger@railmate.internal',
        name: 'Seed Data User',
        role: 'passenger',
      },
    ];

    // Check if users already exist and create/update
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update existing user
        existingUser.role = userData.role;
        existingUser.name = userData.name;
        await existingUser.save();
        console.log(`✅ Updated existing user: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        await User.create(userData);
        console.log(`✅ Created new user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📝 Test Accounts Created:');
    console.log('─────────────────────────────────────────────');
    console.log('ADMIN:');
    console.log('  Email: admin@railmate.com');
    console.log('  Role: admin');
    console.log('  Note: Sign up with this email in Clerk first\n');
    console.log('STAFF:');
    console.log('  Email: staff@railmate.com');
    console.log('  Role: staff');
    console.log('  Note: Sign up with this email in Clerk first\n');
    console.log('STAFF 2:');
    console.log('  Email: staff2@railmate.com');
    console.log('  Role: staff');
    console.log('  Note: Sign up with this email in Clerk first\n');
    console.log('─────────────────────────────────────────────');
    console.log('\n⚠️  IMPORTANT STEPS:');
    console.log('1. Go to http://localhost:3000/sign-up');
    console.log('2. Sign up with the above emails (create passwords via Clerk)');
    console.log('3. After signup, run this script again to update roles');
    console.log('4. Sign in again to see the admin/staff dashboards');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

// Run the seed function
seedUsers();
