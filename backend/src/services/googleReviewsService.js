const axios = require('axios');
const config = require('../config/googlePlaces');
const { normalizeGoogleReview } = require('../utils/googleReviewsHelper');

exports.fetchReviewsFromGoogle = async () => {
  if (!config.ENABLED || !config.API_KEY || !config.PLACE_ID) {
    throw new Error('Google Places API is disabled or missing credentials in environment');
  }

  try {
    const response = await axios.get(config.BASE_URL, {
      params: {
        place_id: config.PLACE_ID,
        fields: 'reviews,user_ratings_total,rating',
        key: config.API_KEY,
        reviews_sort: 'newest'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google API Error: ${response.data.status} - ${response.data.error_message || ''}`);
    }

    const { result } = response.data;
    
    // Normalize reviews
    const reviews = (result.reviews || []).map(normalizeGoogleReview);

    return {
      reviews,
      placeRating: result.rating,
      totalRatings: result.user_ratings_total
    };
  } catch (error) {
    console.error('Error fetching Google Reviews:', error.message);
    throw error;
  }
};
