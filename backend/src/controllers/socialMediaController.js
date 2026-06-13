const socialMediaService = require('../services/socialMediaService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Google Analytics Metrics
// @route   GET /api/admin/social-media/google
// @access  Admin Only
exports.getGoogleAnalytics = asyncHandler(async (req, res) => {
  const result = await socialMediaService.getGoogleAnalyticsMetrics();
  
  res.status(200).json({
    status: 'success',
    data: result.data,
    message: result.message || null
  });
});

// @desc    Get Instagram Metrics
// @route   GET /api/admin/social-media/instagram
// @access  Admin Only
exports.getInstagramStats = asyncHandler(async (req, res) => {
  const result = await socialMediaService.getInstagramMetrics();
  
  res.status(200).json({
    status: 'success',
    data: result.data,
    message: result.message || null
  });
});
