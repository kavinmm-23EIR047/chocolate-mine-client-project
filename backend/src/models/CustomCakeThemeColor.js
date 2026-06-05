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

module.exports = mongoose.model('CustomCakeThemeColor', customCakeThemeColorSchema);
