require('dotenv').config();
const mongoose = require('mongoose');
const CustomCakeFlavor = require('./src/models/CustomCakeFlavor');

const calculateWeights = (basePrice) => {
  return [
    { kg: 1, price: basePrice },
    { kg: 1.5, price: basePrice + (basePrice / 2) },
    { kg: 2, price: basePrice * 2 },
    { kg: 2.5, price: basePrice * 2.5 },
    { kg: 3, price: basePrice * 3 }
  ];
};

const migrateFlavors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const flavors = await CustomCakeFlavor.find({ pricePerKg: { $exists: true } });
    console.log(`Found ${flavors.length} flavors to migrate.`);

    for (const flavor of flavors) {
      // Use pricePerKg if weights is missing or if we need to migrate it
      if (flavor.pricePerKg != null) {
        flavor.weights = calculateWeights(flavor.pricePerKg);
        flavor.pricePerKg = undefined;
        await flavor.save({ validateBeforeSave: false }); // Skip validation in case other fields changed
      }
    }

    // Also use updateMany to completely unset pricePerKg
    const result = await CustomCakeFlavor.updateMany(
      { pricePerKg: { $exists: true } },
      { $unset: { pricePerKg: "" } }
    );
    console.log(`Unset pricePerKg on ${result.modifiedCount} flavors.`);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateFlavors();
