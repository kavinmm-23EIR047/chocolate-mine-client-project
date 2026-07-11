const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinaryService');

// GET /api/v1/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  const filter = activeOnly === 'true' ? { active: true } : {};
  const categories = await Category.find(filter).sort('name');
  res.status(200).json({ status: 'success', data: categories });
});

// GET /api/v1/categories/active
exports.getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ active: true }).sort('name');
  res.status(200).json({ status: 'success', data: categories });
});

// GET /api/v1/categories/:id
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  res.status(200).json({ status: 'success', data: category });
});

// POST /api/v1/categories
exports.createCategory = asyncHandler(async (req, res, next) => {
  console.log('Create category request received');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  const { name, label, subCategories } = req.body;
  
  if (!name) {
    return next(new AppError('Category name is required', 400));
  }

  let imageUrl = null;
  let imagePublicId = null;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name: name.trim().toLowerCase() });
  if (existingCategory) {
    return next(new AppError('Category already exists', 400));
  }

  // Handle image upload from file
  if (req.file) {
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'categories');
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
      const uploaded = await cloudinaryService.uploadImage(req.body.image, 'categories');
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
    return next(new AppError('Category image is required', 400));
  }

  const category = await Category.create({
    name: name.trim().toLowerCase(),
    label: label || name.trim(),
    subCategories: subCategories ? (Array.isArray(subCategories) ? subCategories : JSON.parse(subCategories)).map(s => s.trim().toLowerCase()) : [],
    image: imageUrl,
    imagePublicId: imagePublicId
  });

  res.status(201).json({ 
    status: 'success', 
    data: category 
  });
});

// PUT /api/v1/categories/:id
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const { name, label, active, subCategories } = req.body;
  
  if (name) {
    const existingCategory = await Category.findOne({ 
      name: name.trim().toLowerCase(),
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      return next(new AppError('Category name already exists', 400));
    }
    category.name = name.trim().toLowerCase();
  }
  
  if (label !== undefined) category.label = label;
  if (active !== undefined) category.active = active === 'true' || active === true;
  if (subCategories !== undefined) category.subCategories = (Array.isArray(subCategories) ? subCategories : JSON.parse(subCategories)).map(s => s.trim().toLowerCase());

  if (req.file) {
    try {
      if (category.imagePublicId) {
        await cloudinaryService.deleteImage(category.imagePublicId);
      }
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'categories');
      
      if (uploaded) {
        category.image = uploaded.secure_url;
        category.imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image update error:', error);
      return next(new AppError('Failed to update image: ' + error.message, 500));
    }
  }

  await category.save();
  
  res.status(200).json({ 
    status: 'success', 
    data: category 
  });
});

// DELETE /api/v1/categories/:id
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  if (category.imagePublicId) {
    await cloudinaryService.deleteImage(category.imagePublicId);
  }
  
  await category.deleteOne();
  
  res.status(204).json({ 
    status: 'success', 
    data: null 
  });
});