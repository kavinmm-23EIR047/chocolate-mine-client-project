const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Get user profile
// @route   GET /api/v1/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.status(200).json({
    status: 'success',
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, email } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found', 404));

  // Update name
  if (name) user.name = name;
  
  // Update email if provided (email should be unique)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      return next(new AppError('Email already in use by another account', 400));
    }
    user.email = email;
  }
  
  // Update phone
  if (phone !== undefined) {
    const formattedPhone = phone.trim() === '' ? null : phone.trim();
    user.phone = formattedPhone;
  }

  // Update address fields (updating default address)
  const { address, city, pincode } = req.body;
  if (address || city || pincode) {
    let defaultAddr = user.addresses.find(addr => addr.isDefault);
    if (!defaultAddr && user.addresses.length > 0) {
      defaultAddr = user.addresses[0];
      defaultAddr.isDefault = true;
    }

    if (defaultAddr) {
      if (address) defaultAddr.street = address;
      if (city) defaultAddr.city = city;
      if (pincode) defaultAddr.pincode = pincode;
    } else {
      // Create a default address if none exists
      user.addresses.push({
        fullName: name || user.name,
        phone: phone || user.phone,
        houseNo: 'N/A',
        street: address || 'Not provided',
        city: city || 'Coimbatore',
        pincode: pincode || '641001',
        isDefault: true
      });
    }
  }

  await user.save();


  const updatedUser = await User.findById(user._id).select('-password');
  
  res.status(200).json({
    status: 'success',
    data: updatedUser
  });

});

// @desc    Get user addresses
// @route   GET /api/v1/users/addresses
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.status(200).json({ status: 'success', data: user.addresses });
});

// @desc    Add new address
// @route   POST /api/v1/users/addresses
exports.addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  const newAddress = {
    ...req.body,
    isDefault: user.addresses.length === 0 ? true : req.body.isDefault
  };

  if (newAddress.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  user.addresses.push(newAddress);
  await user.save();

  res.status(200).json({ status: 'success', data: user.addresses });
});

// @desc    Update address
// @route   PATCH /api/v1/users/addresses/:addressId
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(addressId);
  if (!address) return next(new AppError('Address not found', 404));

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) addr.isDefault = false;
    });
  }

  await user.save();
  res.status(200).json({ status: 'success', data: user.addresses });
});

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:addressId
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
  
  if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.status(200).json({ status: 'success', data: user.addresses });
});

// @desc    Toggle wishlist item
// @route   POST /api/v1/users/wishlist/toggle
exports.toggleWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);

  const index = user.wishlist.indexOf(productId);
  if (index > -1) {
    user.wishlist.splice(index, 1);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  res.status(200).json({ status: 'success', data: user.wishlist });
});

// @desc    Get user wishlist
// @route   GET /api/v1/users/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.status(200).json({ status: 'success', data: user.wishlist });
});

// @desc    Update FCM Token
// @route   PUT /api/v1/users/fcm-token
exports.updateFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) {
    return next(new AppError('FCM Token is required', 400));
  }

  const user = await User.findById(req.user._id);
  user.fcmToken = fcmToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'FCM Token updated successfully'
  });
});