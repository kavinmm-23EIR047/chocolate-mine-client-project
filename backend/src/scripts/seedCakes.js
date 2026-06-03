const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cakes = [
  'Choco truffle',
  'Choco fudge',
  'Black FOREST',
  'White Forest',
  'Butterscotch',
  'RED Velvet',
  'lotus biscoff',
  'Death by chocolate',
  'Choco oreo',
  'choco caramel',
  'Choco Pistachio',
  'VANILLA',
  'Fruits & Nuts',
  'Honey & almond',
  'rose milk',
  'Fresh PINEAPPLE',
  'Honey & lychee',
  'rose & lychee',
  'Filter Coffee',
  'Gulab Jamun',
  'vancho',
  'Classic vanilla',
  'Royal Gulkand',
  'English toffee',
  'Rasmalai',
  'Fresh Blueberry',
  'Layer of mixed berries',
  'Fresh Strawberry',
  'Nutty Truffle',
  'Choco Hazelnut',
  'Choco BOUNTY',
  'Choco Orange',
  'choco Strawberry',
  'choco Blueberry',
  'Choco Biscoff',
  'Kinder bueno',
  'choco ferrero',
  'mocha walnut',
];

const placeholderImage = 'https://via.placeholder.com/800x600?text=Cake';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for cake seeding');

    for (const name of cakes) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await Product.findOne({ slug });
      if (existing) {
        console.log(`Skipping existing: ${name}`);
        continue;
      }

      const doc = {
        name,
        slug,
        category: 'cakes',
        description: `${name} - Please update full description in admin.`,
        shortDescription: `${name}`,
        image: placeholderImage,
        price: 0,
        hasVariants: false,
        stock: 0,
        isActive: true
      };

      await Product.create(doc);
      console.log(`Seeded: ${name}`);
    }

    console.log('Cake seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
};

seed();
