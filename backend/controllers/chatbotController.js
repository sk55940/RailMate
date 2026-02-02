import chatbotService from '../services/chatbotService.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// Passenger chatbot endpoint
export const passengerChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Get user context
    const user = await User.findOne({ clerkId: userId });
    const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 }).limit(5);
    
    const context = {
      userName: user?.name || 'Passenger',
      complaintsCount: complaints.length,
      recentComplaint: complaints[0]?.title || null
    };

    const response = await chatbotService.passengerChat(message, context);

    res.json({
      success: true,
      response,
      context: {
        complaintsCount: context.complaintsCount,
        hasRecentComplaint: !!context.recentComplaint
      }
    });
  } catch (error) {
    console.error('Passenger chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
};

// Admin chatbot endpoint
export const adminChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get system stats for context
    const totalComplaints = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const highPriority = await Complaint.countDocuments({ priority: 'High' });
    const staffCount = await User.countDocuments({ role: 'staff' });

    const context = {
      totalComplaints,
      pending,
      inProgress,
      resolved,
      highPriority,
      staffCount,
      trend: resolved > pending ? 'positive' : 'needs attention'
    };

    console.log('Admin chatbot request:', { message, context });
    const response = await chatbotService.adminChat(message, context);
    console.log('Admin chatbot response:', response);

    res.json({
      success: true,
      response,
      stats: context
    });
  } catch (error) {
    console.error('Admin chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
};

// Staff chatbot endpoint
export const staffChat = async (req, res) => {
  try {
    const { message, complaintId } = req.body;
    const userId = req.user.userId;

    const user = await User.findOne({ clerkId: userId });
    const assignedComplaints = await Complaint.find({ assignedTo: user?._id });
    const pendingTasks = assignedComplaints.filter(c => c.status !== 'Resolved').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await Complaint.countDocuments({
      assignedTo: user?._id,
      status: 'Resolved',
      updatedAt: { $gte: today }
    });

    let currentComplaint = null;
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId);
      currentComplaint = complaint ? `${complaint.category} - ${complaint.title}` : null;
    }

    const context = {
      staffName: user?.name || 'Staff',
      assignedCount: assignedComplaints.length,
      pendingTasks,
      completedToday,
      currentComplaint
    };

    const response = await chatbotService.staffChat(message, context);

    res.json({
      success: true,
      response,
      workload: {
        assigned: context.assignedCount,
        pending: pendingTasks,
        completedToday
      }
    });
  } catch (error) {
    console.error('Staff chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
};

// Image analysis endpoint
export const analyzeImage = async (req, res) => {
  try {
    const { image, complaintText } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    const analysis = await chatbotService.analyzeImage(image, complaintText);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze image',
      error: error.message
    });
  }
};

// Smart assignment suggestion
export const suggestAssignment = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Get all staff members
    const staffUsers = await User.find({ role: 'staff' });
    
    // Get assignment counts for each staff
    const staffWithWorkload = await Promise.all(
      staffUsers.map(async (staff) => {
        const assignedCount = await Complaint.countDocuments({
          assignedTo: staff._id,
          status: { $ne: 'Resolved' }
        });
        return {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          assignedCount,
          expertise: staff.expertise || 'General'
        };
      })
    );

    const suggestion = await chatbotService.suggestAssignment(complaint, staffWithWorkload);

    res.json({
      success: true,
      suggestion,
      availableStaff: staffWithWorkload
    });
  } catch (error) {
    console.error('Assignment suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestion',
      error: error.message
    });
  }
};

// Predictive analytics endpoint
export const predictResolution = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Get historical data for similar complaints (including training data)
    const similarComplaints = await Complaint.find({
      category: complaint.category,
      status: 'Resolved'
      // Note: No filter on isHistoricalData - we include both real and training data
    }).select('createdAt resolvedAt');

    const resolutionTimes = similarComplaints
      .filter(c => c.resolvedAt)
      .map(c => (c.resolvedAt - c.createdAt) / (1000 * 60 * 60)); // hours

    const avgTime = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
      : null;

    const historicalData = {
      avgTime: avgTime ? `${avgTime} hours` : 'Insufficient data',
      successRate: similarComplaints.length > 0 ? '85%' : 'Unknown',
      similarResolved: similarComplaints.length
    };

    const prediction = await chatbotService.predictResolution(complaint, historicalData);

    // Generate actionable recommendations based on complaint analysis
    const recommendations = [];
    const isOnTrain = complaint.locationType === 'Train' || complaint.trainId;
    
    // IMMEDIATE ACTION for train-based complaints
    if (isOnTrain) {
      if (complaint.category === 'Food Quality') {
        recommendations.push('🚨 IMMEDIATE: Contact train superintendent and pantry manager NOW');
        recommendations.push('Replace meal for passenger immediately during journey');
        recommendations.push('Document issue with photos and initiate vendor review');
      } else if (complaint.category === 'Cleanliness') {
        recommendations.push('🚨 IMMEDIATE: Deploy on-board cleaning staff to reported coach');
        recommendations.push('Complete cleaning within 30-60 minutes of complaint');
        recommendations.push('Follow-up with passenger before end of journey');
      } else if (complaint.category === 'Safety & Security') {
        recommendations.push('🚨 CRITICAL: Alert RPF and train security IMMEDIATELY');
        recommendations.push('Ensure passenger safety within 15 minutes');
        recommendations.push('Coordinate with next station for additional support if needed');
      } else if (complaint.category === 'Medical Emergency') {
        recommendations.push('🚨 EMERGENCY: Contact medical staff/TTE within 5 minutes');
        recommendations.push('Alert nearest station with medical facilities');
        recommendations.push('Prepare for emergency stop if situation is critical');
      } else if (complaint.category === 'Staff Behavior') {
        recommendations.push('Contact train supervisor to address staff member immediately');
        recommendations.push('Speak with passenger to resolve issue during journey');
        recommendations.push('Document incident for staff training and review');
      }
    } else {
      // Station-based or non-immediate complaints
      // Priority-based recommendations
      if (complaint.priority === 'high' || complaint.priority === 'critical') {
        recommendations.push('Escalate immediately to senior staff for faster resolution');
      }
      
      // Category-based recommendations
      if (complaint.category === 'Cleanliness') {
        recommendations.push('Dispatch cleaning crew to the reported location');
        recommendations.push('Schedule follow-up inspection within 24 hours');
      } else if (complaint.category === 'Safety & Security') {
        recommendations.push('Alert security personnel and RPF immediately');
        recommendations.push('Ensure CCTV footage is reviewed if available');
      } else if (complaint.category === 'Staff Behavior') {
        recommendations.push('Conduct staff counseling and training session');
        recommendations.push('Review staff performance records for patterns');
      } else if (complaint.category === 'Food Quality') {
        recommendations.push('Inspect pantry/catering service provider');
        recommendations.push('Consider vendor review if multiple complaints exist');
      } else if (complaint.category === 'Technical Issues') {
        recommendations.push('Assign technical maintenance team immediately');
        recommendations.push('Check for similar issues in other coaches/trains');
      }
    }
    
    // Status-based recommendations
    if (complaint.status === 'pending') {
      if (!complaint.assignedTo) {
        recommendations.push('Assign appropriate staff member based on expertise');
      }
    } else if (complaint.status === 'investigating' && avgTime && avgTime > 48) {
      recommendations.push('Consider escalation - investigation time exceeding average');
    }
    
    // Limit to top 3 most relevant recommendations
    const topRecommendations = recommendations.slice(0, 3);

    res.json({
      success: true,
      prediction,
      historicalData,
      recommendations: topRecommendations
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction',
      error: error.message
    });
  }
};
