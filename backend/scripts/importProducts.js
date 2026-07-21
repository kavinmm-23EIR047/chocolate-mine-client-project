#!/usr/bin/env node
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read the fixed products JSON file (located in backend folder or project root)
    let filePath = path.join(__dirname, '../properties.products-fixed.json');
    
    if (!fs.existsSync(filePath)) {
      // Try project root as fallback
      filePath = path.join(__dirname, '../../properties.products-fixed.json');
    }
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found at either:`);
      console.error(`   - backend/properties.products-fixed.json`);
      console.error(`   - project-root/properties.products-fixed.json`);
      console.error('Please ensure properties.products-fixed.json exists');
      process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.error('❌ Invalid JSON format or empty array');
      process.exit(1);
    }

    console.log(`📦 Found ${rawData.length} products to import`);

    // Clean MongoDB extended JSON format (convert { $oid, $date } to regular strings/dates)
    const cleanData = rawData.map(item => {
      const cleaned = JSON.parse(JSON.stringify(item));
      
      // Always remove any incoming _id so MongoDB can generate a unique ObjectId
      if (cleaned._id) delete cleaned._id;

      // Convert MongoDB extended JSON to regular values (if present)
      if (cleaned._id && cleaned._id.$oid) {
        delete cleaned._id;
      }
      if (cleaned.createdBy && cleaned.createdBy.$oid) {
        delete cleaned.createdBy;
      }
      if (cleaned.createdAt && cleaned.createdAt.$date) {
        cleaned.createdAt = new Date(cleaned.createdAt.$date);
      }
      if (cleaned.updatedAt && cleaned.updatedAt.$date) {
        cleaned.updatedAt = new Date(cleaned.updatedAt.$date);
      }
      
      // Clean weightPrices array
      if (Array.isArray(cleaned.weightPrices)) {
        cleaned.weightPrices = cleaned.weightPrices.map(wp => ({
          weight: wp.weight,
          price: wp.price
        }));
      }
      
      // Clean flavors array
      if (Array.isArray(cleaned.flavors)) {
        cleaned.flavors = cleaned.flavors.map(f => ({
          name: f.name,
          images: Array.isArray(f.images) ? f.images : []
        }));
      }
      
      // Clean variants array
      if (Array.isArray(cleaned.variants)) {
        cleaned.variants = cleaned.variants.map(v => ({
          flavor: v.flavor,
          weight: v.weight,
          price: v.price,
          stock: v.stock || 0
        }));
      }
      
      return cleaned;
    });

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products`);

    // Insert cleaned products
    const result = await Product.insertMany(cleanData);
    
    console.log(`\n✅ Successfully imported ${result.length} products!`);
    
    // Summary by category
    const categories = {};
    result.forEach(p => {
      const cat = p.category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    console.log('\n📊 Products by Category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Import failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

importProducts();
