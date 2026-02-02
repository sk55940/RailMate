import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import User from './models/User.js';

dotenv.config();

const historicalComplaints = [
  // Cleanliness complaints (resolved)
  {
    title: 'Dirty washroom at Platform 3',
    description: 'Washroom facilities are unhygienic and need immediate cleaning',
    category: 'Cleanliness',
    priority: 'High',
    status: 'Resolved',
    station: 'New Delhi',
    hoursToResolve: 4
  },
  {
    title: 'Garbage accumulation near ticket counter',
    description: 'Large pile of garbage causing health hazard',
    category: 'Cleanliness',
    priority: 'Medium',
    status: 'Resolved',
    station: 'Mumbai Central',
    hoursToResolve: 6
  },
  {
    title: 'Dirty seats in waiting room',
    description: 'Seats are not cleaned properly',
    category: 'Cleanliness',
    priority: 'Low',
    status: 'Resolved',
    station: 'Bangalore City',
    hoursToResolve: 8
  },
  {
    title: 'Platform needs cleaning',
    description: 'Platform 1 has food waste scattered around',
    category: 'Cleanliness',
    priority: 'Medium',
    status: 'Resolved',
    station: 'Chennai Central',
    hoursToResolve: 5
  },
  {
    title: 'Overflowing dustbin',
    description: 'Dustbin near entrance is overflowing',
    category: 'Cleanliness',
    priority: 'Medium',
    status: 'Resolved',
    station: 'Kolkata',
    hoursToResolve: 3
  },

  // Station-related complaints (Infrastructure - resolved)
  {
    title: 'Broken escalator',
    description: 'Escalator on platform 2 not working',
    category: 'Station-related',
    priority: 'High',
    status: 'Resolved',
    station: 'New Delhi',
    hoursToResolve: 48
  },
  {
    title: 'Leaking roof in waiting area',
    description: 'Water dripping from ceiling during rain',
    category: 'Station-related',
    priority: 'High',
    status: 'Resolved',
    station: 'Mumbai Central',
    hoursToResolve: 72
  },
  {
    title: 'Damaged bench',
    description: 'Broken bench near platform 4',
    category: 'Station-related',
    priority: 'Low',
    status: 'Resolved',
    station: 'Pune',
    hoursToResolve: 24
  },
  {
    title: 'Non-functional water cooler',
    description: 'Water cooler not dispensing water',
    category: 'Station-related',
    priority: 'Medium',
    status: 'Resolved',
    station: 'Ahmedabad',
    hoursToResolve: 12
  },

  // Safety complaints (resolved)
  {
    title: 'Broken railing',
    description: 'Railing on stairs is broken, safety hazard',
    category: 'Safety',
    priority: 'Critical',
    status: 'Resolved',
    station: 'Delhi',
    hoursToResolve: 6
  },
  {
    title: 'Poor lighting on platform',
    description: 'Several lights not working, dark areas present',
    category: 'Safety',
    priority: 'High',
    status: 'Resolved',
    station: 'Jaipur',
    hoursToResolve: 10
  },
  {
    title: 'Slippery floor',
    description: 'Floor near entrance is very slippery',
    category: 'Safety',
    priority: 'High',
    status: 'Resolved',
    station: 'Lucknow',
    hoursToResolve: 8
  },

  // Staff-related complaints (resolved)
  {
    title: 'Rude ticket counter staff',
    description: 'Staff member was unhelpful and rude',
    category: 'Staff-related',
    priority: 'Medium',
    status: 'Resolved',
    station: 'Bangalore',
    hoursToResolve: 16
  },
  {
    title: 'Staff not present at help desk',
    description: 'No staff available at information counter',
    category: 'Staff-related',
    priority: 'Low',
    status: 'Resolved',
    station: 'Hyderabad',
    hoursToResolve: 12
  },

  // Facilities (resolved)
  {
    title: 'AC not working in waiting room',
    description: 'Air conditioning not functional, very hot',
    category: 'Facilities',
    priority: 'High',
    status: 'Resolved',
    station: 'Chennai',
    hoursToResolve: 20
  },
  {
    title: 'WiFi not working',
    description: 'Free WiFi service not connecting',
    category: 'Facilities',
    priority: 'Low',
    status: 'Resolved',
    station: 'Mumbai',
    hoursToResolve: 24
  }
];

const seedHistoricalData = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create a dedicated dummy passenger user for seed data
    let passenger = await User.findOne({ email: 'dummy.passenger@railmate.internal' });
    if (!passenger) {
      console.log('⚠️  No dummy passenger found. Creating one...');
      passenger = await User.create({
        clerkId: 'dummy_passenger_seed',
        email: 'dummy.passenger@railmate.internal',
        name: 'Seed Data User',
        role: 'passenger',
      });
      console.log('✅ Created dummy passenger for seed data');
    } else {
      console.log('✅ Using existing dummy passenger for seed data');
    }

    // Get staff users for assignment
    const staffUsers = await User.find({ role: 'staff' });
    const staff = staffUsers.length > 0 ? staffUsers[0] : null;

    console.log(`\n📊 Creating ${historicalComplaints.length} historical complaints...\n`);

    let created = 0;
    for (const complaint of historicalComplaints) {
      const now = new Date();
      const resolvedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const createdAt = new Date(resolvedAt.getTime() - complaint.hoursToResolve * 60 * 60 * 1000);

      const complaintData = {
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        location: {
          station: complaint.station,
          area: 'Platform/Waiting Area'
        },
        userId: passenger._id,
        assignedTo: staff?._id,
        createdAt,
        updatedAt: resolvedAt,
        resolvedAt,
        statusHistory: [
          {
            status: 'Pending',
            timestamp: createdAt,
            updatedBy: passenger._id
          },
          {
            status: 'In Progress',
            timestamp: new Date(createdAt.getTime() + (complaint.hoursToResolve * 0.3 * 60 * 60 * 1000)),
            updatedBy: staff?._id
          },
          {
            status: 'Resolved',
            timestamp: resolvedAt,
            updatedBy: staff?._id,
            remarks: 'Issue resolved successfully'
          }
        ]
      };

      await Complaint.create(complaintData);
      created++;
      console.log(`✅ [${created}/${historicalComplaints.length}] ${complaint.category}: ${complaint.title.substring(0, 40)}...`);
    }

    console.log(`\n🎉 Successfully created ${created} historical complaints!`);
    console.log('\n📈 Summary by category:');
    const categories = await Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    categories.forEach(cat => console.log(`   ${cat._id}: ${cat.count} resolved`));

    console.log('\n✅ Historical data seeding complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedHistoricalData();
