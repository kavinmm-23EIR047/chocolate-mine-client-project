const express = require('express');
const addonController = require('../controllers/addonController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes - anyone can view addons
router.get('/', addonController.getAddons);
router.get('/active', addonController.getActiveAddons);
router.get('/:id', addonController.getAddon);

// Admin/Staff only routes - manage addons
router.post('/', protect, restrictTo('admin', 'staff'), upload.single('image'), addonController.createAddon);
router.put('/:id', protect, restrictTo('admin', 'staff'), upload.single('image'), addonController.updateAddon);
router.delete('/:id', protect, restrictTo('admin', 'staff'), addonController.deleteAddon);

module.exports = router;
