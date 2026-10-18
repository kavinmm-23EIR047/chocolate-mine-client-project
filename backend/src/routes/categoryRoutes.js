const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes - anyone can view categories
router.get('/', categoryController.getCategories);
router.get('/active', categoryController.getActiveCategories);
router.get('/:id', categoryController.getCategory);

// Admin/Staff only routes - manage categories
router.post('/', protect, restrictTo('admin', 'staff'), upload.single('image'), categoryController.createCategory);
router.put('/:id', protect, restrictTo('admin', 'staff'), upload.single('image'), categoryController.updateCategory);
router.patch('/:id', protect, restrictTo('admin', 'staff'), upload.single('image'), categoryController.updateCategory);
router.delete('/:id', protect, restrictTo('admin', 'staff'), categoryController.deleteCategory);

module.exports = router;