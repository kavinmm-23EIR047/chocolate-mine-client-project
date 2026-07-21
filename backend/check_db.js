const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://akwebflairtechnologies:Kavin20@cluster0.e8em7w1.mongodb.net/properties');
  const collection = mongoose.connection.collection('customcakethemes');
  
  // Find the doc we are trying to update
  const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId("6a5f86d647c8796a82b4d8e9") });
  console.log('Doc with ID 6a5f86d647c8796a82b4d8e9:', doc ? doc.name : 'Not Found');

  // Find doc with name Simple square
  const docByName = await collection.findOne({ name: "Simple square" });
  console.log('Doc with name Simple square:', docByName ? docByName._id.toString() : 'Not Found');
  
  process.exit(0);
}
run();
