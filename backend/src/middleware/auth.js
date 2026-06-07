const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('You are not logged in. Please login to get access.', 401));
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || !currentUser.active) {
      return next(new AppError('Session expired. Please login again.', 401));
    }

    // Generate new Access Token
    const accessToken = jwt.sign(
      { userId: currentUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set new Access Token HttpOnly cookie
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15 // 15 mins
    });

    // Grant access
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Session expired. Please login again.', 401));
  }
};

// Protect routes - Verify JWT (supports both Bearer token and HttpOnly cookie)
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Fallback to HttpOnly cookie
  if (!token && req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    if (req.cookies && req.cookies.refreshToken) {
      return handleRefreshToken(req, res, next);
    }
    return next(new AppError('You are not logged in. Please login to get access.', 401));
  }

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 3. Check if user is active
    if (!currentUser.active) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    if (req.cookies && req.cookies.refreshToken) {
      return handleRefreshToken(req, res, next);
    }
    return next(new AppError('Invalid token. Please login again.', 401));
  }
});

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
