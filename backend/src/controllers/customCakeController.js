const mongoose = require('mongoose');
const CustomCakeTheme = require('../models/CustomCakeTheme');
const CustomCakeColor = require('../models/CustomCakeColor');
const CustomCakeThemeColor = require('../models/CustomCakeThemeColor');
const CustomCakeFlavor = require('../models/CustomCakeFlavor');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinaryService');

// --- FLAVOURS ---
exports.getFlavours = asyncHandler(async (req, res) => {
  const flavours = await CustomCakeFlavor.find().sort('category name');
  res.status(200).json({ status: 'success', data: flavours });
});

exports.getFlavourById = asyncHandler(async (req, res, next) => {
  const flavour = await CustomCakeFlavor.findById(req.params.id);
  if (!flavour) return next(new AppError('Flavour not found', 404));
  res.status(200).json({ status: 'success', data: flavour });
});

exports.createFlavour = asyncHandler(async (req, res, next) => {
  const flavour = await CustomCakeFlavor.create(req.body);
  res.status(201).json({ status: 'success', data: flavour });
});

exports.updateFlavour = asyncHandler(async (req, res, next) => {
  const flavour = await CustomCakeFlavor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!flavour) return next(new AppError('Flavour not found', 404));
  res.status(200).json({ status: 'success', data: flavour });
});

exports.deleteFlavour = asyncHandler(async (req, res, next) => {
  const flavour = await CustomCakeFlavor.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

exports.getThemes = asyncHandler(async (req, res) => {
  const themes = await CustomCakeTheme.find().sort('displayOrder name').lean();
  const activeFlavors = await CustomCakeFlavor.find({ isActive: true }).lean();
  const activeColors = await CustomCakeColor.find({ isActive: true }).lean();

  const formattedThemes = themes.map(theme => {
    // Merge flavors
    const finalFlavors = [...(theme.flavors || [])];
    activeFlavors.forEach(masterFlavor => {
      if (!finalFlavors.some(f => f.name === masterFlavor.name)) {
        finalFlavors.push({
          name: masterFlavor.name,
          category: masterFlavor.category,
          weights: masterFlavor.weights,
          isActive: masterFlavor.isActive
        });
      }
    });

    // Merge colors
    const finalColors = [...(theme.colors || [])];
    activeColors.forEach(masterColor => {
      if (!finalColors.some(c => c.name === masterColor.name)) {
        finalColors.push({
          name: masterColor.name,
          hexCode: masterColor.hexCode,
          isActive: masterColor.isActive,
          price: 0,
          images: { tier1: null, tier2: null, tier3: null }
        });
      }
    });

    return {
      ...theme,
      flavors: finalFlavors,
      colors: finalColors
    };
  });

  res.status(200).json({ status: 'success', data: formattedThemes });
});

const sanitizeThemeData = (data) => {
  const themeData = { ...data };

  if (themeData.basePrice !== undefined) {
    themeData.basePrice = Math.max(0, parseFloat(themeData.basePrice) || 0);
  }
  if (themeData.displayOrder !== undefined) {
    themeData.displayOrder = parseInt(themeData.displayOrder) || 0;
  }

  if (themeData.tiers) {
    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      if (themeData.tiers[tier]) {
        themeData.tiers[tier] = {
          isActive: Boolean(themeData.tiers[tier].isActive),
          price: Math.max(0, parseFloat(themeData.tiers[tier].price) || 0)
        };
      } else {
        themeData.tiers[tier] = { isActive: tier === 'tier1', price: 0 };
      }
    });
  }

  if (Array.isArray(themeData.flavors)) {
    themeData.flavors = themeData.flavors.map(f => ({
      name: f.name || 'Default Flavor',
      category: f.category || 'General',
      isActive: f.isActive !== false,
      weights: Array.isArray(f.weights) && f.weights.length > 0 
        ? f.weights.map(w => ({ kg: parseFloat(w.kg) || 1, price: Math.max(0, parseFloat(w.price) || 0) }))
        : [{ kg: 1, price: 0 }]
    }));
  }

  if (Array.isArray(themeData.colors)) {
    themeData.colors = themeData.colors.map(c => {
      const { _id, ...rest } = c;
      const cleanColor = {
        ...rest,
        name: c.name || 'Custom Color',
        hexCode: c.hexCode || '',
        price: Math.max(0, parseFloat(c.price) || 0),
        isActive: c.isActive !== false,
        images: {
          tier1: c.images?.tier1 || null,
          tier2: c.images?.tier2 || null,
          tier3: c.images?.tier3 || null
        }
      };
      if (_id && mongoose.Types.ObjectId.isValid(_id)) {
        cleanColor._id = _id;
      }
      return cleanColor;
    });
  }

  return themeData;
};

exports.createTheme = asyncHandler(async (req, res, next) => {
  const themeData = sanitizeThemeData(req.body);
  
  if (!themeData.flavors || themeData.flavors.length === 0) {
    const activeFlavors = await CustomCakeFlavor.find({ isActive: true });
    themeData.flavors = activeFlavors.map(f => ({
      name: f.name,
      category: f.category || 'General',
      weights: f.weights,
      isActive: f.isActive
    }));
  }
  
  if (!themeData.colors || themeData.colors.length === 0) {
    const activeColors = await CustomCakeColor.find({ isActive: true });
    themeData.colors = activeColors.map(c => ({
      name: c.name,
      hexCode: c.hexCode,
      isActive: c.isActive,
      price: 0,
      images: { tier1: null, tier2: null, tier3: null }
    }));
  }

  const theme = await CustomCakeTheme.create(themeData);
  res.status(201).json({ status: 'success', data: theme });
});

exports.updateTheme = asyncHandler(async (req, res, next) => {
  const sanitized = sanitizeThemeData(req.body);
  const theme = await CustomCakeTheme.findByIdAndUpdate(req.params.id, sanitized, { new: true, runValidators: true });
  if (!theme) return next(new AppError('Theme not found', 404));
  res.status(200).json({ status: 'success', data: theme });
});

exports.deleteTheme = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findByIdAndDelete(req.params.id);
  await CustomCakeThemeColor.deleteMany({ themeId: req.params.id });
  res.status(204).json({ status: 'success', data: null });
});

// --- THEME FLAVOURS ---
exports.addThemeFlavour = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const newFlavour = {
    name: req.body.name,
    category: req.body.category,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    weights: req.body.weights || []
  };

  theme.flavors.push(newFlavour);
  await theme.save();
  
  res.status(201).json({ status: 'success', data: theme.flavors[theme.flavors.length - 1] });
});

exports.updateThemeFlavour = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const flavour = theme.flavors.id(req.params.flavourId);
  if (!flavour) return next(new AppError('Flavour not found in this theme', 404));

  if (req.body.name) flavour.name = req.body.name;
  if (req.body.category) flavour.category = req.body.category;
  if (req.body.isActive !== undefined) flavour.isActive = req.body.isActive;
  if (req.body.weights) flavour.weights = req.body.weights;

  await theme.save();
  res.status(200).json({ status: 'success', data: flavour });
});

exports.deleteThemeFlavour = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const flavour = theme.flavors.id(req.params.flavourId);
  if (!flavour) return next(new AppError('Flavour not found in this theme', 404));

  flavour.deleteOne();
  await theme.save();
  res.status(204).json({ status: 'success', data: null });
});

// --- THEME COLORS (EMBEDDED) ---
exports.addThemeColor = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const newColor = {
    name: req.body.name,
    hexCode: req.body.hexCode || '',
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    price: req.body.price || 0,
    images: req.body.images || { tier1: null, tier2: null, tier3: null }
  };

  theme.colors.push(newColor);
  await theme.save();

  const addedColor = theme.colors[theme.colors.length - 1];
  res.status(201).json({ status: 'success', data: addedColor });
});

exports.updateThemeColor = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const color = theme.colors.id(req.params.colorId);
  if (!color) return next(new AppError('Color not found in this theme', 404));

  if (req.body.name !== undefined) color.name = req.body.name;
  if (req.body.hexCode !== undefined) color.hexCode = req.body.hexCode;
  if (req.body.isActive !== undefined) color.isActive = req.body.isActive;
  if (req.body.price !== undefined) color.price = req.body.price;

  await theme.save();
  res.status(200).json({ status: 'success', data: color });
});

exports.deleteThemeColor = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const color = theme.colors.id(req.params.colorId);
  if (!color) return next(new AppError('Color not found in this theme', 404));

  color.deleteOne();
  await theme.save();
  res.status(204).json({ status: 'success', data: null });
});

exports.updateThemeColorImages = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const color = theme.colors.id(req.params.colorId);
  if (!color) return next(new AppError('Color not found in this theme', 404));

  if (req.body.price !== undefined) {
    color.price = parseFloat(req.body.price) || 0;
  }

  const uploadFile = async (file) => {
    const uploaded = await cloudinaryService.uploadBuffer(file.buffer, 'custom-cakes', file.mimetype);
    if (!uploaded) throw new Error('Image upload failed via buffer');
    return uploaded.secure_url;
  };

  const uploadBase64 = async (base64Str) => {
    const uploaded = await cloudinaryService.uploadImage(base64Str, 'custom-cakes');
    if (!uploaded) throw new Error('Image upload failed');
    return uploaded.secure_url;
  };

  const tryUploadTier = async (tierKey, fileField) => {
    const file = req.files?.[fileField]?.[0];
    if (file) {
      color.images[tierKey] = await uploadFile(file);
      return;
    }

    const bodyValue = req.body[fileField];
    if (bodyValue) {
      color.images[tierKey] = await uploadBase64(bodyValue);
    }
  };

  try {
    await tryUploadTier('tier1', 'tier1Image');
    await tryUploadTier('tier2', 'tier2Image');
    await tryUploadTier('tier3', 'tier3Image');
  } catch (error) {
    return next(new AppError('Failed to upload images: ' + error.message, 500));
  }

  const updatedTheme = await CustomCakeTheme.findOneAndUpdate(
    { _id: req.params.id, 'colors._id': req.params.colorId },
    {
      $set: {
        'colors.$.price': color.price,
        'colors.$.images': color.images
      }
    },
    { new: true, runValidators: true }
  );

  const updatedColor = updatedTheme.colors.id(req.params.colorId);
  res.status(200).json({ status: 'success', data: updatedColor });
});

exports.applyThemeColorToAll = asyncHandler(async (req, res, next) => {
  const theme = await CustomCakeTheme.findById(req.params.id);
  if (!theme) return next(new AppError('Theme not found', 404));

  const sourceColor = theme.colors.id(req.params.colorId);
  if (!sourceColor) return next(new AppError('Source color not found in this theme', 404));

  // Copy images and price to all other active colors in the theme
  theme.colors.forEach(color => {
    if (color._id.toString() !== sourceColor._id.toString()) {
      color.images = {
        tier1: sourceColor.images.tier1,
        tier2: sourceColor.images.tier2,
        tier3: sourceColor.images.tier3
      };
      color.price = sourceColor.price;
    }
  });

  theme.markModified('colors');
  await theme.save();
  res.status(200).json({ status: 'success', data: theme.colors });
});

// --- MASTER COLORS ---
exports.getColors = asyncHandler(async (req, res) => {
  const colors = await CustomCakeColor.find().sort('name');
  res.status(200).json({ status: 'success', data: colors });
});

exports.createColor = asyncHandler(async (req, res, next) => {
  const color = await CustomCakeColor.create(req.body);
  res.status(201).json({ status: 'success', data: color });
});

exports.updateColor = asyncHandler(async (req, res, next) => {
  const color = await CustomCakeColor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!color) return next(new AppError('Color not found', 404));
  res.status(200).json({ status: 'success', data: color });
});

exports.deleteColor = asyncHandler(async (req, res, next) => {
  const color = await CustomCakeColor.findByIdAndDelete(req.params.id);
  await CustomCakeThemeColor.deleteMany({ colorId: req.params.id });
  res.status(204).json({ status: 'success', data: null });
});

// --- THEME COLORS (IMAGES) ---
exports.getThemeColors = asyncHandler(async (req, res) => {
  const themeColors = await CustomCakeThemeColor.find()
    .populate('themeId', 'name')
    .populate('colorId', 'name hexCode');
  res.status(200).json({ status: 'success', data: themeColors });
});

exports.createThemeColor = asyncHandler(async (req, res, next) => {
  const { themeId, colorId, price } = req.body;
  if (!themeId || !colorId) return next(new AppError('Theme and Color are required', 400));
  
  const existing = await CustomCakeThemeColor.findOne({ themeId, colorId });
  if (existing) return next(new AppError('Image mapping for this Theme and Color already exists', 400));

  let uploadedImages = {
    tier1: null,
    tier2: null,
    tier3: null
  };

  const uploadFile = async (fileBuffer, mimetype) => {
    const b64 = Buffer.from(fileBuffer).toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    const uploaded = await cloudinaryService.uploadImage(dataUri, 'custom-cakes');
    if (!uploaded) throw new Error('Image upload failed');
    return uploaded.secure_url;
  };

  const uploadBase64 = async (base64Str) => {
    const uploaded = await cloudinaryService.uploadImage(base64Str, 'custom-cakes');
    if (!uploaded) throw new Error('Image upload failed');
    return uploaded.secure_url;
  };

  const tryUploadTier = async (tierKey, fileField) => {
    const file = req.files?.[fileField]?.[0];
    if (file) {
      uploadedImages[tierKey] = await uploadFile(file.buffer, file.mimetype);
      return;
    }

    const bodyValue = req.body[fileField];
    if (bodyValue) {
      uploadedImages[tierKey] = await uploadBase64(bodyValue);
    }
  };

  try {
    await tryUploadTier('tier1', 'tier1Image');
    await tryUploadTier('tier2', 'tier2Image');
    await tryUploadTier('tier3', 'tier3Image');
  } catch (error) {
    return next(new AppError('Failed to upload images: ' + error.message, 500));
  }

  const parsedPrice = price ? parseFloat(price) : 0;
  const themeColor = await CustomCakeThemeColor.create({ 
    themeId, 
    colorId, 
    images: uploadedImages, 
    price: parsedPrice 
  });
  res.status(201).json({ status: 'success', data: themeColor });
});

exports.deleteThemeColor = asyncHandler(async (req, res, next) => {
  const themeColor = await CustomCakeThemeColor.findByIdAndDelete(req.params.id);
  if (!themeColor) return next(new AppError('Theme Color mapping not found', 404));
  res.status(204).json({ status: 'success', data: null });
});


