import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

    return successResponse(res, user);
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(res, 'Failed to fetch user profile', 500);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateCurrentUser = async (req, res) => {
  try {
    const { name, phone, specialization, expertise } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (specialization) user.specialization = specialization;
    if (expertise && Array.isArray(expertise)) user.expertise = expertise;

    await user.save();

    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return successResponse(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user);
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/users/:id/role
 * @access  Private (Admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['passenger', 'staff', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot change your own role', 403);
    }

    user.role = role;
    await user.save();

    // Update role in Clerk as well
    try {
      await clerkClient.users.updateUserMetadata(user.clerkId, {
        publicMetadata: { role },
      });
    } catch (clerkError) {
      console.error('Clerk update error:', clerkError);
    }

    return successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    console.error('Update role error:', error);
    return errorResponse(res, 'Failed to update user role', 500);
  }
};

/**
 * @desc    Toggle user active status (Admin only)
 * @route   PUT /api/users/:id/toggle-status
 * @access  Private (Admin)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent disabling own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot change your own status', 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle status error:', error);
    return errorResponse(res, 'Failed to update user status', 500);
  }
};

/**
 * @desc    Get staff members (for assignment)
 * @route   GET /api/users/staff
 * @access  Private (Admin)
 */
export const getStaffMembers = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff', isActive: true }).select('name email role specialization expertise');

    return successResponse(res, staff);
  } catch (error) {
    console.error('Get staff error:', error);
    return errorResponse(res, 'Failed to fetch staff members', 500);
  }
};

/**
 * @desc    Get user dashboard stats
 * @route   GET /api/users/me/stats
 * @access  Private
 */
export const getUserStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'passenger') {
      // Get passenger stats
      const total = await Complaint.countDocuments({ userId: req.user._id });
      const pending = await Complaint.countDocuments({ userId: req.user._id, status: 'Pending' });
      const inProgress = await Complaint.countDocuments({ userId: req.user._id, status: 'In-Progress' });
      const resolved = await Complaint.countDocuments({ userId: req.user._id, status: 'Resolved' });

      stats = { total, pending, inProgress, resolved };
    } else if (req.user.role === 'staff') {
      // Get staff stats (assigned complaints)
      const Assignment = (await import('../models/Assignment.js')).default;

      const assignments = await Assignment.find({ staffId: req.user._id });
      const complaintIds = assignments.map((a) => a.complaintId);

      const total = complaintIds.length;
      const pending = await Complaint.countDocuments({ _id: { $in: complaintIds }, status: 'Pending' });
      const inProgress = await Complaint.countDocuments({ _id: { $in: complaintIds }, status: 'In-Progress' });
      const resolved = await Complaint.countDocuments({ _id: { $in: complaintIds }, status: 'Resolved' });

      stats = { total, pending, inProgress, resolved };
    } else if (req.user.role === 'admin') {
      // Get admin stats (all complaints)
      const total = await Complaint.countDocuments();
      const pending = await Complaint.countDocuments({ status: 'Pending' });
      const inProgress = await Complaint.countDocuments({ status: 'In-Progress' });
      const resolved = await Complaint.countDocuments({ status: 'Resolved' });

      const totalUsers = await User.countDocuments();
      const totalStaff = await User.countDocuments({ role: 'staff' });
      const totalPassengers = await User.countDocuments({ role: 'passenger' });

      stats = {
        complaints: { total, pending, inProgress, resolved },
        users: { total: totalUsers, staff: totalStaff, passengers: totalPassengers },
      };
    }

    return successResponse(res, stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * @desc    Sync user from Clerk
 * @route   POST /api/users/sync
 * @access  Public (called by Clerk webhooks or frontend)
 */
export const syncUserFromClerk = async (req, res) => {
  try {
    const { clerkId, email, name } = req.body;

    if (!clerkId || !email) {
      return errorResponse(res, 'Clerk ID and email are required', 400);
    }

    // Find or create user
    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({
        clerkId,
        email,
        name: name || 'User',
        role: 'passenger',
      });
    } else {
      // Update existing user
      user.email = email;
      if (name) user.name = name;
      await user.save();
    }

    return successResponse(res, user, 'User synced successfully');
  } catch (error) {
    console.error('Sync user error:', error);
    return errorResponse(res, 'Failed to sync user', 500);
  }
};
