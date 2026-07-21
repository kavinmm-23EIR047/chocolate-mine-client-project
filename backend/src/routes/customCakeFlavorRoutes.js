const express = require('express');
const {
  getAllFlavors,
  getAllFlavorsAdmin,
  createFlavor,
  updateFlavor,
  deleteFlavor
} = require('../controllers/customCakeFlavorController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public route
router.get('/', getAllFlavors);

// Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/admin', getAllFlavorsAdmin);
router.post('/', createFlavor);

router.put('/:id', updateFlavor);
router.delete('/:id', deleteFlavor);

module.exports = router;
