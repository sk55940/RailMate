import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import User from './models/User.js';

dotenv.config();

const seedAITrainingData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get a passenger to use as creator
    let passenger = await User.findOne({ role: 'passenger' });
    
    if (!passenger) {
      console.log('Creating system user for historical data...');
      passenger = await User.create({
        clerkId: 'historical_' + Date.now(),
        email: 'historical@system.com',
        name: 'Historical Data',
        role: 'passenger',
      });
    }

    // Create 16 resolved historical complaints for AI training
    const historicalData = [
      // Facilities (Food) - 5 cases
      { title: 'Stale food in pantry', category: 'Facilities', priority: 'Medium', locationType: 'Train', trainNumber: '12301', sentiment: 'Negative', hoursToResolve: 24 },
      { title: 'Unhygienic food preparation', category: 'Facilities', priority: 'High', locationType: 'Train', trainNumber: '12303', sentiment: 'Frustrated', hoursToResolve: 18 },
      { title: 'Poor quality meal served', category: 'Facilities', priority: 'Medium', locationType: 'Train', trainNumber: '12009', sentiment: 'Negative', hoursToResolve: 30 },
      { title: 'Food quality issue', category: 'Facilities', priority: 'Medium', locationType: 'Train', trainNumber: '12951', sentiment: 'Negative', hoursToResolve: 36 },
      { title: 'Contaminated food served', category: 'Facilities', priority: 'Critical', locationType: 'Train', trainNumber: '12302', sentiment: 'Frustrated', hoursToResolve: 12 },
      // Cleanliness - 4 cases
      { title: 'Dirty washroom', category: 'Cleanliness', priority: 'Medium', locationType: 'Train', trainNumber: '12009', sentiment: 'Negative', hoursToResolve: 2 },
      { title: 'Coach not cleaned', category: 'Cleanliness', priority: 'Low', locationType: 'Train', trainNumber: '12218', sentiment: 'Neutral', hoursToResolve: 4 },
      { title: 'Garbage not collected', category: 'Cleanliness', priority: 'Medium', locationType: 'Train', trainNumber: '12430', sentiment: 'Negative', hoursToResolve: 3 },
      { title: 'Platform unhygienic', category: 'Cleanliness', priority: 'Medium', locationType: 'Station', stationName: 'Mumbai Central', sentiment: 'Negative', hoursToResolve: 48 },
      // Safety - 3 cases
      { title: 'Broken window glass', category: 'Safety', priority: 'High', locationType: 'Train', trainNumber: '12009', sentiment: 'Frustrated', hoursToResolve: 20 },
      { title: 'Slippery platform', category: 'Safety', priority: 'High', locationType: 'Station', stationName: 'Delhi Junction', sentiment: 'Frustrated', hoursToResolve: 36 },
      { title: 'Door latch broken', category: 'Safety', priority: 'High', locationType: 'Train', trainNumber: '12951', sentiment: 'Frustrated', hoursToResolve: 24 },
      // Staff-related - 2 cases
      { title: 'Rude staff behavior', category: 'Staff-related', priority: 'Medium', locationType: 'Train', trainNumber: '12302', sentiment: 'Frustrated', hoursToResolve: 48 },
      { title: 'Staff not responding', category: 'Staff-related', priority: 'Low', locationType: 'Train', trainNumber: '12009', sentiment: 'Negative', hoursToResolve: 36 },
      // Ticketing - 2 cases
      { title: 'Wrong ticket issued', category: 'Ticketing', priority: 'Medium', locationType: 'Station', stationName: 'Mumbai Central', sentiment: 'Negative', hoursToResolve: 24 },
      { title: 'Refund not processed', category: 'Ticketing', priority: 'High', locationType: 'Station', stationName: 'Delhi Junction', sentiment: 'Frustrated', hoursToResolve: 72 },
    ];

    console.log('Creating AI training data...\n');
    
    for (const data of historicalData) {
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date in last 90 days
      const resolvedAt = new Date(createdAt.getTime() + data.hoursToResolve * 60 * 60 * 1000);
      
      await Complaint.create({
        userId: passenger._id,
        title: data.title,
        description: `Historical complaint for AI training: ${data.title}`,
        category: data.category,
        priority: data.priority,
        status: 'Resolved',
        locationType: data.locationType,
        trainNumber: data.trainNumber,
        stationName: data.stationName,
        sentiment: data.sentiment,
        createdAt: createdAt,
        resolvedAt: resolvedAt,
        isHistoricalData: true, // Mark as training data - won't appear in UI
      });
      
      console.log(`✓ ${data.title}`);
    }

    console.log(`\n✅ Created ${historicalData.length} historical complaints for AI training!`);
    console.log('📊 These will be used for AI analysis but won\'t appear in the UI.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

seedAITrainingData();
