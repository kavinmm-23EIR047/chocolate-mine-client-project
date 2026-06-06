const express = require('express');
const router = express.Router();
const { getMyNotifications, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMyNotifications);

router.route('/read-all')
  .put(markAllAsRead);

module.exports = router;
