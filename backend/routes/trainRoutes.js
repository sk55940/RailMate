import express from 'express';
const router = express.Router();
import {
  getTrains,
  getActiveTrains,
  getTrain,
  createTrain,
  updateTrain,
  deleteTrain,
  assignStaff,
  removeStaff,
  getAvailableStaff,
  getTrainStats,
} from '../controllers/trainController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

// Public routes
router.get('/active', getActiveTrains);

// Protected routes
router.use(authenticateUser);

router.get('/', getTrains);
router.get('/stats', authorizeRoles('admin'), getTrainStats);
router.get('/available-staff', authorizeRoles('admin', 'staff'), getAvailableStaff);
router.get('/:id', getTrain);

// Admin only routes
router.post('/', authorizeRoles('admin'), createTrain);
router.put('/:id', authorizeRoles('admin'), updateTrain);
router.delete('/:id', authorizeRoles('admin'), deleteTrain);
router.post('/:id/assign-staff', authorizeRoles('admin'), assignStaff);
router.delete('/:id/staff/:staffId', authorizeRoles('admin'), removeStaff);

export default router;
