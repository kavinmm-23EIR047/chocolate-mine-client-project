'use strict';

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * Handles: File Path, Base64, or URL
 * @param {string} input - The image source (path, base64, or URL)
 * @param {string} folder - Folder name for organization
 * @returns {Promise<{secure_url: string, public_id: string}|null>}
 */
exports.uploadImage = async (input, folder = 'general') => {
  try {
    if (!input) {
      logger.error('No image input provided');
      return null;
    }

    const uploadFolder = `${folder}`;
    logger.info(`Starting Cloudinary upload to folder: ${uploadFolder}`);
    
    const result = await cloudinary.uploader.upload(input, {
      folder: uploadFolder,
      resource_type: 'auto',
      overwrite: true,
    });

    logger.info(`Cloudinary Upload Success: ${result.secure_url}`);
    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (err) {
    logger.error('Cloudinary Upload Error Details:', err.message);
    return null;
  }
};

/**
 * Upload image buffer directly to Cloudinary using streams
 * @param {Buffer} buffer - The image buffer
 * @param {string} folder - Folder name
 * @returns {Promise<{secure_url: string, public_id: string}|null>}
 */
exports.uploadBuffer = async (buffer, folder = 'general', mimetype = 'image/png') => {
  try {
    if (!buffer) {
      logger.error('No image buffer provided');
      return null;
    }
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return await exports.uploadImage(dataUri, folder);
  } catch (err) {
    logger.error('Cloudinary Buffer Upload Error:', err.message);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public_id of the image to delete
 * @returns {Promise<boolean>}
 */
exports.deleteImage = async (publicId) => {
  if (!publicId) {
    logger.warn('No publicId provided for deletion');
    return false;
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    const success = result.result === 'ok';
    if (success) {
      logger.info(`Cloudinary Delete Success: ${publicId}`);
    } else {
      logger.warn(`Cloudinary Delete Failed: ${publicId} - ${result.result}`);
    }
    return success;
  } catch (err) {
    logger.error('Cloudinary Delete Error:', err.message);
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public_ids to delete
 * @returns {Promise<{success: number, failed: number}>}
 */
exports.deleteMultipleImages = async (publicIds) => {
  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    logger.warn('No publicIds provided for deletion');
    return { success: 0, failed: 0 };
  }
  
  try {
    const deletePromises = publicIds.map(publicId => exports.deleteImage(publicId));
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(result => result === true).length;
    const failedCount = results.length - successCount;
    logger.info(`Deleted ${successCount} of ${publicIds.length} images`);
    return { success: successCount, failed: failedCount };
  } catch (err) {
    logger.error('Cloudinary Multiple Delete Error:', err.message);
    return { success: 0, failed: publicIds.length };
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} inputs - Array of image sources (base64, URLs, or paths)
 * @param {string} folder - Folder name for organization
 * @returns {Promise<Array<{secure_url: string, public_id: string}>>}
 */
exports.uploadMultipleImages = async (inputs, folder = 'general') => {
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    logger.warn('No images provided for multiple upload');
    return [];
  }
  
  try {
    const uploadPromises = inputs.map(input => exports.uploadImage(input, folder));
    const results = await Promise.all(uploadPromises);
    const validResults = results.filter(result => result !== null);
    logger.info(`Successfully uploaded ${validResults.length} of ${inputs.length} images`);
    return validResults;
  } catch (err) {
    logger.error('Cloudinary Multiple Upload Error:', err.message);
    return [];
  }
};

/**
 * Upload flavor images with specific naming
 * @param {Array<string>} images - Array of image sources
 * @param {string} productName - Product name for folder
 * @param {string} flavorName - Flavor name for sub-folder
 * @returns {Promise<Array<string>>} - Array of secure URLs
 */
exports.uploadFlavorImages = async (images, productName, flavorName) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  const folder = `products/${productName.toLowerCase().replace(/\s+/g, '-')}/flavors/${flavorName.toLowerCase().replace(/\s+/g, '-')}`;
  
  try {
    const uploadPromises = images.map(image => exports.uploadImage(image, folder));
    const results = await Promise.all(uploadPromises);
    const validResults = results.filter(result => result !== null);
    return validResults.map(result => result.secure_url);
  } catch (err) {
    logger.error('Flavor images upload error:', err.message);
    return [];
  }
};