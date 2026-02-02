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

const updateStaffExpertise = async () => {
  try {
    await connectDB();
    
    console.log('\n📋 Updating staff with specialization and expertise...\n');
    
    const allStaff = await User.find({ role: 'staff' });
    
    if (allStaff.length === 0) {
      console.log('❌ No staff found!');
      process.exit(0);
    }

    // Update each staff with sample specialization and expertise
    const updates = [
      {
        email: 'vishu029saini@gmail.com',
        specialization: 'TTE',
        expertise: ['Ticketing', 'Train-related', 'Safety']
      },
      {
        email: 'staff@railmate.com',
        specialization: 'Coach Attendant',
        expertise: ['Cleanliness', 'Train-related', 'Facilities']
      },
      {
        email: 'staff2@railmate.com',
        specialization: 'Pantry Staff',
        expertise: ['Facilities', 'Train-related', 'Cleanliness']
      }
    ];

    for (const update of updates) {
      const result = await User.findOneAndUpdate(
        { email: update.email },
        { 
          $set: { 
            specialization: update.specialization,
            expertise: update.expertise
          }
        },
        { new: true }
      );
      
      if (result) {
        console.log(`✅ Updated: ${result.name}`);
        console.log(`   Specialization: ${result.specialization}`);
        console.log(`   Expertise: ${result.expertise.join(', ')}`);
        console.log('');
      }
    }

    console.log('✅ All staff updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateStaffExpertise();
