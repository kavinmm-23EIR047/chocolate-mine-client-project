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
  stock: { type: Boolean, default: true }
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
  stock: { type: Boolean, default: true },
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




// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

productSchema.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

productSchema.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    const query = this.getQuery();
    if (doc && doc._id) {
      await excelService.updateInExcel(modelName, doc._id, doc);
    } else if (query && query._id) {
      const updatedDoc = await this.model.findOne(query).lean();
      if (updatedDoc) await excelService.updateInExcel(modelName, query._id, updatedDoc);
    }
  } catch (err) {
    console.error("Excel sync error for update:", err.message);
  }
});

productSchema.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    if (doc && doc._id) {
      await excelService.deleteFromExcel(modelName, doc._id);
    } else {
      const query = this.getQuery();
      if (query && query._id) {
         await excelService.deleteFromExcel(modelName, query._id);
      }
    }
  } catch (err) {
    console.error("Excel sync error for delete:", err.message);
  }
});

module.exports = mongoose.model('Product', productSchema);
