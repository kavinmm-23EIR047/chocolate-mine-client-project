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

module.exports = mongoose.model('CustomCakeTheme', customCakeThemeSchema);
