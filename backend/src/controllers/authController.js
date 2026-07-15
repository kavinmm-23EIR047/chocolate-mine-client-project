const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpSession = require('../models/OtpSession');
const emailService = require('../services/emailService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m'
    }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set HttpOnly access token cookie (Session cookie - deleted on browser close)
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  // Set HttpOnly refresh token cookie (Session cookie - deleted on browser close)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(statusCode).json({
    status: 'success',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      fcmTokens: user.fcmTokens || [],
      notificationEnabled: user.notificationEnabled
    }
  });
};

// @desc    Normal Signup
// @route   POST /api/v1/auth/signup
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'user',
    active: true,
    isVerified: true,
    provider: 'local'
  });

  try {
    const notificationManager = require('../services/notificationManager');
    notificationManager.notifyNewUserRegistration(user).catch(err => console.error('Notification Error:', err));
  } catch (err) {
    console.error('Notification Error:', err);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Normal Login
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const trimmedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: trimmedEmail,
    active: { $ne: false }
  }).select('+password');

  if (!user) {
    console.log(`❌ Login failed: User not found for ${trimmedEmail}`);
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.password) {
    console.log(`❌ Login failed: User ${trimmedEmail} has no password set (likely a Google user)`);
    return next(new AppError('This account does not have a password. Please login with Google.', 401));
  }

  let isCorrect = false;

  const isHashed =
    user.password &&
    user.password.startsWith('$2');

  if (isHashed) {
    isCorrect = await user.comparePassword(
      password,
      user.password
    );
  } else {
    if (user.password === password) {
      isCorrect = true;
      user.password = password;
      await user.save({
        validateBeforeSave: false
      });
    }
  }

  if (!isCorrect) {
    console.log(`❌ Login failed: Incorrect password for ${trimmedEmail}`);
    return next(new AppError('Invalid email or password', 401));
  }

  user.lastActiveAt = Date.now();

  await user.save({
    validateBeforeSave: false
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Get Current User
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      fcmTokens: req.user.fcmTokens || [],
      notificationEnabled: req.user.notificationEnabled
    }
  });
});

// @desc    Google OAuth Success Redirect
exports.googleSuccess = asyncHandler(async (req, res) => {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    'https://chocolate-mine-client-project.vercel.app';

  if (req.user) {
    const accessToken = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);

    // Set HttpOnly access token cookie (Session cookie)
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    // Set HttpOnly refresh token cookie (Session cookie)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.redirect(
      `${frontendUrl}/oauth-callback?token=${accessToken}`
    );
  } else {
    res.redirect(
      `${frontendUrl}/login?error=GoogleAuthFailed`
    );
  }
});

// @desc    Firebase Auth Backend Synchronization
// @route   POST /api/v1/auth/firebase-login
exports.firebaseLogin = asyncHandler(async (req, res, next) => {
  const { email, name, avatar } = req.body;

  if (!email) {
    return next(new AppError('Email is required for Firebase Login', 400));
  }

  const trimmedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: trimmedEmail });

  if (!user) {
    // Create new user if they don't exist
    user = await User.create({
      name: name || 'Google User',
      email: trimmedEmail,
      active: true,
      isVerified: true,
      provider: 'google'
    });
    
    try {
      const notificationManager = require('../services/notificationManager');
      notificationManager.notifyNewUserRegistration(user).catch(err => console.error('Notification Error:', err));
    } catch (err) {
      console.error('Notification Error:', err);
    }
  } else {
    // Update last active
    user.lastActiveAt = Date.now();
    await user.save({ validateBeforeSave: false });
  }

  // Issue standard JWT cookies so the rest of the app works seamlessly
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot Password - Generate OTP and send email
// @route   POST /api/v1/auth/forgot-password
// @desc    Forgot Password - Generate OTP and send email
// @route   POST /api/v1/auth/forgot-password
// @desc    Forgot Password - Optimized for Fast Frontend Loading
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }

  const targetEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: targetEmail });

  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // 1. Generate OTP and Hash it
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 12);

  // 2. Wait for the Database record creation
  await OtpSession.create({
    email: targetEmail,
    hashedOtp,
    type: 'password_reset',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // 3. 💡 OPTIMIZATION: Remove "await" from the email service!
  // This sends the email in the background. Node.js won't block the API response.
  emailService.sendPasswordResetOTP(targetEmail, otp).catch((err) => {
    console.error('Background Email Sending Failed:', err.message);
  });

  // 4. Respond instantly to the frontend!
  res.status(200).json({
    status: 'success',
    message: 'OTP sent to your email'
  });
});

// @desc    Reset Password - Verify OTP and update password
// @route   POST /api/v1/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return next(
      new AppError(
        'Please provide email, otp and new password',
        400
      )
    );
  }

  const session = await OtpSession.findOne({
    email,
    type: 'password_reset',
    isUsed: false,
    expiresAt: { $gt: new Date() }

  }).sort('-createdAt');

  if (!session) {
    return next(
      new AppError(
        'OTP expired or not found. Please request a new one.',
        400
      )
    );
  }

  const isCorrect = await bcrypt.compare(
    otp,
    session.hashedOtp
  );

  if (!isCorrect) {
    return next(
      new AppError(
        'Invalid OTP. Please try again.',
        400
      )
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new AppError('User not found', 404)
    );
  }

  user.password = password;

  await user.save();

  session.isUsed = true;

  await session.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully'
  });
});