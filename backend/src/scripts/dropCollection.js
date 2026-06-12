const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dropCollection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Dropping googlereviews collection...');
    
    // Drop the collection
    await mongoose.connection.db.dropCollection('googlereviews').catch(e => {
      console.log('Collection might not exist yet, ignoring error:', e.message);
    });
    
    console.log('Successfully dropped googlereviews collection.');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping collection:', err);
    process.exit(1);
  }
};

dropCollection();
