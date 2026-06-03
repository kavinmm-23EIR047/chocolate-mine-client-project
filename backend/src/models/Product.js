const mongoose = require('mongoose');

// Flavor schema for cake variants with multiple images
const flavorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [{ type: String }]
});

// Weight schema for cake variants
const weightSchema = new mongoose.Schema({
  value: { type: String, required: true }
});

// Variant schema for price combinations
const variantSchema = new mongoose.Schema({
  flavor: { type: String, required: true },
  weight: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, required: true, lowercase: true },

  // NO enum restriction - accepts any category from the Category collection
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  location: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'coimbatore'
  },

  occasion: {
    type: [String],
    default: []
  },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  occasionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Occasion' }],

  // Regular product pricing (for non-cake items)
  price: { type: Number, min: 0 },
  offerPrice: { type: Number, min: 0 },

  // Cake-specific variant system
  cakeType: { type: String, trim: true, lowercase: true },
  weightPrices: [{ weight: { type: String }, price: { type: Number, min: 0 } }],
  hasVariants: { type: Boolean, default: false },
  flavors: [flavorSchema],
  weights: [weightSchema],
  variants: [variantSchema],
  allowCustomFlavor: { type: Boolean, default: false },
  allowCustomWeight: { type: Boolean, default: false },

  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  image: { type: String, required: true },
  imagePublicId: { type: String },

  gallery: [String],
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount: { type: Number, default: 0 },

  coupon: {
    enabled: { type: Boolean, default: false },
    code: { type: String },
    type: { type: String, enum: ['flat', 'price', 'percent'] },
    value: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, hasVariants: 1 });

module.exports = mongoose.model('Product', productSchema);