const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all admin routes - admin only
router.use(protect);
router.use(restrictTo('admin'));

// --- Staff Management ---
// @route   POST /api/admin/staff/create
router.post('/staff/create', adminController.createStaff);
// @route   GET /api/admin/staff
router.get('/staff', adminController.getAllStaff);
// @route   PATCH /api/admin/staff/:id
router.patch('/staff/:id', adminController.updateStaff);
// @route   DELETE /api/admin/staff/:id
router.delete('/staff/:id', adminController.deleteStaff);

// --- Dashboard ---
router.get('/dashboard', adminController.getDashboard);

// --- Order Management ---
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.get('/orders/:id/invoice', adminController.downloadInvoice);
router.post('/orders/:id/resend-invoice', adminController.resendInvoice);

// --- Broadcast Notification ---
// @route   POST /api/admin/broadcast
router.post('/broadcast', adminController.broadcastNotification);

// --- Review Management ---
const reviewController = require('../controllers/reviewController');
router.get('/reviews', reviewController.getAllReviews);
router.patch('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);

// --- Social Media Dashboard ---
const socialMediaController = require('../controllers/socialMediaController');
router.get('/social-media/google', socialMediaController.getGoogleAnalytics);
router.get('/social-media/instagram', socialMediaController.getInstagramStats);

module.exports = router;