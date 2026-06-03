const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

const removeDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: { name: "$name", category: "$category" },
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    let deletedCount = 0;
    
    for (const doc of duplicates) {
      // Keep the first document, delete the rest
      const docsToDelete = doc.docs.slice(1);
      
      if (docsToDelete.length > 0) {
        await Product.deleteMany({ _id: { $in: docsToDelete } });
        deletedCount += docsToDelete.length;
        console.log(`Deleted ${docsToDelete.length} duplicates for product: ${doc._id.name}`);
      }
    }
    
    console.log(`Finished removing duplicates. Total deleted: ${deletedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error removing duplicates:', error);
    process.exit(1);
  }
};

removeDuplicates();
