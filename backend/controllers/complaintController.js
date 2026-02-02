import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import Train from '../models/Train.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import emailService from '../services/emailService.js';
import { notifyNewComplaint } from '../utils/notificationHelper.js';
import { successResponse, errorResponse, buildFilterQuery, paginate } from '../utils/helpers.js';

/**
 * @desc    Create new complaint
 * @route   POST /api/complaints
 * @access  Private (Passenger)
 */
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, locationType, trainNumber, trainId, stationName, pnrNumber, dateOfIncident } = req.body;

    // Validate required fields
    if (!title || !description) {
      return errorResponse(res, 'Title and description are required', 400);
    }

    // Get AI analysis (optional - won't fail if AI service is down)
    let aiAnalysis = null;
    try {
      aiAnalysis = await aiService.analyzeComplaint(title, description);
    } catch (aiError) {
      console.warn('AI analysis failed, continuing without it:', aiError.message);
      // Set default values if AI fails
      aiAnalysis = {
        category: category || 'Other',
        priority: 'Medium',
        summary: description.substring(0, 200),
        sentiment: 'Neutral',
      };
    }

    // Handle uploaded media (images and videos)
    let attachmentURL = null;
    const images = [];
    const videos = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (req.files) {
      // Handle images
      if (req.files.images) {
        req.files.images.forEach(file => {
          const fileUrl = `${baseUrl}/uploads/${file.filename}`;
          images.push(fileUrl);
          // Set first image as primary attachment for backward compatibility
          if (!attachmentURL) attachmentURL = fileUrl;
        });
      }
      
      // Handle videos
      if (req.files.videos) {
        req.files.videos.forEach(file => {
          const fileUrl = `${baseUrl}/uploads/${file.filename}`;
          videos.push(fileUrl);
        });
      }
    }

    // Create complaint
    const complaint = await Complaint.create({
      userId: req.user._id,
      title,
      description,
      category: category || aiAnalysis.category,
      locationType,
      trainId: trainId || null,
      priority: aiAnalysis.priority,
      trainNumber,
      stationName,
      pnrNumber,
      dateOfIncident,
      aiSummary: aiAnalysis.summary,
      aiCategory: aiAnalysis.category,
      aiPriority: aiAnalysis.priority,
      sentiment: aiAnalysis.sentiment,
      attachmentURL,
      images,
      videos,
    });

    // Create notification for user
    await Notification.createNotification(
      req.user._id,
      'complaint_submitted',
      `Your complaint "${title}" has been submitted successfully`,
      complaint._id
    );

    // Notify all admins about new complaint
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.createNotification(
          admin._id,
          'complaint_submitted',
          `New complaint submitted: "${title}" by ${req.user.name}`,
          complaint._id
        );
      }
    } catch (notifError) {
      console.warn('Admin notification not sent:', notifError.message);
    }

    // Send email confirmation (optional - won't fail if email service is not configured)
    try {
      await emailService.sendComplaintConfirmation(req.user.email, req.user.name, complaint._id, title);
    } catch (emailError) {
      console.warn('Email not sent:', emailError.message);
    }

    return successResponse(res, complaint, 'Complaint submitted successfully', 201);
  } catch (error) {
    console.error('Create complaint error:', error);
    return errorResponse(res, error.message || 'Failed to create complaint', 500);
  }
};

/**
 * @desc    Get all complaints with filters
 * @route   GET /api/complaints
 * @access  Private
 */
export const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10, search, startDate, endDate, assignedToMe } = req.query;

    // Build filter query based on user role
    let baseFilter = {
      isHistoricalData: { $ne: true }, // Exclude historical data from UI
    };

    console.log('[COMPLAINTS] User role:', req.user.role, 'User ID:', req.user._id, 'Clerk ID:', req.user.clerkId, 'Email:', req.user.email);

    if (req.user.role === 'passenger') {
      // Passengers can only see their own complaints
      baseFilter.userId = req.user._id;
    } else if (req.user.role === 'staff') {
      // Staff can only see complaints assigned to them
      baseFilter.assignedTo = req.user._id;
    }
    // Admin can see all complaints

    console.log('Base filter for complaints:', baseFilter);

    // Add additional filters
    const filterQuery = buildFilterQuery({
      ...baseFilter,
      status,
      category,
      priority,
      search,
      startDate,
      endDate,
    });

    // Get total count
    const total = await Complaint.countDocuments(filterQuery);

    // Get paginated complaints
    const complaints = await Complaint.find(filterQuery)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('remarks.addedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return successResponse(res, {
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return errorResponse(res, 'Failed to fetch complaints', 500);
  }
};

/**
 * @desc    Get single complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('resolvedBy', 'name email')
      .populate('remarks.addedBy', 'name role');

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    // Check if user has access to this complaint
    if (req.user.role === 'passenger' && complaint.userId._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    return errorResponse(res, 'Failed to fetch complaint', 500);
  }
};

/**
 * @desc    Update complaint status
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Staff, Admin)
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;

    const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    // Add remark if provided
    if (remark) {
      complaint.remarks.push({
        addedBy: req.user._id,
        comment: remark,
      });
    }

    // Update resolvedBy and resolvedAt if status is Resolved
    if (status === 'Resolved') {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Create notification for complaint owner
    await Notification.createNotification(
      complaint.userId._id,
      'status_updated',
      `Your complaint status has been updated to ${status}`,
      complaint._id
    );

    // Send email notification
    await emailService.sendStatusUpdate(
      complaint.userId.email,
      complaint.userId.name,
      complaint._id,
      complaint.title,
      oldStatus,
      status
    );

    return successResponse(res, complaint, 'Complaint status updated successfully');
  } catch (error) {
    console.error('Update status error:', error);
    return errorResponse(res, 'Failed to update complaint status', 500);
  }
};

/**
 * @desc    Add remark to complaint
 * @route   POST /api/complaints/:id/remarks
 * @access  Private (Staff, Admin)
 */
export const addRemark = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return errorResponse(res, 'Comment is required', 400);
    }

    const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    complaint.remarks.push({
      addedBy: req.user._id,
      comment,
    });

    await complaint.save();

    // Create notification
    await Notification.createNotification(
      complaint.userId._id,
      'remark_added',
      `A new remark has been added to your complaint`,
      complaint._id
    );

    return successResponse(res, complaint, 'Remark added successfully');
  } catch (error) {
    console.error('Add remark error:', error);
    return errorResponse(res, 'Failed to add remark', 500);
  }
};

/**
 * @desc    Update complaint
 * @route   PUT /api/complaints/:id
 * @access  Private (Owner only for passengers)
 */
export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    // Check ownership for passengers
    if (req.user.role === 'passenger' && complaint.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Passengers can only edit if status is Pending
    if (req.user.role === 'passenger' && complaint.status !== 'Pending') {
      return errorResponse(res, 'Cannot edit complaint after it has been processed', 403);
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'category', 'trainNumber', 'stationName', 'pnrNumber', 'dateOfIncident'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        complaint[field] = req.body[field];
      }
    });

    await complaint.save();

    return successResponse(res, complaint, 'Complaint updated successfully');
  } catch (error) {
    console.error('Update complaint error:', error);
    return errorResponse(res, 'Failed to update complaint', 500);
  }
};

/**
 * @desc    Delete complaint
 * @route   DELETE /api/complaints/:id
 * @access  Private (Admin only)
 */
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    await complaint.deleteOne();

    return successResponse(res, null, 'Complaint deleted successfully');
  } catch (error) {
    console.error('Delete complaint error:', error);
    return errorResponse(res, 'Failed to delete complaint', 500);
  }
};

/**
 * @desc    Get complaint statistics
 * @route   GET /api/complaints/stats
 * @access  Private (Staff, Admin)
 */
export const getComplaintStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          bySentiment: [{ $group: { _id: '$sentiment', count: { $sum: 1 } } }],
        },
      },
    ]);

    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In-Progress' });

    return successResponse(res, {
      total,
      resolved,
      pending,
      inProgress,
      ...stats[0],
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * @desc    Get AI insights for complaint
 * @route   GET /api/complaints/:id/ai-insights
 * @access  Private (Staff, Admin)
 */
export const getAIInsights = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    // Generate response suggestion
    const suggestion = await aiService.generateResponseSuggestion(complaint);

    return successResponse(res, {
      category: complaint.aiCategory,
      priority: complaint.aiPriority,
      sentiment: complaint.sentiment,
      summary: complaint.aiSummary,
      suggestion,
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    return errorResponse(res, 'Failed to fetch AI insights', 500);
  }
};
