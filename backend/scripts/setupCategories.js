#!/usr/bin/env node
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Define Category model inline
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  label: { type: String },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

async function setupCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const cakeCategories = [
      {
        name: 'bento-cakes',
        label: 'Bento Cakes',
        description: 'Cute and portable mini cakes in various flavors',
        isActive: true
      },
      {
        name: 'vanilla-cakes',
        label: 'Vanilla Cakes',
        description: 'Classic vanilla cakes with perfect balance of taste',
        isActive: true
      },
      {
        name: 'chocolate-cakes',
        label: 'Chocolate Cakes',
        description: 'Rich and decadent chocolate creations',
        isActive: true
      },
      {
        name: 'red-velvet-cakes',
        label: 'Red Velvet Cakes',
        description: 'Elegant red velvet with cream cheese frosting',
        isActive: true
      },
      {
        name: 'chocolates',
        label: 'Chocolates',
        description: 'Premium handcrafted chocolates',
        isActive: true
      },
      {
        name: 'candles',
        label: 'Candles',
        description: 'Artisan scented candles',
        isActive: true
      },
      {
        name: 'flowers',
        label: 'Flowers',
        description: 'Fresh flower arrangements',
        isActive: true
      }
    ];

    // Clear existing categories
    const deleteResult = await Category.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing categories`);

    // Insert new categories
    const result = await Category.insertMany(cakeCategories);
    
    console.log(`\n✅ Successfully created ${result.length} categories!`);
    result.forEach(cat => {
      console.log(`   ✓ ${cat.label} (${cat.name})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

setupCategories();
