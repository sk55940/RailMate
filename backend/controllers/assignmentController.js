import Assignment from '../models/Assignment.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import emailService from '../services/emailService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * @desc    Assign complaint to staff
 * @route   POST /api/assignments
 * @access  Private (Admin)
 */
export const assignComplaint = async (req, res) => {
  try {
    const { complaintId, staffId, notes } = req.body;

    if (!complaintId || !staffId) {
      return errorResponse(res, 'Complaint ID and Staff ID are required', 400);
    }

    // Check if complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    // Check if staff exists and is actually a staff member
    const staff = await User.findById(staffId);
    if (!staff) {
      return errorResponse(res, 'Staff member not found', 404);
    }

    if (staff.role !== 'staff') {
      return errorResponse(res, 'User is not a staff member', 400);
    }

    // Check if already assigned
    const existingAssignment = await Assignment.findOne({ complaintId, status: { $ne: 'Completed' } });

    if (existingAssignment) {
      return errorResponse(res, 'Complaint is already assigned', 400);
    }

    // Create assignment
    const assignment = await Assignment.create({
      complaintId,
      staffId,
      assignedBy: req.user._id,
      notes,
    });

    // Update complaint with assignedTo and status
    complaint.assignedTo = staffId;
    if (complaint.status === 'Pending') {
      complaint.status = 'In-Progress';
    }
    await complaint.save();

    // Create notification for staff
    console.log('Creating notification for staff:', staffId);
    const staffNotification = await Notification.createNotification(
      staffId,
      'complaint_assigned',
      `A new complaint has been assigned to you: ${complaint.title}`,
      complaintId
    );
    console.log('Staff notification created:', staffNotification);

    // Create notification for complaint owner
    console.log('Creating notification for complaint owner:', complaint.userId);
    const ownerNotification = await Notification.createNotification(
      complaint.userId,
      'status_updated',
      `Your complaint has been assigned to a staff member`,
      complaintId
    );
    console.log('Owner notification created:', ownerNotification);

    // Send email to staff
    await emailService.sendAssignmentNotification(
      staff.email,
      staff.name,
      complaint._id,
      complaint.title,
      complaint.category,
      complaint.priority
    );

    // Populate assignment before sending
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('complaintId')
      .populate('staffId', 'name email')
      .populate('assignedBy', 'name');

    return successResponse(res, populatedAssignment, 'Complaint assigned successfully', 201);
  } catch (error) {
    console.error('Assign complaint error:', error);
    return errorResponse(res, 'Failed to assign complaint', 500);
  }
};

/**
 * @desc    Get assignments for a staff member
 * @route   GET /api/assignments/staff/:staffId
 * @access  Private (Staff viewing their own, Admin viewing any)
 */
export const getStaffAssignments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check authorization
    if (req.user.role === 'staff' && staffId !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Build query
    const query = { staffId };
    if (status) query.status = status;

    // Get total count
    const total = await Assignment.countDocuments(query);

    // Get assignments
    const assignments = await Assignment.find(query)
      .populate({
        path: 'complaintId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return successResponse(res, {
      assignments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return errorResponse(res, 'Failed to fetch assignments', 500);
  }
};

/**
 * @desc    Get all assignments (Admin only)
 * @route   GET /api/assignments
 * @access  Private (Admin)
 */
export const getAllAssignments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;

    // Get total count
    const total = await Assignment.countDocuments(query);

    // Get assignments
    const assignments = await Assignment.find(query)
      .populate({
        path: 'complaintId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .populate('staffId', 'name email')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return successResponse(res, {
      assignments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get all assignments error:', error);
    return errorResponse(res, 'Failed to fetch assignments', 500);
  }
};

/**
 * @desc    Update assignment status
 * @route   PUT /api/assignments/:id
 * @access  Private (Staff, Admin)
 */
export const updateAssignment = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const assignment = await Assignment.findById(req.params.id)
      .populate('complaintId')
      .populate('staffId', 'name email');

    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }

    // Check authorization - staff can only update their own assignments
    if (req.user.role === 'staff' && assignment.staffId._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Update assignment
    if (status) assignment.status = status;
    if (notes) assignment.notes = notes;

    await assignment.save();

    // If assignment is completed, update complaint status
    if (status === 'Completed' && assignment.complaintId) {
      const complaint = assignment.complaintId;
      if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
        // Don't auto-resolve, just set to in-progress
        // Staff will manually resolve via complaint update
      }
    }

    return successResponse(res, assignment, 'Assignment updated successfully');
  } catch (error) {
    console.error('Update assignment error:', error);
    return errorResponse(res, 'Failed to update assignment', 500);
  }
};

/**
 * @desc    Reassign complaint to different staff
 * @route   PUT /api/assignments/:id/reassign
 * @access  Private (Admin)
 */
export const reassignComplaint = async (req, res) => {
  try {
    const { newStaffId, notes } = req.body;

    if (!newStaffId) {
      return errorResponse(res, 'New staff ID is required', 400);
    }

    const assignment = await Assignment.findById(req.params.id).populate('complaintId');

    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }

    // Check if new staff exists
    const newStaff = await User.findById(newStaffId);
    if (!newStaff || newStaff.role !== 'staff') {
      return errorResponse(res, 'Invalid staff member', 400);
    }

    // Complete old assignment
    assignment.status = 'Completed';
    assignment.notes = notes || 'Reassigned to another staff member';
    await assignment.save();

    // Create new assignment
    const newAssignment = await Assignment.create({
      complaintId: assignment.complaintId._id,
      staffId: newStaffId,
      assignedBy: req.user._id,
      notes: notes || 'Reassigned complaint',
    });

    // Create notification for new staff
    await Notification.createNotification(
      newStaffId,
      'complaint_assigned',
      `A complaint has been reassigned to you: ${assignment.complaintId.title}`,
      assignment.complaintId._id
    );

    // Send email to new staff
    await emailService.sendAssignmentNotification(
      newStaff.email,
      newStaff.name,
      assignment.complaintId._id,
      assignment.complaintId.title,
      assignment.complaintId.category,
      assignment.complaintId.priority
    );

    return successResponse(res, newAssignment, 'Complaint reassigned successfully');
  } catch (error) {
    console.error('Reassign complaint error:', error);
    return errorResponse(res, 'Failed to reassign complaint', 500);
  }
};

/**
 * @desc    Get assignment by ID
 * @route   GET /api/assignments/:id
 * @access  Private
 */
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: 'complaintId',
        populate: {
          path: 'userId',
          select: 'name email phone',
        },
      })
      .populate('staffId', 'name email')
      .populate('assignedBy', 'name');

    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }

    // Check authorization
    if (
      req.user.role === 'staff' &&
      assignment.staffId._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    return errorResponse(res, 'Failed to fetch assignment', 500);
  }
};

/**
 * @desc    Delete assignment (Admin only)
 * @route   DELETE /api/assignments/:id
 * @access  Private (Admin)
 */
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }

    await assignment.deleteOne();

    return successResponse(res, null, 'Assignment deleted successfully');
  } catch (error) {
    console.error('Delete assignment error:', error);
    return errorResponse(res, 'Failed to delete assignment', 500);
  }
};
