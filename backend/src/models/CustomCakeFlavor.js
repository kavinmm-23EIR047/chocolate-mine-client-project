const mongoose = require('mongoose');

const customCakeFlavorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Vanilla Cakes', 'Chocolate Cakes', 'Red Velvet Cakes', 'Other']
  },
  weights: [{
    kg: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

customCakeFlavorSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('CustomCakeFlavor', customCakeFlavorSchema);
