const mongoose = require('mongoose');

// Helper function to generate SKU for an item
function generateSKU(productName, category, flavor, weight, index) {
  // Get first 3 letters of product name (uppercase)
  const nameCode = productName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
  
  // Get category code (first 3 letters)
  const categoryCode = category ? category.substring(0, 3).toUpperCase() : 'PRD';
  
  // Flavor code (first 2 letters)
  const flavorCode = flavor ? flavor.substring(0, 2).toUpperCase() : 'ST';
  
  // Weight code (remove spaces, take first 2 chars)
  let weightCode = 'KG';
  if (weight) {
    const weightNum = weight.replace(/[^0-9.]/g, '');
    if (weightNum) {
      weightCode = weightNum.replace('.', '').substring(0, 2);
    }
  }
  
  // Date code (YYMMDD)
  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  
  // Sequence number (3 digits)
  const seqNum = String(index + 1).padStart(3, '0');
  
  // Final SKU format: XXX-YYY-ZZ-WW-YYMMDD-XXX
  return `${nameCode}-${categoryCode}-${flavorCode}-${weightCode}-${dateCode}-${seqNum}`;
}

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, sparse: true },
    trackingCode: { type: String, unique: true, sparse: true },
    kotNumber: { type: String, unique: true, sparse: true },
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
    customCakePdfUrl: { type: String },



    // ✅ Add this field - Track if review has been submitted
    reviewed: { type: Boolean, default: false },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    deliveryDate: { type: Date },

    deliverySlot: {
      type: String,
      enum: [
        'Morning',
        'Afternoon',
        'Evening',
        'Night',
        'Morning (9AM-12PM)',
        'Afternoon (12PM-4PM)',
        'Evening (4PM-8PM)',
        'Night (8PM-11PM)',
        '10am-1pm',
        '1pm-4pm',
        '4pm-7pm',
        '7pm-10pm',
        '10:00 AM – 12:00 PM',
        '12:00 PM – 2:00 PM',
        '2:00 PM – 4:00 PM',
        '4:00 PM – 6:00 PM',
        '6:00 PM – 8:00 PM',
        '8:00 PM – 10:00 PM'
      ]
    },

    cakeMessage: { type: String },
    notes: { type: String },

    kotPrinted: { type: Boolean, default: false },
    kotPrintedAt: { type: Date },
    kotReprintCount: { type: Number, default: 0 },

    invoiceSent: { type: Boolean, default: false },
    invoiceSentAt: { type: Date },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        couponCode: { type: String },
        discountAmount: { type: Number, default: 0 },
        image: { type: String },
        
        // SKU for the item
        sku: { type: String, unique: false, sparse: true },

        selectedFlavor: { type: String },
        selectedWeight: { type: String },
        customFlavor: { type: String },
        customWeight: { type: String },

        isCustomCake: { type: Boolean, default: false },

        customDetails: {
          shape: { type: String },
          tiers: { type: Number },
          weight: { type: String },
          flavour: { type: String },
          spongeType: { type: String },
          creamColor: { type: String },
          frostingColor: { type: String },
          designTheme: { type: String },
          toppings: [String],
          messageOnCake: { type: String },
          candleRequired: { type: Boolean },
          knifeIncluded: { type: Boolean },
          photoReferenceUrl: { type: String },
          lessSugar: { type: Boolean, default: false },
          eggless: { type: Boolean, default: false },
          notes: { type: String },
          deliveryDate: { type: Date },
          deliverySlot: { type: String }
        },

        designImages: {
          preview: { type: String },
          front: { type: String },
          top: { type: String },
          left: { type: String },
          right: { type: String }
        }
      }
    ],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: {
      type: String,
      default: 'ONLINE'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'created', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },

    orderStatus: {
      type: String,
      enum: ['confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'confirmed'
    },

    kitchenStatus: {
      type: String,
      default: 'pending'
    },

    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      houseNo: { type: String },
      street: { type: String },
      city: { type: String },
      pincode: { type: String },
      lat: { type: Number },
      lng: { type: Number }
    },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentAttemptAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Generate user-friendly order number (format: K001, K002, etc.)
function generateOrderNumber() {
  const random = Math.floor(100 + Math.random() * 900);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${letter}${random}${Date.now().toString().slice(-3)}`;
}

// Generate SKU for each item before saving
orderSchema.pre('save', function() {
  // Generate order number if not exists
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  
  // Generate SKU for each item
  this.items.forEach((item, index) => {
    if (!item.sku) {
      const category = 'CAKE';
      item.sku = generateSKU(
        item.name, 
        category, 
        item.selectedFlavor || item.customFlavor, 
        item.selectedWeight || item.customWeight,
        index
      );
    }
  });
});

// Method to get SKU for tracking
orderSchema.methods.getOrderSKUs = function() {
  return this.items.map(item => ({
    name: item.name,
    sku: item.sku,
    qty: item.qty
  }));
};

orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });


module.exports = mongoose.model('Order', orderSchema);