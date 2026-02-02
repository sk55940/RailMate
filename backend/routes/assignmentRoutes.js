import express from 'express';
import {
  assignComplaint,
  getStaffAssignments,
  getAllAssignments,
  updateAssignment,
  reassignComplaint,
  getAssignmentById,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All assignment routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/assignments
 * @desc    Assign complaint to staff
 * @access  Private (Admin)
 */
router.post('/', authorizeRoles('admin'), assignComplaint);

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments
 * @access  Private (Admin)
 */
router.get('/', authorizeRoles('admin'), getAllAssignments);

/**
 * @route   GET /api/assignments/staff/:staffId
 * @desc    Get assignments for a staff member
 * @access  Private (Staff viewing own, Admin viewing any)
 */
router.get('/staff/:staffId', authorizeRoles('staff', 'admin'), getStaffAssignments);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private (Staff, Admin)
 */
router.get('/:id', authorizeRoles('staff', 'admin'), getAssignmentById);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment status
 * @access  Private (Staff, Admin)
 */
router.put('/:id', authorizeRoles('staff', 'admin'), updateAssignment);

/**
 * @route   PUT /api/assignments/:id/reassign
 * @desc    Reassign complaint to different staff
 * @access  Private (Admin)
 */
router.put('/:id/reassign', authorizeRoles('admin'), reassignComplaint);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Admin)
 */
router.delete('/:id', authorizeRoles('admin'), deleteAssignment);

export default router;
