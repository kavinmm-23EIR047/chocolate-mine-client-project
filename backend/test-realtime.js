const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const excelService = require('./src/services/excelService');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runTest() {
  console.log('🚀 Starting Real-time Excel Sync Test...');
  
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chocolatemine');
    console.log('📦 Connected to MongoDB');
    
    // 2. Initialize Excel Service manually (to simulate server start)
    // Removed to prevent EBUSY with main server that is already running
    
    // 3. Find a dummy user and product to create an order
    const user = await User.findOne() || await User.create({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: '1234567890',
      password: 'password123'
    });
    
    const product = await Product.findOne() || await Product.create({
      name: 'Test Cake',
      category: 'Test',
      price: 500,
      description: 'A test cake',
      stock: 10
    });

    // 4. Create a test order
    console.log('🛒 Creating test order...');
    const testOrder = new Order({
      userId: user._id,
      items: [{
        productId: product._id,
        name: product.name,
        qty: 1,
        price: product.price
      }],
      subtotal: product.price,
      total: product.price,
      address: {
        fullName: 'Test Customer',
        phone: '1234567890'
      }
    });

    await testOrder.save();
    console.log(`✅ Order created successfully: ${testOrder._id}`);
    
    // 5. Wait 3 seconds
    console.log('⏳ Waiting 3 seconds for Excel sync...');
    await delay(3000);
    
    // 6. Check Excel file
    console.log('📊 Checking Excel file...');
    const masterFile = excelService.getMasterFile();
    
    if (!fs.existsSync(masterFile)) {
      throw new Error('Master Excel file does not exist!');
    }
    
    const wb = xlsx.readFile(masterFile);
    const orderSheet = wb.Sheets['Order'];
    
    if (!orderSheet) {
      throw new Error('Order sheet does not exist in Excel file!');
    }
    
    const data = xlsx.utils.sheet_to_json(orderSheet);
    const orderInExcel = data.find(row => String(row._id) === String(testOrder._id));
    
    if (orderInExcel) {
      console.log('🎉 PASS: Order found in Excel in real-time!');
      console.log('Details:', {
        id: orderInExcel._id,
        total: orderInExcel.total,
        status: orderInExcel.orderStatus
      });
    } else {
      console.error('❌ FAIL: Order NOT found in Excel!');
    }

    // Cleanup: Delete the test order
    console.log('🧹 Cleaning up test data...');
    await Order.findByIdAndDelete(testOrder._id);
    await delay(2000); // Wait for delete hook to sync
    
    console.log('✅ Test complete.');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
