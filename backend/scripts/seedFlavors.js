const mongoose = require('mongoose');
const CustomCakeFlavor = require('../src/models/CustomCakeFlavor');
require('dotenv').config();

const flavors = [
  // Vanilla Cakes
  { name: 'Classic Vanilla', category: 'Vanilla Cakes', pricePerKg: 520 },
  { name: 'White Forest', category: 'Vanilla Cakes', pricePerKg: 560 },
  { name: 'Fresh Pineapple', category: 'Vanilla Cakes', pricePerKg: 650 },
  { name: 'Fruits & Nuts', category: 'Vanilla Cakes', pricePerKg: 690 },
  { name: 'Honey & Almond', category: 'Vanilla Cakes', pricePerKg: 690 },
  { name: 'Rose Milk', category: 'Vanilla Cakes', pricePerKg: 690 },
  { name: 'Filter Coffee', category: 'Vanilla Cakes', pricePerKg: 730 },
  { name: 'Gulab Jamun', category: 'Vanilla Cakes', pricePerKg: 770 },
  { name: 'Honey & Lychee', category: 'Vanilla Cakes', pricePerKg: 780 },
  { name: 'Rose & Lychee', category: 'Vanilla Cakes', pricePerKg: 780 },
  { name: 'Vancho', category: 'Vanilla Cakes', pricePerKg: 830 },
  { name: 'Royal Gulkand', category: 'Vanilla Cakes', pricePerKg: 830 },
  { name: 'Rasmalai', category: 'Vanilla Cakes', pricePerKg: 850 },
  { name: 'Fresh Strawberry', category: 'Vanilla Cakes', pricePerKg: 870 },
  { name: 'Lotus Biscoff', category: 'Vanilla Cakes', pricePerKg: 890 },
  { name: 'Fresh Blueberry', category: 'Vanilla Cakes', pricePerKg: 890 },
  { name: 'Very Berry', category: 'Vanilla Cakes', pricePerKg: 950 },
  
  // Chocolate Cakes
  { name: 'Black Forest', category: 'Chocolate Cakes', pricePerKg: 560 },
  { name: 'Choco Fudge', category: 'Chocolate Cakes', pricePerKg: 610 },
  { name: 'Choco Oreo', category: 'Chocolate Cakes', pricePerKg: 670 },
  { name: 'Choco Truffle', category: 'Chocolate Cakes', pricePerKg: 670 },
  { name: 'Choco Caramel', category: 'Chocolate Cakes', pricePerKg: 690 },
  { name: 'Mocha Walnut', category: 'Chocolate Cakes', pricePerKg: 690 },
  { name: 'Choco Bounty', category: 'Chocolate Cakes', pricePerKg: 750 },
  { name: 'Death By Chocolate', category: 'Chocolate Cakes', pricePerKg: 750 },
  { name: 'Choco Orange', category: 'Chocolate Cakes', pricePerKg: 770 },
  { name: 'Nutty Truffle', category: 'Chocolate Cakes', pricePerKg: 780 },
  { name: 'Choco Hazelnut', category: 'Chocolate Cakes', pricePerKg: 780 },
  { name: 'Choco Strawberry', category: 'Chocolate Cakes', pricePerKg: 870 },
  { name: 'Red Velvet', category: 'Chocolate Cakes', pricePerKg: 870 }, // Listed under Chocolate in the prompt? No, Red Velvet Cakes category is separate, but Red Velvet is also here.
  { name: 'Choco Blueberry', category: 'Chocolate Cakes', pricePerKg: 890 },
  { name: 'Choco Biscoff', category: 'Chocolate Cakes', pricePerKg: 890 },
  { name: 'Kinder Bueno', category: 'Chocolate Cakes', pricePerKg: 890 },
  { name: 'Choco Ferrero', category: 'Chocolate Cakes', pricePerKg: 930 },
  { name: 'Choco Pistachio', category: 'Chocolate Cakes', pricePerKg: 950 },
  
  // Red Velvet Cakes
  { name: 'Red Velvet', category: 'Red Velvet Cakes', pricePerKg: 870 }
];

const seedFlavors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing
    await CustomCakeFlavor.deleteMany();
    console.log('Cleared existing custom cake flavors');
    
    try {
      await CustomCakeFlavor.collection.dropIndexes();
      console.log('Dropped indexes');
    } catch (e) {
      console.log('No indexes to drop');
    }
    
    // Insert new
    await CustomCakeFlavor.insertMany(flavors);
    console.log('Successfully seeded flavors');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding flavors:', error);
    process.exit(1);
  }
};

seedFlavors();
