const AppError = require('./../utils/AppError');
const asyncHandler = require('./../utils/asyncHandler');
const Product = require('./../models/Product');
const slugify = require('slugify');
const cloudinaryService = require('../services/cloudinaryService');

const DEFAULT_CAKE_IMAGE_URL = 'https://via.placeholder.com/800x600.png?text=Chocolate+Mine+Cake+Background';

// Bulk create products - expects JSON array in request body
exports.bulkCreateProducts = asyncHandler(async (req, res, next) => {
  const items = Array.isArray(req.body) ? req.body : (req.body && Array.isArray(req.body.products) ? req.body.products : []);
  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('Request body must be a JSON array of product objects', 400));
  }

  const results = [];

  const computeWeightPrices = (type, base) => {
    const b = Number(base) || 0;
    if ((type || '').toLowerCase() === 'bento-cakes') {
      return [
        { weight: '0.25', price: Math.round(b) },
        { weight: '0.5', price: Math.round(b * 2) }
      ];
    }
    return [
      { weight: '0.5', price: Math.round(b) },
      { weight: '1', price: Math.round(b * 2) },
      { weight: '1.5', price: Math.round(b * 3) },
      { weight: '2', price: Math.round(b * 4) },
      { weight: '3', price: Math.round(b * 6) }
    ];
  };

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    try {
      const body = { ...raw };

      // Normalize booleans
      body.hasVariants = body.hasVariants === 'true' || body.hasVariants === true;
      body.allowCustomFlavor = body.allowCustomFlavor === 'true' || body.allowCustomFlavor === true;
      body.allowCustomWeight = body.allowCustomWeight === 'true' || body.allowCustomWeight === true;

      // Normalize category
      if (body.category) body.category = String(body.category).trim().toLowerCase();

      // Normalize basic strings -> numbers where appropriate
      Object.keys(body).forEach(key => {
        if (typeof body[key] === 'string') {
          const trimmed = body[key].trim();
          if (trimmed !== '' && !isNaN(trimmed) && !['name', 'slug', 'description', 'shortDescription', 'image', 'occasion', 'flavors', 'weights', 'variants', 'category'].includes(key)) {
            body[key] = Number(trimmed);
          } else {
            body[key] = trimmed;
          }
        }
      });

      // Handle occasion
      if (body.occasion) {
        if (!Array.isArray(body.occasion)) {
          if (typeof body.occasion === 'string') {
            try {
              const parsed = JSON.parse(body.occasion);
              body.occasion = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              body.occasion = body.occasion.split(',').map(o => o.trim()).filter(Boolean);
            }
          }
        }
      } else {
        body.occasion = [];
      }

      // Cake-specific handling
      if (body.category === 'cakes') {
        // Parse flavors/weights/variants
        if (body.flavors && typeof body.flavors === 'string') {
          try {
            const parsedFlavors = JSON.parse(body.flavors);
            body.flavors = parsedFlavors.map(flavor => ({ name: flavor.name, images: flavor.images || [] }));
          } catch (e) {
            body.flavors = [];
          }
        }
        if (body.weights && typeof body.weights === 'string') {
          try {
            body.weights = JSON.parse(body.weights);
          } catch (e) {
            body.weights = [];
          }
        }
        if (body.variants && typeof body.variants === 'string') {
          try {
            body.variants = JSON.parse(body.variants);
          } catch (e) {
            body.variants = [];
          }
        }

        // Ensure boolean flags
        if (body.hasVariants === undefined) body.hasVariants = true;

        // If basePrice present, compute weightPrices, weights, and generate variants
        if (body.basePrice !== undefined && body.basePrice !== null && body.basePrice !== '') {
          const weightPrices = computeWeightPrices(body.cakeType, body.basePrice);
          body.weightPrices = weightPrices;
          body.weights = weightPrices.map(w => ({ value: `${w.weight} kg` }));

          const flavorList = body.flavors || [];
          const generatedVariants = [];
          flavorList.forEach(fl => {
            weightPrices.forEach(wp => {
              generatedVariants.push({ flavor: fl.name, weight: `${wp.weight} kg`, price: wp.price, stock: 0 });
            });
          });
          if (flavorList.length === 0) {
            weightPrices.forEach(wp => {
              generatedVariants.push({ flavor: '', weight: `${wp.weight} kg`, price: wp.price, stock: 0 });
            });
          }
          body.variants = generatedVariants;
          body.hasVariants = generatedVariants.length > 0;
        }
      } else {
        // Non-cakes - strip variant fields
        delete body.flavors;
        delete body.weights;
        delete body.variants;
        body.hasVariants = false;
        body.allowCustomFlavor = false;
        body.allowCustomWeight = false;
      }

      // If cakeType is provided but category wasn't, infer cakes category
      if (!body.category && body.cakeType) {
        body.category = 'cakes';
      }

      // Ensure description and shortDescription exist for validation
      if (!body.description) {
        body.description = body.shortDescription || body.name || '';
      }
      if (!body.shortDescription) {
        body.shortDescription = body.description || body.name || '';
      }

      // Image handling
      let imageInput = body.image;
      if (!imageInput && body.category === 'cakes') {
        imageInput = DEFAULT_CAKE_IMAGE_URL;
      }

      if (imageInput) {
        const uploadResult = await cloudinaryService.uploadImage(imageInput, body.category || 'general');
        if (uploadResult) {
          body.image = uploadResult.secure_url;
          body.imagePublicId = uploadResult.public_id;
        } else if (!body.image) {
          body.image = DEFAULT_CAKE_IMAGE_URL;
        }
      }

      // Slug and creator
      if (!body.name) throw new Error('Product name is required');
      body.slug = slugify(body.name, { lower: true });
      body.createdBy = req.user && req.user._id ? req.user._id : null;

      const created = await Product.create(body);
      results.push({ index: i, success: true, id: created._id, slug: created.slug });
    } catch (err) {
      results.push({ index: i, success: false, error: err.message });
    }
  }

  res.status(207).json({ status: 'completed', results });
});
