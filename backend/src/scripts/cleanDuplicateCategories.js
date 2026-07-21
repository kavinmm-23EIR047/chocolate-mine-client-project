const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function cleanEmptyAndDuplicateCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chocolate-mine');
    console.log('Connected to MongoDB...');

    // 1. Pull empty strings, whitespace-only strings, or nulls using MongoDB updateMany
    const pullResult = await Product.updateMany(
      {},
      { $pull: { category: { $regex: /^\s*$/ } } }
    );
    console.log(`Pulled empty/whitespace array items from database (${pullResult.modifiedCount} products modified).`);

    // 2. Loop products to trim and deduplicate category array items
    const products = await Product.find({});
    let updatedCount = 0;

    for (const p of products) {
      let cats = [];
      if (Array.isArray(p.category)) {
        cats = p.category;
      } else if (typeof p.category === 'string') {
        const trimmed = p.category.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) cats = parsed;
            else cats = [trimmed];
          } catch {
            cats = [trimmed];
          }
        } else {
          cats = [trimmed];
        }
      }

      // Filter out empty strings, trim, and keep unique valid category strings
      const cleanedCats = [...new Set(
        cats
          .map(c => typeof c === 'string' ? c.replace(/\\"/g, '').replace(/"/g, '').trim().toLowerCase() : '')
          .filter(c => c && c.length > 0)
      )];

      const isDifferent = JSON.stringify(p.category) !== JSON.stringify(cleanedCats);
      if (isDifferent) {
        p.category = cleanedCats;
        await p.save();
        updatedCount++;
        console.log(`Cleaned "${p.name}": [${cleanedCats.map(c => `"${c}"`).join(', ')}]`);
      }
    }

    console.log(`Successfully cleaned category arrays for ${updatedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning categories:', err);
    process.exit(1);
  }
}

cleanEmptyAndDuplicateCategories();
