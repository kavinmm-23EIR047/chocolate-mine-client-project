const mongoose = require('mongoose');

const customCakeThemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  category: [{
    type: String,
    trim: true
  }],
  tiers: {
    tier1: { 
      isActive: { type: Boolean, default: true }, 
      price: { type: Number, default: 0, min: 0 } 
    },
    tier2: { 
      isActive: { type: Boolean, default: false }, 
      price: { type: Number, default: 0, min: 0 } 
    },
    tier3: { 
      isActive: { type: Boolean, default: false }, 
      price: { type: Number, default: 0, min: 0 } 
    }
  },
  flavors: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    weights: [{
      kg: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    isActive: { type: Boolean, default: true }
  }],
  colors: [{
    name: { type: String, required: true },
    hexCode: { type: String, default: '' },
    images: {
      tier1: { type: String, default: null },
      tier2: { type: String, default: null },
      tier3: { type: String, default: null }
    },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });





// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

customCakeThemeSchema.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

customCakeThemeSchema.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
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

customCakeThemeSchema.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
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

module.exports = mongoose.model('CustomCakeTheme', customCakeThemeSchema);
