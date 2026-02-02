import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Train from './models/Train.js';
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

const trainData = [
  {
    trainNumber: '12345',
    trainName: 'Mumbai Rajdhani Express',
    route: {
      origin: 'Mumbai Central',
      destination: 'New Delhi',
      stops: ['Vadodara', 'Ratlam', 'Kota', 'Jaipur']
    },
    schedule: {
      departureTime: '16:55',
      arrivalTime: '08:35',
      frequency: 'Daily'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'WiFi', 'Charging Points', 'Reading Light'],
    totalCoaches: 18
  },
  {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani',
    route: {
      origin: 'Mumbai Central',
      destination: 'New Delhi',
      stops: ['Vadodara', 'Ahmedabad', 'Jaipur']
    },
    schedule: {
      departureTime: '17:10',
      arrivalTime: '09:10',
      frequency: 'Daily'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'WiFi', 'Charging Points'],
    totalCoaches: 20
  },
  {
    trainNumber: '12261',
    trainName: 'Duronto Express',
    route: {
      origin: 'Sealdah',
      destination: 'New Delhi',
      stops: ['Asansol', 'Gaya', 'Kanpur']
    },
    schedule: {
      departureTime: '19:50',
      arrivalTime: '09:55',
      frequency: 'Daily'
    },
    type: 'Express',
    status: 'Active',
    facilities: ['AC', 'Sleeper', 'Pantry', 'Charging Points'],
    totalCoaches: 16
  },
  {
    trainNumber: '12430',
    trainName: 'Lucknow Shatabdi',
    route: {
      origin: 'New Delhi',
      destination: 'Lucknow',
      stops: ['Ghaziabad', 'Aligarh', 'Kanpur']
    },
    schedule: {
      departureTime: '06:10',
      arrivalTime: '12:45',
      frequency: 'Daily'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'WiFi', 'Charging Points', 'Reading Light'],
    totalCoaches: 12
  },
  {
    trainNumber: '12626',
    trainName: 'Karnataka Express',
    route: {
      origin: 'Bangalore',
      destination: 'New Delhi',
      stops: ['Tumkur', 'Pune', 'Nagpur', 'Bhopal', 'Jhansi', 'Agra']
    },
    schedule: {
      departureTime: '20:40',
      arrivalTime: '06:30',
      frequency: 'Daily'
    },
    type: 'Express',
    status: 'Active',
    facilities: ['AC', 'Sleeper', 'Pantry', 'Charging Points'],
    totalCoaches: 24
  },
  {
    trainNumber: '12302',
    trainName: 'Howrah Rajdhani',
    route: {
      origin: 'Howrah',
      destination: 'New Delhi',
      stops: ['Dhanbad', 'Gaya', 'Mughal Sarai', 'Allahabad', 'Kanpur']
    },
    schedule: {
      departureTime: '16:55',
      arrivalTime: '09:55',
      frequency: 'Daily'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'WiFi', 'Charging Points', 'Reading Light'],
    totalCoaches: 19
  },
  {
    trainNumber: '12218',
    trainName: 'Kerela Sampark Kranti',
    route: {
      origin: 'Trivandrum',
      destination: 'New Delhi',
      stops: ['Ernakulam', 'Kozhikode', 'Mangalore', 'Goa', 'Pune', 'Vadodara']
    },
    schedule: {
      departureTime: '10:20',
      arrivalTime: '05:40',
      frequency: 'Daily'
    },
    type: 'Express',
    status: 'Active',
    facilities: ['AC', 'Sleeper', 'Pantry', 'Charging Points'],
    totalCoaches: 22
  },
  {
    trainNumber: '12424',
    trainName: 'Dibrugarh Rajdhani',
    route: {
      origin: 'Dibrugarh',
      destination: 'New Delhi',
      stops: ['Guwahati', 'New Jalpaiguri', 'Malda', 'Patna', 'Kanpur']
    },
    schedule: {
      departureTime: '15:05',
      arrivalTime: '10:50',
      frequency: 'Alternate Days'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'Charging Points', 'Reading Light'],
    totalCoaches: 17
  },
  {
    trainNumber: '12009',
    trainName: 'Mumbai Shatabdi',
    route: {
      origin: 'Mumbai Central',
      destination: 'Ahmedabad',
      stops: ['Vapi', 'Surat', 'Bharuch', 'Vadodara']
    },
    schedule: {
      departureTime: '06:25',
      arrivalTime: '13:20',
      frequency: 'Daily'
    },
    type: 'Superfast',
    status: 'Active',
    facilities: ['AC', 'Pantry', 'WiFi', 'Charging Points', 'Reading Light'],
    totalCoaches: 14
  },
  {
    trainNumber: '12801',
    trainName: 'Purushottam Express',
    route: {
      origin: 'Puri',
      destination: 'New Delhi',
      stops: ['Bhubaneswar', 'Kharagpur', 'Tatanagar', 'Dhanbad', 'Kanpur']
    },
    schedule: {
      departureTime: '20:20',
      arrivalTime: '06:00',
      frequency: 'Daily'
    },
    type: 'Mail',
    status: 'Active',
    facilities: ['AC', 'Sleeper', 'Pantry', 'Charging Points'],
    totalCoaches: 20
  }
];

const seedTrains = async () => {
  try {
    await connectDB();
    
    // Get admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing trains
    await Train.deleteMany({});
    console.log('Existing trains cleared');

    // Add createdBy field to each train
    const trainsWithCreator = trainData.map(train => ({
      ...train,
      createdBy: adminUser._id
    }));

    // Insert trains
    const trains = await Train.insertMany(trainsWithCreator);
    console.log(`✅ Successfully seeded ${trains.length} trains!`);

    trains.forEach(train => {
      console.log(`   - ${train.trainNumber}: ${train.trainName} (${train.route.origin} → ${train.route.destination})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding trains:', error);
    process.exit(1);
  }
};

seedTrains();
