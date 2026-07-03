require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const category = await Category.findOne({ name: { $regex: 'birthday', $options: 'i' } });
    if (category) {
      category.subCategories = ['vanilla-cakes', 'chocolate-cakes', 'red-velvet-cakes'];
      await category.save();
      console.log('Updated category:', category.name);
    } else {
      console.log('Birthday cakes category not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

run();
