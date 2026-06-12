const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema({
  phone: { type: String },
  email: { type: String },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    index: true 
  },
  otp: { type: String }, // Plain OTP for delivery (not hashed for delivery staff)
  hashedOtp: { type: String }, // For user login/registration (hashed)
  type: { 
    type: String, 
    enum: ['login', 'register', 'delivery', 'password_reset'],
    default: 'login'
  },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  verifiedAt: { type: Date }
}, { timestamps: true });

// Index for auto-expiry
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// Method to check if OTP is expired
otpSessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
otpSessionSchema.methods.isLocked = function() {
  return this.attempts >= this.maxAttempts;
};

// Method to increment attempts
otpSessionSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  if (this.attempts >= this.maxAttempts) {
    this.isUsed = true;
  }
  await this.save();
  return this.attempts;
};

// Method to verify OTP
otpSessionSchema.methods.verifyOtp = function(inputOtp) {
  if (this.isUsed) return { valid: false, message: 'OTP already used' };
  if (this.isExpired()) return { valid: false, message: 'OTP expired' };
  if (this.isLocked()) return { valid: false, message: 'Too many attempts' };
  
  // For delivery OTP, compare plain text
  if (this.type === 'delivery') {
    const isValid = this.otp === inputOtp;
    if (isValid) {
      this.isUsed = true;
      this.verifiedAt = new Date();
    } else {
      this.incrementAttempts();
    }
    return { valid: isValid, message: isValid ? 'OTP verified' : 'Invalid OTP' };
  }
  
  // For hashed OTP (login/register)
  const bcrypt = require('bcryptjs');
  const isValid = bcrypt.compareSync(inputOtp, this.hashedOtp);
  if (isValid) {
    this.isUsed = true;
    this.verifiedAt = new Date();
  } else {
    this.incrementAttempts();
  }
  return { valid: isValid, message: isValid ? 'OTP verified' : 'Invalid OTP' };
};




// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

otpSessionSchema.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

otpSessionSchema.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
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

otpSessionSchema.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
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

module.exports = mongoose.model('OtpSession', otpSessionSchema);
