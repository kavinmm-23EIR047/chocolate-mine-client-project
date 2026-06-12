const apifyReviewsService = require('./apifyReviewsService');

exports.fetchReviewsFromGoogle = async () => {
  try {
    // Try to fetch real reviews from Apify
    const reviews = await apifyReviewsService.fetchReviews();
    
    if (reviews && reviews.length > 0) {
      return { reviews };
    }
    
    return { reviews: [] };
  } catch (error) {
    console.error('Error fetching reviews from Apify (googleReviewsService.js):', error.message);
    throw error;
  }
};
