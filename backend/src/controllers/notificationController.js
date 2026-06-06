const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Get logged in user's WEB notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ 
    userId: req.user._id,
    channel: 'WEB'
  })
  .sort({ createdAt: -1 })
  .limit(20);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: notifications
  });
});

// @desc    Mark all user's notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { userId: req.user._id, channel: 'WEB', opened: false },
    { $set: { opened: true } }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});
