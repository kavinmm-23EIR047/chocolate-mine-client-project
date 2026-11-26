const express = require('express');
const themeController = require('../controllers/themeController');

const router = express.Router();

// Public endpoint to check active seasonal theme
router.get('/active', themeController.getActiveTheme);

module.exports = router;
