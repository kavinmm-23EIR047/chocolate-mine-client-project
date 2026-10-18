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

// --- User Management / Exports ---
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:userId/orders', adminController.getUserOrders);
// @route   GET /api/admin/export-users
router.get('/export-users', adminController.exportUsers);

// --- Dashboard ---
router.get('/dashboard', adminController.getDashboard);

// --- Order Management ---
const orderController = require('../controllers/orderController');
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.patch('/orders/:id/status', orderController.updateStatus);
router.post('/orders/:id/delivery-otp/send', orderController.sendDeliveryOtp);
router.post('/orders/:id/delivery-otp/verify', orderController.verifyDeliveryOtp);
router.get('/orders/:id/invoice', adminController.downloadInvoice);
router.post('/orders/:id/resend-invoice', adminController.resendInvoice);

// --- KOT Management ---
const staffController = require('../controllers/staffController');
router.get('/orders/:id/kot', staffController.getKOTData);
router.get('/orders/:id/kot/print', staffController.printKOT);
router.patch('/orders/:id/print-kot', staffController.markKOTPrinted);

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

// --- Category Management (Admin alias) ---
const categoryController = require('../controllers/categoryController');
const upload = require('../middleware/upload');
router.get('/categories', categoryController.getCategories);
router.post('/categories', upload.single('image'), categoryController.createCategory);
router.put('/categories/:id', upload.single('image'), categoryController.updateCategory);
router.patch('/categories/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

module.exports = router;
