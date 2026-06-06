const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinaryService');

// POST /api/v1/banners - Create Banner
exports.createBanner = asyncHandler(async (req, res, next) => {
  const { title, link, bannerType, displayOrder, isActive } = req.body;
  
  if (!title) {
    return next(new AppError('Banner title is required', 400));
  }

  let imageUrl = null;
  let imagePublicId = null;

  // Handle image upload from file (Multer)
  if (req.file) {
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'banners');
      if (!uploaded) {
        return next(new AppError('Image upload failed', 500));
      }
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    } catch (error) {
      console.error('Image upload error:', error);
      return next(new AppError('Failed to upload image', 500));
    }
  } 
  // Handle image upload from base64 string
  else if (req.body.image) {
    try {
      const uploaded = await cloudinaryService.uploadImage(req.body.image, 'banners');
      if (!uploaded) {
        return next(new AppError('Image upload failed', 500));
      }
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    } catch (error) {
      console.error('Image upload error:', error);
      return next(new AppError('Failed to upload image', 500));
    }
  } 
  else {
    return next(new AppError('Banner image is required', 400));
  }

  const banner = await Banner.create({
    title,
    image: imageUrl,
    imagePublicId,
    link,
    bannerType: bannerType || 'home',
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true
  });

  if (banner.isActive) {
    try {
      const notificationManager = require('../services/notificationManager');
      notificationManager.notifyOfferAdded(banner).catch(err => console.error('Failed to trigger notifyOfferAdded:', err));
    } catch (err) {
      console.error('Failed to require notificationManager in bannerController:', err);
    }
  }

  res.status(201).json({ 
    status: 'success', 
    data: banner 
  });
});

// GET /api/v1/banners - Get All Banners (Sorted by displayOrder)
exports.getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
  res.status(200).json({ status: 'success', data: banners });
});

// GET /api/v1/banners/active - Get Active Banners
exports.getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
  res.status(200).json({ status: 'success', data: banners });
});

// PATCH /api/v1/banners/:id - Update Banner
exports.updateBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }

  const { title, link, bannerType, displayOrder, isActive } = req.body;
  
  if (title) banner.title = title;
  if (link !== undefined) banner.link = link;
  if (bannerType) banner.bannerType = bannerType;
  if (displayOrder !== undefined) banner.displayOrder = displayOrder;
  if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

  // Handle image update
  if (req.file) {
    try {
      // Delete old image
      if (banner.imagePublicId) {
        await cloudinaryService.deleteImage(banner.imagePublicId);
      }
      
      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'banners');
      
      if (uploaded) {
        banner.image = uploaded.secure_url;
        banner.imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image update error:', error);
      return next(new AppError('Failed to update image', 500));
    }
  }

  await banner.save();
  
  res.status(200).json({ 
    status: 'success', 
    data: banner 
  });
});

// DELETE /api/v1/banners/:id - Delete Banner
exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }
  
  // Delete image from Cloudinary
  if (banner.imagePublicId) {
    await cloudinaryService.deleteImage(banner.imagePublicId);
  }
  
  await banner.deleteOne();
  
  res.status(204).json({ 
    status: 'success', 
    data: null 
  });
});

// PATCH /api/v1/banners/:id/toggle - Toggle Banner Status
exports.toggleBannerStatus = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }
  
  banner.isActive = !banner.isActive;
  await banner.save();
  
  res.status(200).json({ 
    status: 'success', 
    data: banner 
  });
});
