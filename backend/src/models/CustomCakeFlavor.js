const mongoose = require('mongoose');

const customCakeFlavorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Vanilla Cakes', 'Chocolate Cakes', 'Red Velvet Cakes', 'Other']
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomCakeFlavor', customCakeFlavorSchema);
