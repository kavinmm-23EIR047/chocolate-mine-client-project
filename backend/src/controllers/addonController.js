const Addon = require('../models/Addon');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinaryService');

// GET /api/v1/addons
exports.getAddons = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  const filter = activeOnly === 'true' ? { isActive: true } : {};
  const addons = await Addon.find(filter).sort('name');
  res.status(200).json({ status: 'success', data: addons });
});

// GET /api/v1/addons/active
exports.getActiveAddons = asyncHandler(async (req, res) => {
  const addons = await Addon.find({ isActive: true }).sort('name');
  res.status(200).json({ status: 'success', data: addons });
});

// GET /api/v1/addons/:id
exports.getAddon = asyncHandler(async (req, res, next) => {
  const addon = await Addon.findById(req.params.id);
  if (!addon) {
    return next(new AppError('Addon not found', 404));
  }
  res.status(200).json({ status: 'success', data: addon });
});

// POST /api/v1/addons
exports.createAddon = asyncHandler(async (req, res, next) => {
  const { name, description, price, isActive } = req.body;
  
  if (!name || price === undefined) {
    return next(new AppError('Addon name and price are required', 400));
  }

  let imageUrl = null;
  let imagePublicId = null;

  // Check if addon already exists
  const existingAddon = await Addon.findOne({ name: name.trim() });
  if (existingAddon) {
    return next(new AppError('Addon already exists', 400));
  }

  // Handle image upload from file
  if (req.file) {
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'addons');
      if (!uploaded) {
        return next(new AppError('Image upload failed', 500));
      }
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    } catch (error) {
      console.error('Image upload error:', error);
      return next(new AppError('Failed to upload image: ' + error.message, 500));
    }
  } 
  // Handle image upload from base64 string
  else if (req.body.image) {
    try {
      const uploaded = await cloudinaryService.uploadImage(req.body.image, 'addons');
      if (!uploaded) {
        return next(new AppError('Image upload failed', 500));
      }
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    } catch (error) {
      console.error('Image upload error:', error);
      return next(new AppError('Failed to upload image: ' + error.message, 500));
    }
  } 
  else {
    return next(new AppError('Addon image is required', 400));
  }

  const addon = await Addon.create({
    name: name.trim(),
    description: description ? description.trim() : '',
    price: Number(price),
    isActive: isActive === 'true' || isActive === true || isActive === undefined,
    image: imageUrl,
    imagePublicId: imagePublicId,
    createdBy: req.user ? req.user._id : undefined
  });

  res.status(201).json({ 
    status: 'success', 
    data: addon 
  });
});

// PUT /api/v1/addons/:id
exports.updateAddon = asyncHandler(async (req, res, next) => {
  const addon = await Addon.findById(req.params.id);
  if (!addon) {
    return next(new AppError('Addon not found', 404));
  }

  const { name, description, price, isActive } = req.body;
  
  if (name) {
    const existingAddon = await Addon.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingAddon) {
      return next(new AppError('Addon name already exists', 400));
    }
    addon.name = name.trim();
  }
  
  if (description !== undefined) addon.description = description.trim();
  if (price !== undefined) addon.price = Number(price);
  if (isActive !== undefined) addon.isActive = isActive === 'true' || isActive === true;

  if (req.file) {
    try {
      if (addon.imagePublicId) {
        await cloudinaryService.deleteImage(addon.imagePublicId);
      }
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'addons');
      
      if (uploaded) {
        addon.image = uploaded.secure_url;
        addon.imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image update error:', error);
      return next(new AppError('Failed to update image: ' + error.message, 500));
    }
  } else if (req.body.image && req.body.image.startsWith('data:')) {
    try {
      if (addon.imagePublicId) {
        await cloudinaryService.deleteImage(addon.imagePublicId);
      }
      const uploaded = await cloudinaryService.uploadImage(req.body.image, 'addons');
      if (uploaded) {
        addon.image = uploaded.secure_url;
        addon.imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image update error:', error);
      return next(new AppError('Failed to update image: ' + error.message, 500));
    }
  }

  await addon.save();
  
  res.status(200).json({ 
    status: 'success', 
    data: addon 
  });
});

// DELETE /api/v1/addons/:id
exports.deleteAddon = asyncHandler(async (req, res, next) => {
  const addon = await Addon.findById(req.params.id);
  if (!addon) {
    return next(new AppError('Addon not found', 404));
  }
  
  if (addon.imagePublicId) {
    await cloudinaryService.deleteImage(addon.imagePublicId);
  }
  
  await addon.deleteOne();
  
  res.status(204).json({ 
    status: 'success', 
    data: null 
  });
});
