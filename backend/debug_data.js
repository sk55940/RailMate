import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const total = await Complaint.countDocuments();
    console.log('Total Complaints:', total);

    const recent = await Complaint.find().sort({ createdAt: -1 }).limit(5);
    console.log('Recent 5 Complaints:');
    recent.forEach(c => {
      console.log(`- ${c.title} (Created: ${c.createdAt}, Status: ${c.status})`);
    });

    const historical = await Complaint.countDocuments({ isHistoricalData: true });
    console.log('Historical Complaints:', historical);

    const nonHistorical = await Complaint.countDocuments({ isHistoricalData: { $ne: true } });
    console.log('Non-Historical Complaints:', nonHistorical);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkData();
