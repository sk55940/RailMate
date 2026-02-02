import { GoogleGenerativeAI } from '@google/generative-ai';

class ChatbotService {
  constructor() {
    this.genAI = process.env.GEMINI_API_KEY 
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;
  }

  // Passenger Chatbot - Help with complaints, track status, FAQs
  async passengerChat(message, context = {}) {
    try {
      const systemPrompt = `You are RailMate Assistant, a helpful AI assistant for railway passengers in India.
Your role: Help passengers file complaints, track complaint status, answer railway-related questions.

Context:
- User: ${context.userName || 'Passenger'}
- User complaints count: ${context.complaintsCount || 0}
- Recent complaint: ${context.recentComplaint || 'None'}

Guidelines:
1. Be friendly, empathetic, and professional
2. Help categorize complaints (Cleanliness, Safety, Staff Behavior, Food Quality, etc.)
3. Provide complaint tracking information
4. Answer railway policy questions
5. Suggest priority levels based on severity
6. Keep responses concise (2-3 sentences)

User message: ${message}`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(systemPrompt);
        return result.response.text();
      } else {
        return this.fallbackPassengerResponse(message, context);
      }
    } catch (error) {
      console.error('Passenger chatbot error:', error);
      return this.fallbackPassengerResponse(message, context);
    }
  }

  // Admin Chatbot - Analytics, insights, system queries
  async adminChat(message, context = {}) {
    try {
      const systemPrompt = `You are RailMate Admin Assistant, an AI assistant for railway complaint management administrators.
Your role: Provide insights, analytics, help with system queries, suggest actions.

Context:
- Total complaints: ${context.totalComplaints || 0}
- Pending: ${context.pending || 0}
- In Progress: ${context.inProgress || 0}
- Resolved: ${context.resolved || 0}
- High Priority: ${context.highPriority || 0}
- Staff count: ${context.staffCount || 0}
- Recent trend: ${context.trend || 'stable'}

Guidelines:
1. Provide data-driven insights
2. Suggest actions based on metrics
3. Help identify bottlenecks
4. Recommend resource allocation
5. Highlight urgent issues
6. Keep responses analytical and actionable

User query: ${message}`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(systemPrompt);
        return result.response.text();
      } else {
        return this.fallbackAdminResponse(message, context);
      }
    } catch (error) {
      console.error('Admin chatbot error:', error);
      return this.fallbackAdminResponse(message, context);
    }
  }

  // Staff Chatbot - Assignment help, resolution suggestions
  async staffChat(message, context = {}) {
    try {
      const systemPrompt = `You are RailMate Staff Assistant, an AI assistant for railway staff handling complaints.
Your role: Help staff manage assignments, suggest resolutions, provide guidance.

Context:
- Staff member: ${context.staffName || 'Staff'}
- Assigned complaints: ${context.assignedCount || 0}
- Pending tasks: ${context.pendingTasks || 0}
- Completed today: ${context.completedToday || 0}
- Current complaint: ${context.currentComplaint || 'None'}

Guidelines:
1. Suggest resolution steps based on complaint type
2. Provide priority recommendations
3. Help with time management
4. Suggest similar past resolutions
5. Keep responses practical and actionable
6. Be supportive and professional

User message: ${message}`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(systemPrompt);
        return result.response.text();
      } else {
        return this.fallbackStaffResponse(message, context);
      }
    } catch (error) {
      console.error('Staff chatbot error:', error);
      return this.fallbackStaffResponse(message, context);
    }
  }

  // Image Analysis - Analyze complaint photos
  async analyzeImage(imageData, complaintText = '') {
    try {
      if (!this.genAI) {
        return this.fallbackImageAnalysis(complaintText);
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Analyze this railway complaint image and provide:
1. Issue Category (Cleanliness, Safety, Infrastructure, etc.)
2. Severity Level (Low, Medium, High, Critical)
3. Brief Description
4. Suggested Action

Complaint text: ${complaintText || 'None provided'}

Format response as JSON:
{
  "category": "...",
  "severity": "...",
  "description": "...",
  "suggestedAction": "..."
}`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
      ]);
      
      const response = result.response.text();
      try {
        return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return {
          category: 'Infrastructure',
          severity: 'Medium',
          description: 'Image uploaded successfully. Manual review recommended.',
          suggestedAction: 'Inspect the reported area and take appropriate action.'
        };
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      return this.fallbackImageAnalysis(complaintText);
    }
  }

  // Fallback responses when AI is unavailable
  fallbackPassengerResponse(message, context) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('track') || lowerMsg.includes('status')) {
      return `You can track your complaints on the dashboard. ${context.recentComplaint ? `Your recent complaint "${context.recentComplaint}" is being processed.` : 'Visit the complaints list to see all your submissions.'}`;
    }
    
    if (lowerMsg.includes('file') || lowerMsg.includes('submit') || lowerMsg.includes('complaint')) {
      return `To file a complaint, click "Submit Complaint" and select the appropriate category (Cleanliness, Safety, Staff Behavior, etc.). Provide detailed description for faster resolution.`;
    }
    
    if (lowerMsg.includes('how long') || lowerMsg.includes('time')) {
      return `Resolution time varies: High priority issues typically resolved in 24-48 hours, medium priority in 3-5 days. You'll receive notifications at each step.`;
    }
    
    return `Hello! I'm RailMate Assistant. I can help you file complaints, track status, or answer railway-related questions. What would you like to know?`;
  }

  fallbackAdminResponse(message, context) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('pending') || lowerMsg.includes('backlog')) {
      const pendingCount = context.pending || 0;
      const highPriorityCount = context.highPriority || 0;
      const staffCount = context.staffCount || 0;
      
      let response = `📊 **Pending Complaints Overview**\n\n`;
      response += `• Total Pending: ${pendingCount} complaint${pendingCount !== 1 ? 's' : ''}\n`;
      
      if (highPriorityCount > 0) {
        response += `• ⚠️ High Priority: ${highPriorityCount} (Requires immediate attention)\n`;
      }
      
      response += `• Available Staff: ${staffCount} member${staffCount !== 1 ? 's' : ''}\n\n`;
      
      if (pendingCount === 0) {
        response += `✅ Great job! All complaints are being handled. Monitor incoming complaints regularly.`;
      } else if (pendingCount > 10) {
        response += `⚡ **Action Required**: High backlog detected. Consider:\n`;
        response += `  1. Assign additional staff resources\n`;
        response += `  2. Prioritize high-priority complaints first\n`;
        response += `  3. Use auto-assignment for faster distribution`;
      } else if (highPriorityCount > 0) {
        response += `🎯 **Recommended Actions**:\n`;
        response += `  • Focus on ${highPriorityCount} high-priority complaint${highPriorityCount !== 1 ? 's' : ''} first\n`;
        response += `  • Assign experienced staff to critical issues\n`;
        response += `  • Regular status updates to maintain service quality`;
      } else {
        response += `✅ Manageable workload. Continue monitoring and assigning complaints to available staff members.`;
      }
      
      return response;
    }
    
    if (lowerMsg.includes('staff') || lowerMsg.includes('assign')) {
      const staffCount = context.staffCount || 0;
      const pending = context.pending || 0;
      const inProgress = context.inProgress || 0;
      
      let response = `👥 **Staff Management Insights**\n\n`;
      response += `• Active Staff: ${staffCount} member${staffCount !== 1 ? 's' : ''}\n`;
      response += `• Pending Assignments: ${pending}\n`;
      response += `• In Progress: ${inProgress}\n\n`;
      response += `📋 **Recommendations**:\n`;
      response += `  1. Use location-based assignment for faster resolution\n`;
      response += `  2. Balance workload across all staff members\n`;
      response += `  3. Assign high-priority cases to experienced staff\n`;
      response += `  4. Enable auto-assignment for optimal distribution`;
      
      return response;
    }
    
    if (lowerMsg.includes('trend') || lowerMsg.includes('pattern') || lowerMsg.includes('analytics')) {
      const total = context.totalComplaints || 0;
      const resolved = context.resolved || 0;
      const pending = context.pending || 0;
      const inProgress = context.inProgress || 0;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      let response = `📈 **System Analytics & Trends**\n\n`;
      response += `• Total Complaints: ${total}\n`;
      response += `• Resolved: ${resolved} (${resolutionRate}%)\n`;
      response += `• In Progress: ${inProgress}\n`;
      response += `• Pending: ${pending}\n\n`;
      
      if (context.trend === 'positive') {
        response += `✅ **Status**: Positive trend detected!\n`;
        response += `Your resolution rate is excellent. Keep up the great work and maintain this momentum.`;
      } else {
        response += `⚠️ **Status**: Needs attention\n`;
        response += `Consider increasing staff resources or optimizing assignment processes to improve resolution rates.`;
      }
      
      return response;
    }
    
    if (lowerMsg.includes('summary') || lowerMsg.includes('overview') || lowerMsg.includes('dashboard')) {
      const total = context.totalComplaints || 0;
      const resolved = context.resolved || 0;
      const pending = context.pending || 0;
      const inProgress = context.inProgress || 0;
      const highPriority = context.highPriority || 0;
      
      let response = `📊 **System Dashboard Overview**\n\n`;
      response += `**Complaint Status**:\n`;
      response += `• Total: ${total}\n`;
      response += `• ✅ Resolved: ${resolved}\n`;
      response += `• 🔄 In Progress: ${inProgress}\n`;
      response += `• ⏳ Pending: ${pending}\n`;
      response += `• ⚠️ High Priority: ${highPriority}\n\n`;
      response += `**Staff**: ${context.staffCount || 0} members available\n\n`;
      response += `💡 Ask me about specific areas: pending complaints, staff management, trends, or system analytics.`;
      
      return response;
    }
    
    return `👋 Hello Admin! I'm your RailMate Analytics Assistant.\n\n` +
           `I can help you with:\n` +
           `• 📊 Pending complaints and backlog analysis\n` +
           `• 👥 Staff management and assignment strategies\n` +
           `• 📈 System trends and performance analytics\n` +
           `• 🎯 Dashboard overview and insights\n\n` +
           `What would you like to know?`;
  }

  fallbackStaffResponse(message, context) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('how to') || lowerMsg.includes('resolve')) {
      return `For ${context.currentComplaint || 'complaints'}: 1) Update status to "In Progress" 2) Inspect the reported issue 3) Take corrective action 4) Update with remarks 5) Mark as "Resolved". Add photos if possible.`;
    }
    
    if (lowerMsg.includes('priority') || lowerMsg.includes('urgent')) {
      return `Focus on high-priority complaints first. You have ${context.pendingTasks || 0} pending tasks. ${context.assignedCount > 5 ? 'Consider requesting additional support if workload is high.' : 'Good progress! Keep updating complaint status regularly.'}`;
    }
    
    if (lowerMsg.includes('help') || lowerMsg.includes('stuck')) {
      return `I'm here to help! You can: 1) View assigned complaints 2) Update complaint status 3) Add resolution remarks 4) Upload proof photos 5) Request admin assistance for complex issues.`;
    }
    
    return `Hello! I can help with complaint resolution, priority management, and workflow guidance. What do you need assistance with?`;
  }

  fallbackImageAnalysis(complaintText) {
    const keywords = complaintText.toLowerCase();
    
    let category = 'Infrastructure';
    let severity = 'Medium';
    
    if (keywords.includes('dirty') || keywords.includes('clean') || keywords.includes('garbage')) {
      category = 'Cleanliness';
    } else if (keywords.includes('danger') || keywords.includes('unsafe') || keywords.includes('emergency')) {
      category = 'Safety';
      severity = 'High';
    } else if (keywords.includes('staff') || keywords.includes('rude') || keywords.includes('behavior')) {
      category = 'Staff Behavior';
    } else if (keywords.includes('food') || keywords.includes('meal')) {
      category = 'Food Quality';
    }

    return {
      category,
      severity,
      description: 'Image uploaded successfully. Analysis based on provided description.',
      suggestedAction: `Assign to ${category.toLowerCase()} department for inspection and resolution.`
    };
  }

  // Smart Auto-Assignment - Suggest best staff member
  async suggestAssignment(complaint, staffList) {
    try {
      const prompt = `Suggest the best staff member for this complaint:

Complaint:
- Category: ${complaint.category}
- Priority: ${complaint.priority}
- Location: ${complaint.location || 'Not specified'}
- Description: ${complaint.description}

Available Staff:
${staffList.map((s, i) => `${i + 1}. ${s.name} - Workload: ${s.assignedCount || 0}, Expertise: ${s.expertise || 'General'}`).join('\n')}

Recommend staff member and explain why (one sentence).`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } else {
        // Fallback: assign to staff with lowest workload
        const sorted = staffList.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
        return sorted.length > 0 
          ? `Recommend ${sorted[0].name} (lowest workload: ${sorted[0].assignedCount || 0} assignments)`
          : 'No staff available for assignment';
      }
    } catch (error) {
      console.error('Assignment suggestion error:', error);
      const sorted = staffList.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
      return sorted.length > 0 
        ? `Recommend ${sorted[0].name} (lowest workload: ${sorted[0].assignedCount || 0} assignments)`
        : 'No staff available for assignment';
    }
  }

  // Predictive Analytics - Estimate resolution time
  async predictResolution(complaint, historicalData) {
    try {
      // Check if complaint is location-based (Train) - needs immediate action
      const isOnTrain = complaint.locationType === 'Train' || complaint.trainId;
      const isImmediateCategory = ['Food Quality', 'Cleanliness', 'Safety & Security', 'Medical Emergency'].includes(complaint.category);
      
      // For immediate issues on trains, provide real-time resolution guidance
      if (isOnTrain && isImmediateCategory) {
        const immediateResponses = {
          'Food Quality': 'IMMEDIATE ACTION REQUIRED: Notify pantry manager and train superintendent instantly. Replace meal for passenger. Issue should be resolved within current journey (typically 1-2 hours). Full investigation and vendor action within 24-48 hours.',
          'Cleanliness': 'IMMEDIATE ACTION REQUIRED: Alert cleaning staff on duty. Issue should be resolved within 30-60 minutes during journey. Follow-up inspection within 2 hours.',
          'Safety & Security': 'CRITICAL ALERT: Contact RPF and train security immediately. Response required within 15-30 minutes. Ensure passenger safety is secured during journey.',
          'Medical Emergency': 'CRITICAL EMERGENCY: Alert medical staff/TTE immediately. Contact nearest station with medical facilities. Response time: IMMEDIATE (5-10 minutes).'
        };
        
        if (immediateResponses[complaint.category]) {
          return immediateResponses[complaint.category];
        }
      }

      const prompt = `Based on historical data, predict resolution time for this complaint:

Complaint:
- Category: ${complaint.category}
- Priority: ${complaint.priority}
- Location: ${complaint.locationType || 'Station'}
- Train Journey: ${isOnTrain ? 'Yes - requires immediate attention' : 'No'}
- Description length: ${complaint.description.length} chars

Historical Data:
- Average resolution time for ${complaint.category}: ${historicalData.avgTime || 'Unknown'}
- Success rate: ${historicalData.successRate || 'Unknown'}
- Similar resolved: ${historicalData.similarResolved || 0}

IMPORTANT: If complaint is from a moving train and involves immediate needs (food, cleanliness, safety), 
resolution must be DURING THE JOURNEY (within hours), not days.

Provide: 
1. Estimated resolution time (consider journey context)
2. Confidence level
3. Key factors

Keep response brief (2-3 sentences).`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } else {
        return this.fallbackPrediction(complaint, isOnTrain, isImmediateCategory);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      return this.fallbackPrediction(complaint, false, false);
    }
  }

  fallbackPrediction(complaint, isOnTrain = false, isImmediateCategory = false) {
    // For immediate issues on trains
    if (isOnTrain && isImmediateCategory) {
      return `IMMEDIATE RESOLUTION REQUIRED: This issue must be addressed during the passenger's journey (within 1-3 hours). Staff on duty should take immediate action. Follow-up investigation within 24-48 hours.`;
    }
    
    // For non-immediate or station-based issues
    const timeEstimates = {
      critical: '24-48 hours',
      high: '2-4 days',
      medium: '4-7 days',
      low: '7-14 days'
    };
    
    const time = timeEstimates[complaint.priority?.toLowerCase()] || '5-7 days';
    return `Estimated resolution time: ${time}. Based on priority level and category. Actual time may vary depending on complexity and staff availability.`;
  }
}

export default new ChatbotService();
