const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://akwebflairtechnologies:Kavin20@cluster0.e8em7w1.mongodb.net/properties');
  console.log('Connected to Atlas');
  try {
    const indexes = await mongoose.connection.collection('customcakethemes').indexes();
    console.log(indexes);
    try {
      await mongoose.connection.collection('customcakethemes').dropIndex('colors._id_1');
      console.log('Dropped colors._id_1 index successfully');
    } catch(e) {
      console.log('Failed to drop colors._id_1:', e.message);
    }
  } catch(e) {
    console.log(e);
  }
  process.exit(0);
}
run();
