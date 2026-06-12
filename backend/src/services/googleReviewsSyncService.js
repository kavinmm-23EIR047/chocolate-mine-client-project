const GoogleReview = require('../models/GoogleReview');
const { fetchReviewsFromGoogle } = require('./googleReviewsService');

exports.syncReviews = async () => {
  try {
    console.log('🔄 Starting Google Reviews Sync...');
    const { reviews } = await fetchReviewsFromGoogle();

    let newCount = 0;
    let updatedCount = 0;

    for (const reviewData of reviews) {
      // Upsert logic: Update if exists based on reviewId, otherwise insert
      const result = await GoogleReview.updateOne(
        { reviewId: reviewData.reviewId },
        { 
          $set: reviewData,
          $setOnInsert: { isVisible: true } // Only set true on initial insert
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) newCount++;
      else if (result.modifiedCount > 0) updatedCount++;
    }

    console.log(`✅ Google Reviews Sync Complete. New: ${newCount}, Updated: ${updatedCount}`);
    
    return {
      success: true,
      newCount,
      updatedCount,
      totalProcessed: reviews.length
    };
  } catch (error) {
    console.error('❌ Google Reviews Sync Failed:', error.message);
    // Ideally send email to admin here if it fails repeatedly
    throw error;
  }
};
