module.exports = {
  PLACE_ID: process.env.GOOGLE_PLACE_ID || 'ChIJAz8zUx1ZqDsR_GA6U31D-dA',
  API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  BASE_URL: 'https://maps.googleapis.com/maps/api/place/details/json',
  MAX_RESULTS: parseInt(process.env.GOOGLE_REVIEWS_MAX_RESULTS, 10) || 5,
  ENABLED: process.env.GOOGLE_REVIEWS_ENABLED === 'true'
};
