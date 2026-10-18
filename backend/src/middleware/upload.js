'use strict';

const multer = require('multer');
const AppError = require('../utils/AppError');

/**
 * Multer Configuration
 * Using memory storage to handle buffers for Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * File filter to allow only images
 */
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp'];
  const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
  if (allowed.includes((file.mimetype || '').toLowerCase()) || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images (jpg, jpeg, png, webp).', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // Optimized browser uploads should be small; retain headroom for valid PNGs.
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

// Single file upload
module.exports = upload;

// For multiple file uploads (e.g., flavor images)
module.exports.uploadMultiple = upload.array('images', 20); // Max 20 images at once
module.exports.uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'gallery', maxCount: 10 }
]);
