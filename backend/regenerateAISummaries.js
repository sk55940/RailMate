import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/Complaint.js';
import aiService from './services/aiService.js';

dotenv.config();

/**
 * Script to regenerate AI summaries for existing complaints
 * This will update complaints where the AI summary is just a copy of the description
 */

async function regenerateAISummaries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all complaints
    const complaints = await Complaint.find({});
    console.log(`📊 Found ${complaints.length} complaints to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const complaint of complaints) {
      try {
        // Check if AI summary is too similar to description
        const summary = complaint.aiSummary || '';
        const description = complaint.description || '';

        // Simple similarity check
        const summaryWords = summary.toLowerCase().split(/\s+/).slice(0, 15);
        const descWords = description.toLowerCase().split(/\s+/).slice(0, 15);
        const matchCount = summaryWords.filter(word => descWords.includes(word)).length;
        const similarityRatio = matchCount / Math.max(summaryWords.length, 1);

        // If similarity is > 70% or summary is too short/empty, regenerate
        if (similarityRatio > 0.7 || summary.length < 50 || !summary) {
          console.log(`\n🔄 Regenerating AI analysis for complaint: ${complaint._id}`);
          console.log(`   Title: ${complaint.title.substring(0, 50)}...`);
          console.log(`   Old Summary Similarity: ${(similarityRatio * 100).toFixed(1)}%`);

          // Generate new analytical summary
          const analysis = await aiService.analyzeComplaint(
            complaint.title,
            complaint.description
          );

          // Update complaint
          complaint.aiSummary = analysis.summary;
          complaint.aiCategory = analysis.category;
          complaint.aiPriority = analysis.priority;
          complaint.sentiment = analysis.sentiment;

          await complaint.save();

          console.log(`   ✅ Updated with new AI analysis`);
          console.log(`   New Summary: ${analysis.summary.substring(0, 100)}...`);
          updatedCount++;

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`⏭️  Skipping complaint ${complaint._id} (already has good analysis)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing complaint ${complaint._id}:`, error.message);
      }
    }

    console.log('\n✨ Summary:');
    console.log(`   Total Complaints: ${complaints.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('\n✅ AI summary regeneration complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the script
regenerateAISummaries();
