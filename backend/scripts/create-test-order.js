const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Payment = require('../src/models/Payment');

async function createTestOrder() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Get or create a test user
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.create({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        phone: '9876543210',
        password: 'password123',
        role: 'user',
        active: true,
        isVerified: true
      });
      console.log('Created test user:', user.email);
    } else {
      console.log('Using existing user:', user.email);
    }

    // 2. Get a product from the database
    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: 'Classic Chocolate Cake',
        description: 'Rich chocolate sponge cake',
        price: 850,
        category: 'Chocolate Cakes',
        stock: true
      });
      console.log('Created test product:', product.name);
    } else {
      console.log('Using existing product:', product.name);
    }

    // 3. Generate mock Order details
    const orderNumber = `TCM-${Date.now().toString().slice(-4)}`;
    const kotNumber = `KOT-${Date.now().toString().slice(-4)}`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1); // Deliver tomorrow

    const orderData = {
      orderNumber,
      kotNumber,
      userId: user._id,
      deliveryDate,
      deliverySlot: '6:00 PM – 8:00 PM',
      cakeMessage: 'Happy Birthday Kavin!',
      notes: 'Make it extra eggless and less sugar please.',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      paymentMethod: 'ONLINE',
      subtotal: product.price,
      discount: 0,
      deliveryCharge: 30,
      convenienceFee: 2,
      gst: 18,
      total: product.price + 30 + 2 + 18,
      address: {
        fullName: user.name,
        phone: user.phone,
        houseNo: 'Suite 24B',
        street: 'Avinashi Road',
        city: 'Coimbatore',
        pincode: '641018',
        lat: '11.0045',
        lng: '76.9751'
      },
      items: [
        {
          productId: product._id,
          name: product.name,
          qty: 1,
          price: product.price,
          selectedFlavor: 'Chocolate Fudge',
          selectedWeight: '1 kg',
          isCustomCake: true,
          customDetails: {
            shape: 'Heart Shape',
            tiers: 1,
            spongeType: 'Chocolate Sponge',
            creamColor: 'Brown',
            frostingColor: 'Dark Chocolate',
            designTheme: 'Premium Anniversary Theme',
            toppings: ['Chocolate Chips', 'Cherries'],
            eggless: true,
            lessSugar: true,
            notes: 'Write the message in white chocolate script'
          }
        }
      ]
    };

    console.log('Inserting test order...');
    const order = await Order.create(orderData);
    console.log(`✅ Success! Test Order created with Order Number: ${order.orderNumber}`);

    // Create corresponding payment log
    await Payment.create({
      orderId: order._id,
      razorpayOrderId: `pay_order_${Date.now()}`,
      razorpayPaymentId: `pay_id_${Date.now()}`,
      razorpaySignature: `pay_sig_${Date.now()}`,
      amount: order.total,
      status: 'paid',
      method: 'razorpay'
    });
    console.log('✅ Success! Payment entry created.');

  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

createTestOrder();
