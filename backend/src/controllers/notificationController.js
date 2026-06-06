const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Get logged in user's WEB notifications (parsed for title/message/metadata)
// @route   GET /api/v1/notifications
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ 
    userId: req.user._id,
    channel: 'WEB'
  })
  .sort({ createdAt: -1 })
  .limit(50); // limit to 50 for history list

  const formattedNotifications = notifications.map(n => {
    let msgText = n.message || '';
    let metadata = {};
    if (msgText.includes('|||')) {
      const parts = msgText.split('|||');
      msgText = parts[0];
      try {
        metadata = JSON.parse(parts[1]);
      } catch (err) {}
    }

    return {
      _id: n._id,
      userId: n.userId,
      title: n.type, // type schema field holds the Title
      message: msgText,
      type: metadata.type || (n.orderId ? 'order' : 'general'),
      data: {
        orderId: n.orderId || metadata.orderId,
        ...metadata
      },
      isRead: n.opened,
      createdAt: n.createdAt
    };
  });

  res.status(200).json({
    status: 'success',
    results: formattedNotifications.length,
    data: formattedNotifications
  });
});

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    channel: 'WEB',
    opened: false
  });

  res.status(200).json({
    status: 'success',
    count
  });
});

// @desc    Mark single notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { opened: true } },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read'
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

// @desc    Delete single notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Notification deleted successfully'
  });
});
