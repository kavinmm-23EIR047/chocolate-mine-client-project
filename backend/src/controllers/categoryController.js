const Category = require('../models/Category');
// trigger update
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinaryService');

// GET /api/v1/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const { activeOnly, type } = req.query;
  const filter = activeOnly === 'true' ? { active: true } : {};
  if (type) {
    filter.$or = [
      { categoryType: type },
      { categoryType: 'both' },
      { categoryType: { $exists: false } },
      { categoryType: null }
    ];
  }
  const categories = await Category.find(filter).sort('name').lean();
  res.status(200).json({ status: 'success', data: categories });
});

// GET /api/v1/categories/active
exports.getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ active: true }).sort('name').lean();
  res.status(200).json({ status: 'success', data: categories });
});

// GET /api/v1/categories/:id
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  res.status(200).json({ status: 'success', data: category });
});

// POST /api/v1/categories
exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, label, subCategories, categoryType, allowCakeMessage } = req.body;
  
  if (!name || !name.trim()) {
    return next(new AppError('Category name is required', 400));
  }

  const cleanName = name.trim().toLowerCase();

  // Check if category already exists
  const existingCategory = await Category.findOne({ name: cleanName });
  if (existingCategory) {
    return next(new AppError('Category already exists', 400));
  }

  let imageUrl = null;
  let imagePublicId = null;

  // Handle image upload from file
  if (req.file) {
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
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
  // Handle image upload from URL or base64 string
  else if (req.body.image) {
    try {
      if (typeof req.body.image === 'string' && req.body.image.startsWith('http')) {
        imageUrl = req.body.image;
      } else {
        const uploaded = await cloudinaryService.uploadImage(req.body.image, 'categories');
        if (!uploaded) {
          return next(new AppError('Image upload failed', 500));
        }
        imageUrl = uploaded.secure_url;
        imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      return next(new AppError('Failed to upload image: ' + error.message, 500));
    }
  } 
  else {
    return next(new AppError('Category image is required', 400));
  }

  let parsedSubCategories = [];
  if (subCategories) {
    if (Array.isArray(subCategories)) {
      parsedSubCategories = subCategories;
    } else if (typeof subCategories === 'string') {
      try {
        const parsed = JSON.parse(subCategories);
        parsedSubCategories = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        parsedSubCategories = subCategories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  const category = await Category.create({
    name: cleanName,
    label: label?.trim() || cleanName,
    categoryType: categoryType || 'both',
    subCategories: parsedSubCategories.map(s => String(s).trim().toLowerCase()),
    allowCakeMessage: allowCakeMessage === 'true' || allowCakeMessage === true,
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

  const { name, label, active, subCategories, categoryType, allowCakeMessage } = req.body;
  const oldName = category.name;
  
  if (name && name.trim().toLowerCase() !== oldName) {
    const newName = name.trim().toLowerCase();
    const existingCategory = await Category.findOne({ 
      name: newName,
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      return next(new AppError('Category name already exists', 400));
    }
    category.name = newName;

    // Synchronize all product documents to the new category name
    try {
      await Product.updateMany(
        { category: oldName },
        { $set: { "category.$": newName } }
      );
    } catch (e) {
      console.warn('Product category array update fallback:', e.message);
      try {
        await Product.updateMany({ category: oldName }, { category: [newName] });
      } catch (err) {}
    }
  }
  
  if (label !== undefined) category.label = label.trim();
  if (categoryType !== undefined) category.categoryType = categoryType;
  if (active !== undefined) category.active = active === 'true' || active === true;
  if (allowCakeMessage !== undefined) category.allowCakeMessage = allowCakeMessage === 'true' || allowCakeMessage === true;

  if (subCategories !== undefined) {
    let parsedSubCategories = [];
    if (Array.isArray(subCategories)) {
      parsedSubCategories = subCategories;
    } else if (typeof subCategories === 'string') {
      try {
        const parsed = JSON.parse(subCategories);
        parsedSubCategories = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        parsedSubCategories = subCategories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    category.subCategories = parsedSubCategories.map(s => String(s).trim().toLowerCase());
  }

  if (req.file) {
    try {
      if (category.imagePublicId) {
        await cloudinaryService.deleteImage(category.imagePublicId).catch(() => {});
      }
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
      const uploaded = await cloudinaryService.uploadImage(dataUri, 'categories');
      
      if (uploaded) {
        category.image = uploaded.secure_url;
        category.imagePublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error('Image update error:', error);
      return next(new AppError('Failed to update image: ' + error.message, 500));
    }
  } else if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
    try {
      if (category.imagePublicId) {
        await cloudinaryService.deleteImage(category.imagePublicId).catch(() => {});
      }
      const uploaded = await cloudinaryService.uploadImage(req.body.image, 'categories');
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
    await cloudinaryService.deleteImage(category.imagePublicId).catch(() => {});
  }
  
  await category.deleteOne();
  
  res.status(200).json({ 
    status: 'success', 
    message: 'Category deleted successfully',
    data: null 
  });
});