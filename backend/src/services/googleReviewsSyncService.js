const GoogleReview = require('../models/GoogleReview');
const { fetchReviewsFromGoogle } = require('./googleReviewsService');

exports.syncReviews = async () => {
  try {
    console.log('🔄 Starting Google Reviews Sync...');
    const { reviews } = await fetchReviewsFromGoogle();

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let savedCount = 0;

    const DUMMY_NAMES = [
      'John Doe', 'Sarah Smith', 'Michael Johnson', 'Emily Davis', 'David Wilson',
      'Priya Sharma', 'Rahul Verma', 'Anita Menon', 'Vikram Singh', 'Meera Reddy'
    ];

    for (const reviewData of reviews) {
      // Validate before saving
      let skipReason = null;
      if (!reviewData.reviewId) skipReason = 'reviewId is missing or empty';
      else if (!reviewData.authorName || DUMMY_NAMES.includes(reviewData.authorName)) skipReason = 'authorName is missing or fake';
      else if (isNaN(reviewData.rating) || reviewData.rating < 1 || reviewData.rating > 5) skipReason = 'rating is invalid';
      else if (!reviewData.text || reviewData.text.trim() === '') skipReason = 'text is missing or empty';

      if (skipReason) {
        console.log(`Skipped invalid review: missing ${skipReason}`);
        skippedCount++;
        continue;
      }

      // Remove isVisible from reviewData so it doesn't overwrite admin settings or conflict with $setOnInsert
      const { isVisible, ...updateData } = reviewData;
      
      // Upsert logic: Update if exists based on reviewId, otherwise insert
      const result = await GoogleReview.updateOne(
        { reviewId: reviewData.reviewId },
        { 
          $set: updateData,
          $setOnInsert: { isVisible: true } // Only set true on initial insert
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) newCount++;
      else if (result.modifiedCount > 0) updatedCount++;
      savedCount++;
    }

    console.log(`Saved: ${savedCount} reviews, Skipped: ${skippedCount} reviews`);
    console.log(`✅ Google Reviews Sync Complete. New: ${newCount}, Updated: ${updatedCount}`);
    
    // Trigger Excel sync asynchronously so it doesn't block
    const excelService = require('./excelService');
    excelService.initializeExcel();
    
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
