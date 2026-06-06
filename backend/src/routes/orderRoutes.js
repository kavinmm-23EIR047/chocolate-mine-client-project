const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');

const router = express.Router();

/**
 * @route   GET /api/v1/orders/track/:orderId
 * @desc    Get tracking data by order ID or code (PUBLIC so email links work without login)
 * @access  Public
 */
router.get('/track/:orderId', orderController.getTrackingData);

// All order routes below require authentication
router.use(protect);

/**
 * @route   POST /api/v1/orders/place
 * @desc    Place a new order (ONLINE PAYMENT ONLY)
 * @access  Protected
 */
router.post('/place', orderController.placeOrder);

/**
 * @route   GET /api/v1/orders/my
 * @desc    Get current user's orders
 * @access  Protected
 * @note    Specific route MUST be placed before dynamic routes like /:id
 */
router.get('/my', orderController.getMyOrders);

/**
 * @route   GET /api/v1/orders/
 * @desc    Get all orders
 * @access  Staff only (Admin uses separate admin routes)
 */
router.get('/', restrictTo('staff'), orderController.getAllOrders);

/**
 * @route   GET /api/v1/orders/by-number/:orderNumber
 * @desc    Get order by user-friendly order number (e.g., K123456)
 * @access  Protected
 */
router.get('/by-number/:orderNumber', orderController.getOrderByNumber);

/**
 * @route   GET /api/v1/orders/:id/invoice
 * @desc    Download order invoice
 * @access  Protected (Owner or Admin/Staff)
 */
router.get('/:id/invoice', orderController.downloadInvoice);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get single order details
 * @access  Protected
 */
router.get('/:id', orderController.getOrder);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status (Staff only: confirmed → out_for_delivery → delivered)
 * @access  Staff only (Admin cannot update status)
 */
router.patch('/:id/status', restrictTo('staff'), orderController.updateStatus);

/**
 * @route   POST /api/v1/orders/:id/generate-otp
 * @desc    Generate and send OTP for delivery verification (Staff only)
 * @access  Staff only
 */
router.post('/:id/generate-otp', restrictTo('staff'), orderController.generateDeliveryOtp);

/**
 * @route   POST /api/v1/orders/:id/verify-otp
 * @desc    Verify OTP and complete delivery (Staff only)
 * @access  Staff only
 */
router.post('/:id/verify-otp', restrictTo('staff'), orderController.verifyDeliveryOtp);

module.exports = router;