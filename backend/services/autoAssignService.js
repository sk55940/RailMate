import Train from '../models/Train.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

/**
 * AI-Powered Auto-Assignment System
 * Intelligently suggests best staff member for complaint assignment
 */

/**
 * Calculate staff workload
 */
const getStaffWorkload = async (staffId) => {
  const activeComplaints = await Complaint.countDocuments({
    assignedTo: staffId,
    status: { $in: ['Pending', 'In-Progress'] },
  });
  return activeComplaints;
};

/**
 * Get staff performance score (based on resolution rate)
 */
const getStaffPerformance = async (staffId) => {
  const totalAssigned = await Complaint.countDocuments({ assignedTo: staffId });
  const resolved = await Complaint.countDocuments({
    assignedTo: staffId,
    status: 'Resolved',
  });

  if (totalAssigned === 0) return 1; // New staff gets neutral score
  return resolved / totalAssigned;
};

/**
 * Check if staff is available (on the right train or at station)
 */
const isStaffAvailable = async (staffId, complaint) => {
  // If complaint is about a train
  if (complaint.locationType === 'Train' && complaint.trainId) {
    const train = await Train.findById(complaint.trainId);
    if (train) {
      return train.assignedStaff.some(s => s.userId.toString() === staffId.toString());
    }
    return false;
  }

  // If complaint is about a station - prefer station-based staff
  if (complaint.locationType === 'Station') {
    const trains = await Train.find({ status: 'Active' });
    const assignedStaffIds = trains.flatMap(t => 
      t.assignedStaff.map(s => s.userId.toString())
    );
    // Station staff are those not assigned to any train
    return !assignedStaffIds.includes(staffId.toString());
  }

  return true; // Default: staff is available
};

/**
 * Calculate match score based on complaint category and staff expertise
 */
const calculateCategoryMatch = async (staffId, complaintCategory) => {
  // Get staff's historical success with this category
  const categoryComplaints = await Complaint.countDocuments({
    assignedTo: staffId,
    category: complaintCategory,
    status: 'Resolved',
  });

  const totalComplaints = await Complaint.countDocuments({
    assignedTo: staffId,
    category: complaintCategory,
  });

  if (totalComplaints === 0) return 0.5; // Neutral score for no history
  return categoryComplaints / totalComplaints;
};

/**
 * Calculate priority urgency bonus
 */
const getPriorityBonus = (priority) => {
  const bonusMap = {
    'Critical': 2.0,
    'High': 1.5,
    'Medium': 1.0,
    'Low': 0.8,
  };
  return bonusMap[priority] || 1.0;
};

/**
 * Main AI Auto-Assignment Function
 * Returns ranked list of staff with scores
 */
export const suggestStaffAssignment = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Get all staff members
    let eligibleStaff = await User.find({ role: 'staff' }).select('name email');

    // Filter based on availability (train/station)
    const availabilityChecks = await Promise.all(
      eligibleStaff.map(async staff => ({
        staff,
        isAvailable: await isStaffAvailable(staff._id, complaint),
      }))
    );

    eligibleStaff = availabilityChecks
      .filter(check => check.isAvailable)
      .map(check => check.staff);

    if (eligibleStaff.length === 0) {
      return {
        suggestions: [],
        message: 'No eligible staff found for this complaint location',
      };
    }

    // Calculate scores for each staff member
    const scoredStaff = await Promise.all(
      eligibleStaff.map(async staff => {
        const workload = await getStaffWorkload(staff._id);
        const performance = await getStaffPerformance(staff._id);
        const categoryMatch = await calculateCategoryMatch(staff._id, complaint.category);
        const priorityBonus = getPriorityBonus(complaint.priority);

        // AI Scoring Formula
        const workloadScore = Math.max(0, 1 - (workload * 0.15)); // Penalize high workload
        const performanceScore = performance; // Higher is better
        const categoryScore = categoryMatch; // Higher is better
        
        // Weighted final score
        const finalScore = (
          workloadScore * 0.4 +      // 40% weight on workload
          performanceScore * 0.3 +   // 30% weight on performance
          categoryScore * 0.3        // 30% weight on category expertise
        ) * priorityBonus;            // Multiply by priority bonus

        return {
          staffId: staff._id,
          staffName: staff.name,
          staffEmail: staff.email,
          score: Math.round(finalScore * 100) / 100,
          metrics: {
            workload,
            performance: Math.round(performance * 100) / 100,
            categoryMatch: Math.round(categoryMatch * 100) / 100,
            priorityBonus,
          },
          recommended: finalScore > 0.7, // Flag highly recommended staff
        };
      })
    );

    // Sort by score (highest first)
    scoredStaff.sort((a, b) => b.score - a.score);

    // Get top 3 recommendations
    const topRecommendations = scoredStaff.slice(0, 3);

    return {
      suggestions: scoredStaff,
      topPick: scoredStaff[0],
      topThree: topRecommendations, // Top 3 AI recommendations
      message: `Found ${scoredStaff.length} eligible staff members`,
      context: {
        complaintType: complaint.locationType,
        category: complaint.category,
        priority: complaint.priority,
        trainNumber: complaint.trainNumber,
        stationName: complaint.stationName,
      },
    };
  } catch (error) {
    console.error('AI Assignment error:', error);
    throw error;
  }
};

/**
 * Auto-assign complaint to best available staff
 */
export const autoAssignComplaint = async (complaintId) => {
  try {
    const result = await suggestStaffAssignment(complaintId);
    
    if (result.suggestions.length === 0) {
      return {
        success: false,
        message: 'No eligible staff found for auto-assignment',
      };
    }

    const bestStaff = result.topPick;
    
    // Assign complaint to best staff
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { 
        assignedTo: bestStaff.staffId,
        status: 'In-Progress',
      },
      { new: true }
    );

    return {
      success: true,
      message: `Complaint auto-assigned to ${bestStaff.staffName}`,
      assignedStaff: bestStaff,
      complaint,
    };
  } catch (error) {
    console.error('Auto-assign error:', error);
    return {
      success: false,
      message: 'Auto-assignment failed',
      error: error.message,
    };
  }
};

export default {
  suggestStaffAssignment,
  autoAssignComplaint,
};
