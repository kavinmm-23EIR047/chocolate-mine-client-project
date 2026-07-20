const express = require('express');
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');

const router = express.Router();

// Staff only access (admin should also access staff routes for testing/management)
router.use(protect, restrictTo('staff', 'admin'));

// Staff Dashboard - shows delivery stats
router.get('/dashboard', staffController.getStaffDashboard);

// Get orders by status
router.get('/orders/new', staffController.getNewOrders);
router.get('/orders/processing', staffController.getProcessingOrders);
router.get('/orders/packed', staffController.getPackedOrders);
router.get('/orders/out-for-delivery', staffController.getOutForDeliveryOrders);
router.get('/orders/delivered', staffController.getDeliveredOrders);

// In-shop order routes (must be before :id param routes)
router.post('/orders/in-shop', staffController.createInShopOrder);
router.get('/orders/in-shop', staffController.getInShopOrders);

// Get single order details
router.get('/orders/:id', staffController.getOrderDetails);

// KOT routes (kitchen order ticket)
router.get('/orders/:id/kot', staffController.getKOTData);
router.get('/orders/:id/kot/print', staffController.printKOT);
router.patch('/orders/:id/print-kot', staffController.markKOTPrinted);

// Status update (confirmed → processing → packed → out_for_delivery → delivered)
// No OTP required - smooth direct transitions
router.patch('/orders/:id/kitchen-status', staffController.updateKitchenStatus);

module.exports = router;