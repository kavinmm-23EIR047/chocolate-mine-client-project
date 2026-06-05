const express = require('express');
const router = express.Router();
const customCakeController = require('../controllers/customCakeController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/flavours', customCakeController.getFlavours);
router.get('/flavours/:id', customCakeController.getFlavourById);
router.get('/themes', customCakeController.getThemes);
router.get('/colors', customCakeController.getColors);
router.get('/theme-colors', customCakeController.getThemeColors);

// Protected admin routes
router.use(protect, restrictTo('admin'));

// Seed defaults
router.post('/seed-defaults', customCakeController.seedDefaults);

// Flavours (Admin)
router.post('/flavours', customCakeController.createFlavour);
router.put('/flavours/:id', customCakeController.updateFlavour);
router.delete('/flavours/:id', customCakeController.deleteFlavour);

// Themes
router.post('/themes', customCakeController.createTheme);
router.route('/themes/:id')
  .put(customCakeController.updateTheme)
  .delete(customCakeController.deleteTheme);

// Theme Flavours
router.route('/themes/:id/flavours')
  .post(customCakeController.addThemeFlavour);

router.route('/themes/:id/flavours/:flavourId')
  .put(customCakeController.updateThemeFlavour)
  .delete(customCakeController.deleteThemeFlavour);

// Theme Colors (Embedded)
router.route('/themes/:id/colors')
  .post(customCakeController.addThemeColor);

router.route('/themes/:id/colors/:colorId')
  .put(customCakeController.updateThemeColor)
  .delete(customCakeController.deleteThemeColor);

router.route('/themes/:id/colors/:colorId/images')
  .post(upload.fields([
    { name: 'tier1Image', maxCount: 1 },
    { name: 'tier2Image', maxCount: 1 },
    { name: 'tier3Image', maxCount: 1 }
  ]), customCakeController.updateThemeColorImages);

// Colors
router.post('/colors', customCakeController.createColor);
router.route('/colors/:id')
  .put(customCakeController.updateColor)
  .delete(customCakeController.deleteColor);

// Theme Colors (Images)
router.post('/theme-colors', upload.fields([
  { name: 'tier1Image', maxCount: 1 },
  { name: 'tier2Image', maxCount: 1 },
  { name: 'tier3Image', maxCount: 1 }
]), customCakeController.createThemeColor);
router.route('/theme-colors/:id')
  .delete(customCakeController.deleteThemeColor);

module.exports = router;
