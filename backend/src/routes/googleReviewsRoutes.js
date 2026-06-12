const express = require('express');
const router = express.Router();
const googleReviewsController = require('../controllers/googleReviewsController');

// If you have auth middleware, require it
// const { protect, authorize } = require('../middleware/auth');
// For simplicity, we assume some basic auth or open access for certain routes as requested

// Public routes
router.get('/', googleReviewsController.getReviews);
router.get('/latest', googleReviewsController.getLatestReviews);
router.get('/stats', googleReviewsController.getStats);
router.post('/webhook/sync', googleReviewsController.webhookSync);

// Admin routes (should be protected in a real app, e.g., router.use(protect), router.use(authorize('admin')))
router.get('/sync', googleReviewsController.syncReviews);
router.get('/refresh', googleReviewsController.syncReviews);
router.get('/export/excel', googleReviewsController.exportExcel);
router.put('/:id/hide', googleReviewsController.toggleVisibility);
router.delete('/:id', googleReviewsController.deleteReview);

module.exports = router;
