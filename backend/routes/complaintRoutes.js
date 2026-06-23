import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  addRemark,
  updateComplaint,
  deleteComplaint,
  getComplaintStats,
  getAIInsights,
} from '../controllers/complaintController.js';
import upload from '../middleware/upload.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public routes (none)

// Protected routes - All complaint routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/complaints/stats
 * @desc    Get complaint statistics
 * @access  Private (Staff, Admin)
 */
router.get('/stats', authorizeRoles('staff', 'admin'), getComplaintStats);

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints (filtered by role)
 * @access  Private
 */
router.get('/', getComplaints);

/**
 * @route   POST /api/complaints
 * @desc    Create new complaint
 * @access  Private (Passenger)
 */
router.post('/', upload.fields([
  { name: 'images', maxCount: 3 },
  { name: 'videos', maxCount: 2 }
]), createComplaint);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint
 * @access  Private
 */
router.get('/:id', getComplaintById);

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint
 * @access  Private (Owner or Admin)
 */
router.put('/:id', updateComplaint);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete complaint
 * @access  Private (Admin only)
 */
router.delete('/:id', authorizeRoles('admin'), deleteComplaint);

/**
 * @route   PUT /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Staff, Admin)
 */
router.put('/:id/status', authorizeRoles('staff', 'admin'), upload.single('proofOfWork'), updateComplaintStatus);

/**
 * @route   POST /api/complaints/:id/remarks
 * @desc    Add remark to complaint
 * @access  Private (Staff, Admin)
 */
router.post('/:id/remarks', authorizeRoles('staff', 'admin'), addRemark);

/**
 * @route   GET /api/complaints/:id/ai-insights
 * @desc    Get AI insights for complaint
 * @access  Private (Staff, Admin)
 */
router.get('/:id/ai-insights', authorizeRoles('staff', 'admin'), getAIInsights);

export default router;
