/**
 * Helper to calculate aggregate statistics for reviews
 */
exports.calculateStats = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  let totalScore = 0;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((review) => {
    const rating = Math.round(review.rating);
    totalScore += rating;
    if (ratingDistribution[rating] !== undefined) {
      ratingDistribution[rating]++;
    }
  });

  const averageRating = (totalScore / reviews.length).toFixed(1);

  // OVERRIDE: The scraper only fetches a subset of reviews. 
  // We hardcode the actual Google Maps stats here as requested.
  return {
    averageRating: 4.9,
    totalReviews: Math.max(475, reviews.length),
    ratingDistribution
  };
};

/**
 * Normalizes Google Places Review object to our Schema format
 */
exports.normalizeGoogleReview = (googleReview) => {
  return {
    // Generate a pseudo-ID if Google doesn't provide one (it usually doesn't expose a stable review ID in the basic Place Details API)
    reviewId: googleReview.author_url ? Buffer.from(googleReview.author_url + googleReview.time).toString('base64') : `rev_${googleReview.time}_${Math.random().toString(36).substring(7)}`,
    authorName: googleReview.author_name,
    authorUrl: googleReview.author_url,
    profilePhotoUrl: googleReview.profile_photo_url,
    rating: googleReview.rating,
    text: googleReview.text,
    time: new Date(googleReview.time * 1000), // Convert UNIX timestamp to Date
    language: googleReview.language,
    syncedAt: new Date()
  };
};
