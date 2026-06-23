import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './backend/.env' });

const staffMembers = [
  {
    clerkId: 'staff_1',
    email: 'staff1@railmate.com',
    name: 'Amit Kumar',
    role: 'staff',
    specialization: 'TTE',
    expertise: ['Ticketing', 'Staff-related'],
    phone: '9876543210'
  },
  {
    clerkId: 'staff_2',
    email: 'staff2@railmate.com',
    name: 'Suresh Raina',
    role: 'staff',
    specialization: 'Cleaning',
    expertise: ['Cleanliness', 'Facilities'],
    phone: '9876543211'
  },
  {
    clerkId: 'staff_3',
    email: 'staff3@railmate.com',
    name: 'Priya Singh',
    role: 'staff',
    specialization: 'Technical',
    expertise: ['Train-related', 'Facilities'],
    phone: '9876543212'
  },
  {
    clerkId: 'staff_4',
    email: 'staff4@railmate.com',
    name: 'Rahul Dravid',
    role: 'staff',
    specialization: 'Security',
    expertise: ['Safety', 'Other'],
    phone: '9876543213'
  },
  {
    clerkId: 'staff_5',
    email: 'staff5@railmate.com',
    name: 'Vikram Batra',
    role: 'staff',
    specialization: 'Medical',
    expertise: ['Safety', 'Other'],
    phone: '9876543214'
  },
  {
    clerkId: 'staff_6',
    email: 'staff6@railmate.com',
    name: 'Sunita Williams',
    role: 'staff',
    specialization: 'Pantry Staff',
    expertise: ['Facilities', 'Other'],
    phone: '9876543215'
  },
  {
    clerkId: 'staff_7',
    email: 'staff7@railmate.com',
    name: 'Rohan Sharma',
    role: 'staff',
    specialization: 'Coach Attendant',
    expertise: ['Cleanliness', 'Facilities'],
    phone: '9876543216'
  },
  {
    clerkId: 'staff_8',
    email: 'staff8@railmate.com',
    name: 'Anjali Gupta',
    role: 'staff',
    specialization: 'General',
    expertise: ['Other'],
    phone: '9876543217'
  },
  {
    clerkId: 'staff_9',
    email: 'staff9@railmate.com',
    name: 'Manish Pandey',
    role: 'staff',
    specialization: 'Technical',
    expertise: ['Train-related', 'Facilities'],
    phone: '9876543218'
  },
  {
    clerkId: 'staff_10',
    email: 'staff10@railmate.com',
    name: 'Deepa Karmakar',
    role: 'staff',
    specialization: 'Cleaning',
    expertise: ['Cleanliness'],
    phone: '9876543219'
  }
];

const seedStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const staff of staffMembers) {
      await User.findOneAndUpdate(
        { clerkId: staff.clerkId },
        staff,
        { upsert: true, new: true }
      );
    }

    console.log('10 Staff members seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedStaff();
