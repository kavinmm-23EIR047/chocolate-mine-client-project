const mongoose = require('mongoose');

const customCakeThemeColorSchema = new mongoose.Schema({
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomCakeTheme',
    required: true
  },
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomCakeColor',
    required: true
  },
  images: {
    tier1: { type: String, default: null },
    tier2: { type: String, default: null },
    tier3: { type: String, default: null }
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { timestamps: true });

customCakeThemeColorSchema.index({ themeId: 1, colorId: 1 }, { unique: true });




// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

customCakeThemeColorSchema.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

customCakeThemeColorSchema.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
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

customCakeThemeColorSchema.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
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

module.exports = mongoose.model('CustomCakeThemeColor', customCakeThemeColorSchema);
