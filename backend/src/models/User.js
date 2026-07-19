const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false,
    minlength: 6
  },
  googleId: {
    type: String,
    sparse: true
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  phone: {
    type: String,
    sparse: true
    // ✅ REMOVED unique: true - Multiple users can now have the same phone number
  },
  role: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  fcmTokens: [{
    token: { type: String, required: true },
    deviceName: { type: String, default: 'Unknown Device' },
    createdAt: { type: Date, default: Date.now }
  }],
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  addresses: [{
    fullName: String,
    phone: String,
    houseNo: String,
    street: String,
    landmark: String,
    city: { type: String, default: 'Coimbatore' },
    pincode: String,
    lat: Number,
    lng: Number,
    type: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  customCakeWishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomCakeTheme'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return bcrypt.compare(candidatePassword, userPassword);
};




// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

userSchema.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

userSchema.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    const query = this.getQuery();
    if (doc && doc._id) {
      await excelService.updateInExcel(modelName, doc._id, doc);
    } else if (query && query._id) {
      const updatedDoc = await this.model.findOne(query).lean();
      if (updatedDoc) await excelService.updateInExcel(modelName, query._id, updatedDoc);
    }
  } catch (err) {
    console.error("Excel sync error for update:", err.message);
  }
});

userSchema.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    if (doc && doc._id) {
      await excelService.deleteFromExcel(modelName, doc._id);
    } else {
      const query = this.getQuery();
      if (query && query._id) {
         await excelService.deleteFromExcel(modelName, query._id);
      }
    }
  } catch (err) {
    console.error("Excel sync error for delete:", err.message);
  }
});

module.exports = mongoose.model('User', userSchema);
