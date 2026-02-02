import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../backend/config/database.js';
import { errorHandler, notFound } from '../backend/middleware/errorHandler.js';

// Import routes
import complaintRoutes from '../backend/routes/complaintRoutes.js';
import userRoutes from '../backend/routes/userRoutes.js';
import assignmentRoutes from '../backend/routes/assignmentRoutes.js';
import notificationRoutes from '../backend/routes/notificationRoutes.js';
import chatbotRoutes from '../backend/routes/chatbotRoutes.js';
import trainRoutes from '../backend/routes/trainRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RailMate API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/trains', trainRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚂 Welcome to RailMate API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;

