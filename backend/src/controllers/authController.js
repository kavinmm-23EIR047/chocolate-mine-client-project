const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const OtpSession = require('../models/OtpSession');
const emailService = require('../services/emailService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSMS, normalizeIndianPhone } = require('../services/smsService');

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d'
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

const hasPhoneNumber = (user) => Boolean(user?.phone && String(user.phone).trim() && user.phone !== 'Not provided');
const hasVerifiedPhone = (user) => Boolean(
  hasPhoneNumber(user) && (user.phoneVerified === true || user.provider === 'local')
);

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set HttpOnly access token cookie
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  // Set HttpOnly refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/'
  });

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneNumber: user.phone || null,
      phoneVerified: hasVerifiedPhone(user),
      isVerified: user.isVerified === true,
      fcmTokens: user.fcmTokens || [],
      notificationEnabled: user.notificationEnabled
    }
  });
};

const issueSignupOtp = async (email) => {
  const targetEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 12);
  const otpSession = await OtpSession.create({
    email: targetEmail,
    hashedOtp,
    type: 'register',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await emailService.sendSignupOTP(targetEmail, otp);
  } catch (err) {
    await OtpSession.deleteOne({ _id: otpSession._id });
    throw new AppError('We could not send the verification email. Please try again.', 503);
  }

  return targetEmail;
};

// @desc    Check if email is already registered
// @route   POST /api/v1/auth/check-email
exports.checkEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return next(new AppError('Please provide an email address.', 400, 'VALIDATION_ERROR'));
  }
  const targetEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: targetEmail }).select('+password');

  if (user) {
    if (user.provider === 'google') {
      return res.status(200).json({
        status: 'success',
        exists: true,
        provider: 'google',
        code: 'GOOGLE_ACCOUNT_DETECTED',
        message: 'This email is registered with Google. Please use Continue with Google.'
      });
    }
    if (user.isVerified || user.password) {
      return res.status(200).json({
        status: 'success',
        exists: true,
        provider: 'local',
        code: 'ACCOUNT_EXISTS',
        message: 'An account with this email already exists. Please Sign In.'
      });
    }
  }

  return res.status(200).json({
    status: 'success',
    exists: false,
    message: 'Email is available'
  });
});

// @desc    Send Signup OTP to email
// @route   POST /api/v1/auth/send-signup-otp
exports.sendSignupOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return next(new AppError('Please provide an email address.', 400, 'VALIDATION_ERROR'));
  }
  const targetEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: targetEmail }).select('+password');

  if (user) {
    if (user.provider === 'google') {
      return next(
        new AppError(
          'This email is already registered with Google. Please click "Continue with Google" to sign in.',
          400,
          'GOOGLE_ACCOUNT_DETECTED'
        )
      );
    }
    if (user.isVerified || user.password) {
      return next(
        new AppError(
          'An account with this email already exists. Please sign in instead.',
          400,
          'ACCOUNT_EXISTS'
        )
      );
    }
  }

  await issueSignupOtp(targetEmail);
  console.log(`[AUTH][SEND_OTP][SUCCESS] email=${targetEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'A 6-digit verification code has been sent to your email.'
  });
});

// @desc    Verify Email OTP before registration
// @route   POST /api/v1/auth/verify-email-otp
exports.verifyEmailOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new AppError('Please provide both email and OTP.', 400, 'VALIDATION_ERROR'));
  }
  const targetEmail = email.trim().toLowerCase();
  
  const otpSession = await OtpSession.findOne({
    email: targetEmail,
    type: 'register',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort('-createdAt');

  if (!otpSession) {
    return next(new AppError('The verification code has expired or is invalid. Please request a new one.', 400, 'OTP_EXPIRED'));
  }

  const isMatch = await bcrypt.compare(otp.trim(), otpSession.hashedOtp);
  if (!isMatch) {
    return next(new AppError('Incorrect verification code. Please check and try again.', 400, 'INVALID_OTP'));
  }

  otpSession.isUsed = true;
  otpSession.verifiedAt = new Date();
  await otpSession.save();

  console.log(`[AUTH][VERIFY_EMAIL_OTP][SUCCESS] email=${targetEmail}`);
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully!',
    email: targetEmail,
    verified: true
  });
});

// @desc    Password-based User Registration
// @route   POST /api/v1/auth/signup
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, otp } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();
  console.log(`[AUTH][SIGNUP][REQUEST] email=${targetEmail}`);

  let user = await User.findOne({ email: targetEmail }).select('+password');

  if (user) {
    // 1. If user previously signed up using Google
    if (user.provider === 'google') {
      console.log(`[AUTH][SIGNUP][FAILED] email=${targetEmail} reason=GOOGLE_ACCOUNT_EXISTS`);
      return next(
        new AppError(
          'This email is already registered with Google. Please click "Continue with Google" to sign in.',
          400,
          'GOOGLE_ACCOUNT_DETECTED'
        )
      );
    }

    // 2. If user already has a complete/verified password account
    if (user.isVerified || user.password) {
      console.log(`[AUTH][SIGNUP][FAILED] email=${targetEmail} reason=ACCOUNT_ALREADY_EXISTS`);
      return next(
        new AppError(
          'An account with this email already exists. Please sign in instead.',
          400,
          'ACCOUNT_EXISTS'
        )
      );
    }
  }

  // Verify email verification session or provided OTP
  let isEmailVerified = false;

  if (otp) {
    const otpSession = await OtpSession.findOne({
      email: targetEmail,
      type: 'register',
      $or: [
        { isUsed: false, expiresAt: { $gt: new Date() } },
        { isUsed: true, verifiedAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } }
      ]
    }).sort('-createdAt');

    if (otpSession) {
      if (otpSession.isUsed && otpSession.verifiedAt) {
        isEmailVerified = true;
      } else if (await bcrypt.compare(otp.trim(), otpSession.hashedOtp)) {
        otpSession.isUsed = true;
        otpSession.verifiedAt = new Date();
        await otpSession.save();
        isEmailVerified = true;
      }
    }
  }

  // Check if a recent verified OtpSession exists for this email
  if (!isEmailVerified) {
    const recentVerifiedSession = await OtpSession.findOne({
      email: targetEmail,
      type: 'register',
      isUsed: true,
      verifiedAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
    }).sort('-verifiedAt');

    if (recentVerifiedSession) {
      isEmailVerified = true;
    }
  }

  if (user) {
    user.name = name || user.name;
    user.password = password;
    user.phone = phone || user.phone;
    user.isVerified = isEmailVerified;
    user.phoneVerified = true;
    user.provider = 'local';
    await user.save();
  } else {
    user = await User.create({
      name,
      email: targetEmail,
      password,
      phone,
      role: 'user',
      active: true,
      isVerified: isEmailVerified,
      provider: 'local',
      phoneVerified: true
    });
  }

  if (isEmailVerified) {
    console.log(`[AUTH][SIGNUP][SUCCESS] userId=${user._id} email=${targetEmail}`);
    return sendTokenResponse(user, 201, res);
  }

  // If email was not verified yet, issue OTP and request verification
  await issueSignupOtp(targetEmail);
  console.log(`[AUTH][SIGNUP][OTP_ISSUED] email=${targetEmail}`);

  res.status(201).json({
    status: 'success',
    message: 'A 6-digit verification code has been sent to your email. Please verify to complete registration.',
    requiresOtp: true,
    email: targetEmail
  });
});

// @desc    Verify Signup OTP
// @route   POST /api/v1/auth/verify-signup
exports.verifySignup = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError('Please provide both email and OTP.', 400, 'VALIDATION_ERROR'));
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[AUTH][VERIFY_OTP][REQUEST] email=${normalizedEmail}`);
  const mongoSession = await mongoose.startSession();
  let user;

  try {
    await mongoSession.withTransaction(async () => {
      const otpSession = await OtpSession.findOne({
        email: normalizedEmail,
        type: 'register',
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort('-createdAt').session(mongoSession);

      if (!otpSession) {
        throw new AppError('The verification code has expired or is invalid. Please request a new one.', 400, 'OTP_EXPIRED');
      }

      if (!await bcrypt.compare(otp, otpSession.hashedOtp)) {
        throw new AppError('Incorrect verification code. Please check and try again.', 400, 'INVALID_OTP');
      }

      const claimedSession = await OtpSession.findOneAndUpdate(
        { _id: otpSession._id, isUsed: false },
        { $set: { isUsed: true, verifiedAt: new Date() } },
        { returnDocument: 'after', session: mongoSession }
      );

      if (!claimedSession) {
        throw new AppError('This verification code was already used. Please request a new one.', 400, 'OTP_ALREADY_USED');
      }

      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { isVerified: true, phoneVerified: true } },
        { returnDocument: 'after', session: mongoSession }
      );

      if (!user) {
        throw new AppError('Account not found. Please sign up again.', 404, 'USER_NOT_FOUND');
      }
    });
  } catch (err) {
    await mongoSession.endSession();
    if (err.isOperational) return next(err);
    console.error(`[AUTH][VERIFY_OTP][ERROR] email=${normalizedEmail}:`, err);
    return next(new AppError('Failed to verify account. Please try again.', 500, 'SERVER_ERROR'));
  }
  await mongoSession.endSession();

  try {
    const notificationManager = require('../services/notificationManager');
    notificationManager.notifyNewUserRegistration(user).catch(err => console.error('Notification Error:', err));
  } catch (err) {
    console.error('Notification Error:', err);
  }

  console.log(`[AUTH][VERIFY_OTP][SUCCESS] userId=${user._id} email=${normalizedEmail}`);
  sendTokenResponse(user, 200, res);
});

// @desc    Resend Signup OTP
// @route   POST /api/v1/auth/resend-signup-otp
exports.resendSignupOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email address.', 400, 'VALIDATION_ERROR'));
  }

  const targetEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: targetEmail });

  if (!user) {
    return next(new AppError('No account found with that email address.', 404, 'USER_NOT_FOUND'));
  }

  if (user.isVerified) {
    return next(new AppError('Your account is already verified. Please log in.', 400, 'ACCOUNT_ALREADY_VERIFIED'));
  }

  await issueSignupOtp(targetEmail);
  console.log(`[AUTH][RESEND_OTP][SUCCESS] email=${targetEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'A new OTP has been sent to your email.'
  });
});

// @desc    Password-based User Login
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400, 'VALIDATION_ERROR'));
  }

  const trimmedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: trimmedEmail,
    active: { $ne: false }
  }).select('+password');

  if (!user) {
    console.log(`[AUTH][LOGIN][FAILED] email=${trimmedEmail} reason=USER_NOT_FOUND`);
    return next(new AppError('Incorrect email or password. Please try again.', 401, 'INVALID_CREDENTIALS'));
  }

  if (user.provider === 'google' || !user.password) {
    console.log(`[AUTH][LOGIN][FAILED] email=${trimmedEmail} reason=GOOGLE_ACCOUNT_DETECTED`);
    return next(new AppError('This account was created using Google. Please continue with Google Sign-In.', 401, 'GOOGLE_ACCOUNT_DETECTED'));
  }

  if (!user.isVerified) {
    try {
      await issueSignupOtp(trimmedEmail);
    } catch (err) {
      return next(err);
    }
    console.log(`[AUTH][LOGIN][OTP_REQUIRED] email=${trimmedEmail}`);
    return res.status(403).json({
      status: 'fail',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email before continuing.',
      requiresOtp: true,
      email: trimmedEmail
    });
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
    console.log(`[AUTH][LOGIN][FAILED] email=${trimmedEmail} reason=INVALID_PASSWORD`);
    return next(new AppError('Incorrect email or password. Please try again.', 401, 'INVALID_CREDENTIALS'));
  }

  user.lastActiveAt = Date.now();

  await user.save({
    validateBeforeSave: false
  });

  console.log(`[AUTH][LOGIN][SUCCESS] userId=${user._id} email=${trimmedEmail}`);
  sendTokenResponse(user, 200, res);
});

// @desc    Get Current User
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const account = await User.findById(req.user._id);
  const phoneVerified = hasVerifiedPhone(account);

  res.status(200).json({
    status: 'success',
    authenticated: true,
    requiresDetails: !phoneVerified,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      phoneNumber: req.user.phone || null,
      phoneVerified,
      isVerified: req.user.isVerified === true,
      fcmTokens: req.user.fcmTokens || [],
      notificationEnabled: req.user.notificationEnabled
    }
  });
});

// @desc    Google OAuth Success Redirect
exports.googleSuccess = asyncHandler(async (req, res) => {
  const { getFrontendUrl } = require('../utils/urlUtils');
  const frontendUrl = getFrontendUrl();

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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/'
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
    return next(new AppError('Google authentication failed. Email was not provided.', 400, 'VALIDATION_ERROR'));
  }

  const trimmedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: trimmedEmail });

  if (!user) {
    try {
      user = await User.create({
        name: name || 'Google User',
        email: trimmedEmail,
        active: true,
        isVerified: true,
        provider: 'google',
        phoneVerified: false
      });
    } catch (error) {
      // Firebase's auth-state listener and the sign-in button can arrive at
      // the API together. Reuse the account created by the other request.
      if (error?.code !== 11000) throw error;
      user = await User.findOne({ email: trimmedEmail });
    }
  } else {
    user.provider = user.provider || 'google';
    user.isVerified = true;
    user.lastActiveAt = Date.now();
    await user.save({ validateBeforeSave: false });
  }

  console.log(`[AUTH][GOOGLE_LOGIN][SUCCESS] userId=${user._id} email=${trimmedEmail}`);
  return sendTokenResponse(user, 200, res);
});

// @desc    Save/Add mobile number for authenticated user (Google Sign-In profile completion)
// @route   POST /api/v1/auth/save-phone
exports.savePhone = asyncHandler(async (req, res, next) => {
  const phone = normalizeIndianPhone(req.body.phone);
  if (!phone) {
    return next(new AppError('Please enter a valid 10-digit Indian mobile number.', 400, 'VALIDATION_ERROR'));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
  }

  user.phone = phone;
  user.phoneVerified = true;
  await user.save({ validateBeforeSave: false });

  console.log(`[AUTH][SAVE_PHONE][SUCCESS] userId=${user._id} phone=${phone}`);
  res.status(200).json({
    status: 'success',
    message: 'Mobile number added successfully!',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneNumber: user.phone,
      phoneVerified: true,
      isVerified: user.isVerified === true,
      fcmTokens: user.fcmTokens || [],
      notificationEnabled: user.notificationEnabled
    }
  });
});

// @desc    Send OTP for the authenticated customer's phone verification
// @route   POST /api/v1/auth/phone-verification/send-otp
exports.sendPhoneVerificationOtp = asyncHandler(async (req, res, next) => {
  const phone = normalizeIndianPhone(req.body.phone);
  if (!phone) return next(new AppError('Please enter a valid 10-digit Indian mobile number.', 400));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 12);
  await OtpSession.updateMany(
    { email: req.user.email, type: 'phone_verification', isUsed: false },
    { $set: { isUsed: true } }
  );

  const session = await OtpSession.create({
    email: req.user.email,
    phone,
    hashedOtp,
    type: 'phone_verification',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    maxAttempts: 5
  });

  const result = await sendSMS(phone, `The Chocolate Mine: your mobile verification OTP is ${otp}. It expires in 10 minutes.`);
  if (!result.success) {
    await OtpSession.deleteOne({ _id: session._id });
    return next(new AppError('We could not send the OTP. Please try again.', 503));
  }

  res.status(200).json({ status: 'success', message: 'OTP sent to your mobile number.', phoneNumber: phone });
});

// @desc    Verify the authenticated customer's phone OTP
// @route   POST /api/v1/auth/phone-verification/verify-otp
exports.verifyPhoneVerificationOtp = asyncHandler(async (req, res, next) => {
  const otp = String(req.body.otp || '').trim();
  if (!/^\d{6}$/.test(otp)) return next(new AppError('Please enter the 6-digit OTP.', 400));

  const session = await OtpSession.findOne({
    email: req.user.email,
    type: 'phone_verification',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort('-createdAt');

  if (!session) return next(new AppError('OTP expired or not found. Please send a new OTP.', 400));
  if (session.attempts >= session.maxAttempts) return next(new AppError('Too many incorrect attempts. Please send a new OTP.', 400));

  if (!await bcrypt.compare(otp, session.hashedOtp)) {
    session.attempts += 1;
    if (session.attempts >= session.maxAttempts) session.isUsed = true;
    await session.save();
    return next(new AppError(`Invalid OTP. ${session.maxAttempts - session.attempts} attempts remaining.`, 400));
  }

  session.isUsed = true;
  session.verifiedAt = new Date();
  await session.save();

  const user = await User.findById(req.user._id);
  user.phone = session.phone;
  user.phoneVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Mobile number verified successfully.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneNumber: user.phone,
      phoneVerified: true,
      isVerified: user.isVerified === true
    }
  });
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
  const otpSession = await OtpSession.create({
    email: targetEmail,
    hashedOtp,
    type: 'password_reset',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // 3. 💡 OPTIMIZATION: Remove "await" from the email service!
  // This sends the email in the background. Node.js won't block the API response.
  try {
    await emailService.sendPasswordResetOTP(targetEmail, otp);
  } catch (err) {
    await OtpSession.deleteOne({ _id: otpSession._id });
    return next(new AppError('We could not send the password reset email. Please try again.', 503));
  }

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
