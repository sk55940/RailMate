import express from 'express';
import * as chatbotController from '../controllers/chatbotController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Passenger chatbot
router.post('/passenger', authenticateUser, chatbotController.passengerChat);

// Admin chatbot
router.post('/admin', authenticateUser, authorizeRoles('admin'), chatbotController.adminChat);

// Staff chatbot
router.post('/staff', authenticateUser, authorizeRoles('staff', 'admin'), chatbotController.staffChat);

// Image analysis
router.post('/analyze-image', authenticateUser, chatbotController.analyzeImage);

// Smart assignment suggestion
router.get('/suggest-assignment/:complaintId', authenticateUser, authorizeRoles('admin'), chatbotController.suggestAssignment);

// Predictive analytics
router.get('/predict-resolution/:complaintId', authenticateUser, authorizeRoles('admin', 'staff'), chatbotController.predictResolution);

export default router;
