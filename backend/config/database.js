import mongoose from 'mongoose';

// Cache the database connection for serverless environments
let isConnected = false;

/**
 * Connect to MongoDB Atlas
 * Optimized for serverless environments (Vercel)
 */
const connectDB = async () => {
  // If already connected, reuse the connection
  if (isConnected) {
    console.log('💡 Using existing MongoDB connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // but included for compatibility
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In serverless, we should throw the error instead of exiting
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err}`);
  isConnected = false;
});

export default connectDB;
