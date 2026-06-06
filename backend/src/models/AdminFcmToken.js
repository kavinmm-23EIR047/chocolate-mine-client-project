const mongoose = require('mongoose');

const adminFcmTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin user ID is required']
  },
  deviceName: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdminFcmToken', adminFcmTokenSchema);
