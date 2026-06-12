const GoogleReview = require('../models/GoogleReview');
const googleReviewsSyncService = require('../services/googleReviewsSyncService');
const googleReviewsExportService = require('../services/googleReviewsExportService');
const { calculateStats } = require('../utils/googleReviewsHelper');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const fs = require('fs');
const config = require('../config/googlePlaces');

// @desc    Get all stored Google reviews
// @route   GET /api/v1/google-reviews
exports.getReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const rating = req.query.rating ? parseInt(req.query.rating, 10) : null;
  const search = req.query.search || '';

  const query = {};
  
  // For frontend public API, only show visible ones
  if (!req.user || req.user.role !== 'admin') {
    query.isVisible = true;
  }
  
  if (rating) query.rating = rating;
  if (search) {
    query.$or = [
      { authorName: { $regex: search, $options: 'i' } },
      { text: { $regex: search, $options: 'i' } }
    ];
  }

  const reviews = await GoogleReview.find(query)
    .sort({ time: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await GoogleReview.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get latest reviews for homepage
// @route   GET /api/v1/google-reviews/latest
exports.getLatestReviews = asyncHandler(async (req, res) => {
  const reviews = await GoogleReview.find({ isVisible: true })
    .sort({ time: -1 })
    .limit(10);
    
  res.status(200).json({
    status: 'success',
    data: reviews
  });
});

// @desc    Get review statistics
// @route   GET /api/v1/google-reviews/stats
exports.getStats = asyncHandler(async (req, res) => {
  const reviews = await GoogleReview.find({ isVisible: true }).lean();
  const stats = calculateStats(reviews);
  
  // Also get the last sync time
  const lastReview = await GoogleReview.findOne().sort({ syncedAt: -1 });
  
  res.status(200).json({
    status: 'success',
    data: {
      ...stats,
      lastSyncTime: lastReview ? lastReview.syncedAt : null,
      isEnabled: config.ENABLED
    }
  });
});

// @desc    Manually trigger sync
// @route   GET /api/v1/google-reviews/sync
// @route   GET /api/v1/google-reviews/refresh
exports.syncReviews = asyncHandler(async (req, res, next) => {
  if (!config.ENABLED) {
    return next(new AppError('Google Reviews integration is disabled in settings', 400));
  }
  
  const result = await googleReviewsSyncService.syncReviews();
  
  res.status(200).json({
    status: 'success',
    message: 'Google Reviews synced successfully',
    data: result
  });
});

// @desc    Webhook for scheduled sync
// @route   POST /api/v1/google-reviews/webhook/sync
exports.webhookSync = asyncHandler(async (req, res) => {
  // Add some basic webhook secret verification if needed
  if (!config.ENABLED) return res.status(200).json({ status: 'ignored', message: 'Disabled' });
  
  const result = await googleReviewsSyncService.syncReviews();
  res.status(200).json({ status: 'success', data: result });
});

// @desc    Export to Excel
// @route   GET /api/v1/google-reviews/export/excel
exports.exportExcel = asyncHandler(async (req, res) => {
  const filePath = await googleReviewsExportService.exportReviewsToExcel();
  
  res.download(filePath, 'google_reviews.xlsx', (err) => {
    if (err) {
      console.error('Download error:', err);
    }
    // Cleanup file after download
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 60000);
  });
});

// @desc    Toggle review visibility
// @route   PUT /api/v1/google-reviews/:id/hide
exports.toggleVisibility = asyncHandler(async (req, res, next) => {
  const review = await GoogleReview.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  
  review.isVisible = !review.isVisible;
  await review.save();
  
  res.status(200).json({
    status: 'success',
    data: review
  });
});

// @desc    Delete specific Google review
// @route   DELETE /api/v1/google-reviews/:id
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await GoogleReview.findByIdAndDelete(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  
  res.status(200).json({
    status: 'success',
    message: 'Review deleted successfully'
  });
});
