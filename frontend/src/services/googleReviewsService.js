import api from '../utils/api';

const GOOGLE_REVIEWS_URL = '/google-reviews';

const googleReviewsService = {
  // Get all reviews (paginated)
  getReviews: async (params) => {
    const response = await api.get(GOOGLE_REVIEWS_URL, { params });
    return response.data;
  },

  // Get latest reviews for homepage
  getLatestReviews: async () => {
    const response = await api.get(`${GOOGLE_REVIEWS_URL}/latest`);
    return response.data;
  },

  // Get review stats
  getStats: async () => {
    const response = await api.get(`${GOOGLE_REVIEWS_URL}/stats`);
    return response.data;
  },

  // Manually trigger sync
  syncReviews: async () => {
    const response = await api.get(`${GOOGLE_REVIEWS_URL}/sync`);
    return response.data;
  },

  // Toggle visibility
  toggleVisibility: async (id) => {
    const response = await api.put(`${GOOGLE_REVIEWS_URL}/${id}/hide`);
    return response.data;
  },

  // Delete review
  deleteReview: async (id) => {
    const response = await api.delete(`${GOOGLE_REVIEWS_URL}/${id}`);
    return response.data;
  },

  // Get export URL
  getExportUrl: () => {
    // using api.defaults.baseURL to get backend URL
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api/v1';
    return `${baseUrl}${GOOGLE_REVIEWS_URL}/export/excel`;
  }
};

export default googleReviewsService;
