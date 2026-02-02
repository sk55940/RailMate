import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Service for complaint analysis using Google Gemini
 */
class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Analyze complaint and extract insights
   * @param {string} title - Complaint title
   * @param {string} description - Complaint description
   * @returns {Object} AI analysis results
   */
  async analyzeComplaint(title, description) {
    try {
      const prompt = `
Analyze the following railway complaint and provide:
1. Category (choose one: Train-related, Station-related, Staff-related, Cleanliness, Safety, Ticketing, Facilities, Other)
2. Priority (choose one: Low, Medium, High, Critical)
3. Sentiment (choose one: Positive, Neutral, Negative, Frustrated)
4. An analytical summary (max 100 words) - DO NOT just repeat the complaint. Instead, provide:
   - Key issues identified
   - Potential impact on passengers
   - Suggested action items or focus areas

Complaint Title: ${title}
Complaint Description: ${description}

Respond ONLY in this exact JSON format (no additional text):
{
  "category": "category_here",
  "priority": "priority_here",
  "sentiment": "sentiment_here",
  "summary": "Analytical summary focusing on key issues, impact, and recommendations - NOT a repeat of the description"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate that summary is analytical, not just a repeat
      let summary = analysis.summary || '';
      
      // Check if summary is too similar to description (simple heuristic)
      const summaryWords = summary.toLowerCase().split(/\s+/).slice(0, 15);
      const descWords = description.toLowerCase().split(/\s+/).slice(0, 15);
      const matchCount = summaryWords.filter(word => descWords.includes(word)).length;
      const similarityRatio = matchCount / Math.max(summaryWords.length, 1);

      // If summary is >70% similar to description, regenerate
      if (similarityRatio > 0.7 || summary.length < 50) {
        console.log('Regenerating analytical summary due to high similarity or short length');
        summary = await this.generateAnalyticalSummary(title, description, analysis.category, analysis.priority);
      }

      return {
        category: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        summary,
      };
    } catch (error) {
      console.error('AI Analysis Error:', error.message);
      // Use intelligent fallback when AI is unavailable
      return this.intelligentFallback(title, description);
    }
  }

  /**
   * Intelligent fallback analysis when AI is unavailable
   */
  intelligentFallback(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    // Category detection based on keywords
    let category = 'Other';
    if (text.match(/train|delay|late|cancel|coach|compartment|ac|berth|seat|reservation/)) {
      category = 'Train-related';
    } else if (text.match(/station|platform|waiting|room|toilet|parking|entry|exit/)) {
      category = 'Station-related';
    } else if (text.match(/staff|employee|conductor|tte|behavior|rude|help/)) {
      category = 'Staff-related';
    } else if (text.match(/clean|dirty|hygiene|wash|garbage|smell|bathroom|toilet/)) {
      category = 'Cleanliness';
    } else if (text.match(/safe|danger|security|theft|harass|emergency|accident/)) {
      category = 'Safety';
    } else if (text.match(/ticket|booking|refund|payment|fare|charge|price/)) {
      category = 'Ticketing';
    } else if (text.match(/food|water|facility|amenity|wifi|charging|luggage/)) {
      category = 'Facilities';
    }

    // Priority detection based on keywords
    let priority = 'Medium';
    if (text.match(/urgent|critical|emergency|danger|serious|immediate|asap/)) {
      priority = 'Critical';
    } else if (text.match(/important|high|bad|worst|terrible|awful|horrible/)) {
      priority = 'High';
    } else if (text.match(/minor|small|little|slight/)) {
      priority = 'Low';
    }

    // Sentiment detection
    let sentiment = 'Neutral';
    if (text.match(/angry|frustrated|disgust|worst|terrible|horrible|pathetic|useless/)) {
      sentiment = 'Frustrated';
    } else if (text.match(/bad|poor|disappoint|unhappy|unsatisfied|not good/)) {
      sentiment = 'Negative';
    } else if (text.match(/good|great|excellent|happy|satisfied|thank/)) {
      sentiment = 'Positive';
    }

    // Use the improved analytical summary generator
    const summary = this.createFallbackAnalysis(description, category, priority);

    return {
      category,
      priority,
      sentiment,
      summary,
    };
  }

  /**
   * Categorize complaint
   */
  async categorizeComplaint(title, description) {
    try {
      const prompt = `
Categorize this railway complaint into ONE of these categories:
- Train-related (issues with trains, delays, cancellations)
- Station-related (station facilities, platforms)
- Staff-related (staff behavior, service)
- Cleanliness (hygiene issues)
- Safety (security concerns)
- Ticketing (booking, refund issues)
- Facilities (amenities, infrastructure)
- Other (anything else)

Title: ${title}
Description: ${description}

Respond with ONLY the category name, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const category = response.text().trim();

      // Validate category
      const validCategories = [
        'Train-related',
        'Station-related',
        'Staff-related',
        'Cleanliness',
        'Safety',
        'Ticketing',
        'Facilities',
        'Other',
      ];

      return validCategories.includes(category) ? category : 'Other';
    } catch (error) {
      console.error('Categorization Error:', error);
      return 'Other';
    }
  }

  /**
   * Detect priority level
   */
  async detectPriority(description) {
    try {
      const prompt = `
Rate the urgency/priority of this railway complaint as: Critical, High, Medium, or Low.

Critical: Life-threatening, major safety issues, severe service disruption
High: Significant problems affecting many passengers, urgent attention needed
Medium: Notable issues that should be addressed soon
Low: Minor inconveniences

Description: ${description}

Respond with ONLY the priority level (Critical, High, Medium, or Low), nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const priority = response.text().trim();

      // Validate priority
      const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
      return validPriorities.includes(priority) ? priority : 'Medium';
    } catch (error) {
      console.error('Priority Detection Error:', error);
      return 'Medium';
    }
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(text) {
    try {
      const prompt = `
Analyze the sentiment of this text and classify it as: Positive, Neutral, Negative, or Frustrated.

Text: ${text}

Respond with ONLY the sentiment (Positive, Neutral, Negative, or Frustrated), nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const sentiment = response.text().trim();

      // Validate sentiment
      const validSentiments = ['Positive', 'Neutral', 'Negative', 'Frustrated'];
      return validSentiments.includes(sentiment) ? sentiment : 'Neutral';
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'Neutral';
    }
  }

  /**
   * Generate analytical summary of complaint
   */
  async generateAnalyticalSummary(title, description, category, priority) {
    try {
      const prompt = `
As a railway complaint analyst, provide a concise analytical summary (50-80 words) for this complaint:

Title: ${title}
Description: ${description}
Category: ${category}
Priority: ${priority}

Your analysis should include:
1. The core issue(s) identified
2. Potential impact on passenger experience
3. Recommended focus areas for resolution

DO NOT simply repeat the complaint text. Provide insights and analysis.

Provide only the analytical summary, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      return summary.substring(0, 500); // Limit length
    } catch (error) {
      console.error('Analytical Summary Generation Error:', error);
      // Fallback to intelligent summary
      return this.createFallbackAnalysis(description, category, priority);
    }
  }

  /**
   * Create fallback analytical summary when AI is unavailable
   */
  createFallbackAnalysis(description, category, priority) {
    const text = description.toLowerCase();
    
    // Identify key issues
    const issues = [];
    const impacts = [];
    const recommendations = [];

    // Cleanliness issues
    if (text.match(/dirty|filthy|unclean|unhygienic|smell|stink|garbage|waste/)) {
      issues.push('hygiene and cleanliness standards');
      impacts.push('health and safety concerns for passengers');
      recommendations.push('immediate sanitation and regular maintenance schedules');
    }

    // Food quality issues
    if (text.match(/food|pantry|meal|eating|undercooked|stale|rotten|expired/)) {
      issues.push('food quality and safety standards');
      impacts.push('passenger health risks and dissatisfaction');
      recommendations.push('strict quality control and vendor monitoring');
    }

    // Infrastructure/equipment issues
    if (text.match(/broken|damaged|not working|malfunction|out of order|faulty/)) {
      issues.push('infrastructure maintenance and equipment functionality');
      impacts.push('reduced passenger convenience and potential safety risks');
      recommendations.push('prompt repair and preventive maintenance protocols');
    }

    // Staff behavior issues
    if (text.match(/rude|unhelpful|behavior|attitude|unprofessional|abuse/)) {
      issues.push('staff professionalism and customer service standards');
      impacts.push('negative passenger experience and brand reputation');
      recommendations.push('staff training and service quality improvement programs');
    }

    // Safety concerns
    if (text.match(/danger|unsafe|accident|injury|security|theft|harassment/)) {
      issues.push('passenger safety and security measures');
      impacts.push('critical safety risks requiring urgent intervention');
      recommendations.push('immediate safety audit and enhanced security protocols');
    }

    // Delay/scheduling issues
    if (text.match(/delay|late|cancel|reschedule|timing|schedule/)) {
      issues.push('service reliability and punctuality');
      impacts.push('passenger inconvenience and travel plan disruptions');
      recommendations.push('operational efficiency improvements and better communication');
    }

    // Construct analytical summary
    const issueText = issues.length > 0 ? issues[0] : 'service quality';
    const impactText = impacts.length > 0 ? impacts[0] : 'passenger experience';
    const recommendationText = recommendations.length > 0 ? recommendations[0] : 'service improvement measures';

    const urgency = priority === 'Critical' || priority === 'High' 
      ? 'requires immediate attention' 
      : priority === 'Medium'
      ? 'warrants prompt resolution'
      : 'should be addressed systematically';

    return `This complaint highlights concerns regarding ${issueText} in ${category.toLowerCase()} operations, indicating ${impactText}. The issue ${urgency} to prevent recurrence and maintain service excellence. Recommended actions include ${recommendationText} to ensure passenger satisfaction and operational standards.`;
  }

  /**
   * Generate summary of complaint
   */
  async generateSummary(description) {
    try {
      const prompt = `
Summarize this railway complaint in 50 words or less. Focus on the main issue and key details.

Complaint: ${description}

Provide only the summary, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      return summary.substring(0, 300); // Limit length
    } catch (error) {
      console.error('Summary Generation Error:', error);
      return description.substring(0, 100) + '...';
    }
  }

  /**
   * Generate response suggestions for staff
   */
  async generateResponseSuggestion(complaint) {
    try {
      const prompt = `
Generate a professional response template for railway staff to address this complaint:

Category: ${complaint.category}
Priority: ${complaint.priority}
Description: ${complaint.description}

Provide a brief, professional response template (max 100 words).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Response Suggestion Error:', error);
      return null;
    }
  }

  /**
   * Chatbot response generator
   */
  async generateChatbotResponse(userMessage, context = '') {
    try {
      const prompt = `
You are RailMate AI, a helpful assistant for railway complaint management.

${context}

User: ${userMessage}

Provide a helpful, professional response. Keep it concise and friendly.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Chatbot Error:', error);
      return 'I apologize, but I am unable to process your request at the moment. Please try again later.';
    }
  }
}

export default new AIService();
