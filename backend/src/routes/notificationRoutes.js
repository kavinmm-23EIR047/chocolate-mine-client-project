const express = require('express');
const router = express.Router();
const { 
  getMyNotifications, 
  markAllAsRead, 
  markAsRead, 
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMyNotifications);

router.route('/unread-count')
  .get(getUnreadCount);

router.route('/read-all')
  .put(markAllAsRead);

router.route('/clear-all')
  .delete(clearAllNotifications);

router.route('/:id/read')
  .patch(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
