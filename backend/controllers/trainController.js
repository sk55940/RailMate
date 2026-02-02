import Train from '../models/Train.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

// @desc    Get all trains
// @route   GET /api/trains
// @access  Public (for dropdown in complaint form)
export const getTrains = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { trainNumber: { $regex: search, $options: 'i' } },
        { trainName: { $regex: search, $options: 'i' } },
        { 'route.origin': { $regex: search, $options: 'i' } },
        { 'route.destination': { $regex: search, $options: 'i' } },
      ];
    }

    const trains = await Train.find(query)
      .populate('assignedStaff.userId', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ trainNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Train.countDocuments(query);

    res.json({
      trains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get trains error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get active trains for dropdown
// @route   GET /api/trains/active
// @access  Public
export const getActiveTrains = async (req, res) => {
  try {
    const trains = await Train.find({ status: 'Active' })
      .select('trainNumber trainName route.origin route.destination')
      .sort({ trainNumber: 1 });

    res.json({ trains });
  } catch (error) {
    console.error('Get active trains error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single train
// @route   GET /api/trains/:id
// @access  Private
export const getTrain = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id)
      .populate('assignedStaff.userId', 'name email role phone')
      .populate('createdBy', 'name email');

    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    res.json({ train });
  } catch (error) {
    console.error('Get train error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create train
// @route   POST /api/trains
// @access  Private/Admin
export const createTrain = async (req, res) => {
  try {
    const {
      trainNumber,
      trainName,
      route,
      schedule,
      type,
      facilities,
      totalCoaches,
    } = req.body;

    // Check if train number already exists
    const existingTrain = await Train.findOne({ trainNumber });
    if (existingTrain) {
      return res.status(400).json({ message: 'Train number already exists' });
    }

    const train = await Train.create({
      trainNumber,
      trainName,
      route,
      schedule,
      type,
      facilities,
      totalCoaches,
      createdBy: req.user._id,
    });

    res.status(201).json({ train, message: 'Train created successfully' });
  } catch (error) {
    console.error('Create train error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update train
// @route   PUT /api/trains/:id
// @access  Private/Admin
export const updateTrain = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);

    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Check if updating train number and if it already exists
    if (req.body.trainNumber && req.body.trainNumber !== train.trainNumber) {
      const existingTrain = await Train.findOne({ trainNumber: req.body.trainNumber });
      if (existingTrain) {
        return res.status(400).json({ message: 'Train number already exists' });
      }
    }

    const updatedTrain = await Train.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedStaff.userId', 'name email role');

    res.json({ train: updatedTrain, message: 'Train updated successfully' });
  } catch (error) {
    console.error('Update train error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete train
// @route   DELETE /api/trains/:id
// @access  Private/Admin
export const deleteTrain = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);

    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Check if there are complaints associated with this train
    const complaintsCount = await Complaint.countDocuments({ trainId: req.params.id });
    if (complaintsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete train. ${complaintsCount} complaints are associated with this train.` 
      });
    }

    await train.deleteOne();
    res.json({ message: 'Train deleted successfully' });
  } catch (error) {
    console.error('Delete train error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign staff to train
// @route   POST /api/trains/:id/assign-staff
// @access  Private/Admin
export const assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body;

    const train = await Train.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Verify staff exists and is actually a staff member
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(400).json({ message: 'Invalid staff member' });
    }

    // Check if staff already assigned
    const alreadyAssigned = train.assignedStaff.some(
      s => s.userId.toString() === staffId
    );

    if (alreadyAssigned) {
      return res.status(400).json({ message: 'Staff already assigned to this train' });
    }

    train.assignedStaff.push({
      userId: staffId,
      role: staff.specialization || 'General',
      assignedDate: new Date(),
    });

    await train.save();

    // Populate before sending response
    await train.populate('assignedStaff.userId', 'name email role');

    res.json({ train, message: 'Staff assigned successfully' });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove staff from train
// @route   DELETE /api/trains/:id/staff/:staffId
// @access  Private/Admin
export const removeStaff = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    train.assignedStaff = train.assignedStaff.filter(
      s => s.userId.toString() !== req.params.staffId
    );

    await train.save();
    await train.populate('assignedStaff.userId', 'name email role');

    res.json({ train, message: 'Staff removed successfully' });
  } catch (error) {
    console.error('Remove staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get available staff for assignment (based on complaint context)
// @route   GET /api/trains/available-staff
// @access  Private/Admin
export const getAvailableStaff = async (req, res) => {
  try {
    const { complaintId } = req.query;

    let availableStaff = [];
    let context = 'all';

    if (complaintId) {
      // Get complaint details to filter staff
      const complaint = await Complaint.findById(complaintId);
      
      console.log('Complaint details:', {
        id: complaint?._id,
        locationType: complaint?.locationType,
        trainId: complaint?.trainId,
        category: complaint?.category
      });
      
      if (complaint && complaint.locationType === 'Train' && complaint.trainId) {
        context = 'train';
        console.log('Fetching staff for Train:', complaint.trainId);
        // Get staff assigned to this specific train
        const train = await Train.findById(complaint.trainId).populate('assignedStaff.userId');
        
        console.log('Train found:', train?.trainName, 'Staff count:', train?.assignedStaff?.length);
        
        if (train && train.assignedStaff && train.assignedStaff.length > 0) {
          availableStaff = train.assignedStaff.map(s => ({
            ...s.userId.toObject(),
            trainRole: s.role,
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            availability: 'On Train',
          }));
          console.log('Train staff filtered:', availableStaff.length);
        } else {
          console.log('No staff assigned to this train');
        }
      } else if (complaint && complaint.locationType === 'Station') {
        context = 'station';
        console.log('Fetching station-based staff');
        // Get station-based staff (staff not currently on any train)
        const allTrains = await Train.find({ status: 'Active' });
        const assignedStaffIds = allTrains.flatMap(t => 
          t.assignedStaff.map(s => s.userId.toString())
        );

        console.log('Staff assigned to trains:', assignedStaffIds);

        availableStaff = await User.find({
          role: 'staff',
          _id: { $nin: assignedStaffIds },
        }).select('name email role phone specialization expertise');
        
        availableStaff = availableStaff.map(s => ({
          ...s.toObject(),
          availability: 'At Station',
        }));
        console.log('Station staff filtered:', availableStaff.length);
      } else {
        console.log('No valid locationType or trainId, showing all staff');
      }

      // AI-powered recommendation based on complaint category
      if (availableStaff.length > 0 && complaint) {
        const scoredStaff = availableStaff.map(staff => {
          let score = 0;
          let reasons = [];

          // Category-based scoring
          const categoryMap = {
            'Food Quality': ['Pantry Staff', 'General'],
            'Cleanliness': ['Cleaning', 'Coach Attendant', 'General'],
            'Safety & Security': ['Security', 'TTE', 'General'],
            'Staff Behavior': ['TTE', 'Coach Attendant', 'General'],
            'Technical Issues': ['Technical', 'General'],
            'Medical Emergency': ['Medical', 'TTE', 'General'],
            'Facilities': ['Technical', 'Coach Attendant', 'General'],
            'Ticketing': ['TTE', 'Coach Attendant', 'General'],
          };

          const relevantSpecs = categoryMap[complaint.category] || ['General'];
          
          if (staff.specialization && relevantSpecs.includes(staff.specialization)) {
            score += relevantSpecs[0] === staff.specialization ? 40 : 25;
            reasons.push(`${staff.specialization} specialization matches complaint category`);
          }

          // Expertise matching
          if (staff.expertise && staff.expertise.length > 0) {
            const complaintCategory = complaint.category;
            if (complaintCategory.includes('Train') && staff.expertise.includes('Train-related')) {
              score += 20;
              reasons.push('Train operations expertise');
            }
            if (complaintCategory.includes('Safety') && staff.expertise.includes('Safety')) {
              score += 20;
              reasons.push('Safety expertise');
            }
            if (complaintCategory.includes('Clean') && staff.expertise.includes('Cleanliness')) {
              score += 20;
              reasons.push('Cleanliness expertise');
            }
            if (staff.expertise.length >= 3) {
              score += 10;
              reasons.push('Multi-skilled professional');
            }
          }

          // Priority-based urgency
          if (complaint.priority === 'critical' || complaint.priority === 'high') {
            if (staff.specialization !== 'General') {
              score += 15;
              reasons.push('Specialized staff for high-priority issue');
            }
          }

          // Train context bonus
          if (context === 'train' && staff.trainRole) {
            score += 15;
            reasons.push(`Currently on ${staff.trainName}`);
          }

          return {
            staffId: staff,
            score: Math.min(score, 100),
            reasons: reasons.slice(0, 3),
            confidence: score > 60 ? 'High' : score > 40 ? 'Medium' : 'Low',
          };
        });

        // Sort and get top recommendation
        scoredStaff.sort((a, b) => b.score - a.score);
        const topRecommendation = scoredStaff[0];

        return res.json({ 
          staff: availableStaff, 
          recommendation: topRecommendation,
          context: context === 'train' ? `Train-based staff (${availableStaff[0]?.trainName || 'N/A'})` : 'Station staff'
        });
      }
    }

    // If no specific context, return all staff
    if (availableStaff.length === 0) {
      availableStaff = await User.find({ role: 'staff' })
        .select('name email role phone specialization expertise');
    }

    res.json({ staff: availableStaff, context: 'All available staff' });
  } catch (error) {
    console.error('Get available staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get train statistics
// @route   GET /api/trains/stats
// @access  Private/Admin
export const getTrainStats = async (req, res) => {
  try {
    const totalTrains = await Train.countDocuments();
    const activeTrains = await Train.countDocuments({ status: 'Active' });
    const maintenanceTrains = await Train.countDocuments({ status: 'Maintenance' });

    // Staff deployment stats
    const trains = await Train.find({ status: 'Active' });
    const totalStaffDeployed = trains.reduce((sum, t) => sum + t.assignedStaff.length, 0);

    res.json({
      totalTrains,
      activeTrains,
      maintenanceTrains,
      totalStaffDeployed,
    });
  } catch (error) {
    console.error('Get train stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
