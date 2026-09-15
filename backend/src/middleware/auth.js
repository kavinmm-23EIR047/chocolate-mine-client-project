const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Authentication required. Please log in to continue.', 401, 'AUTH_REQUIRED'));
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || !currentUser.active) {
      return next(new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED'));
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 15 // 15 mins
    });

    // Grant access
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED'));
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
    return next(new AppError('Authentication required. Please log in to continue.', 401, 'AUTH_REQUIRED'));
  }

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The account belonging to this session no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    // 3. Check if user is active
    if (!currentUser.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    if (req.cookies && req.cookies.refreshToken) {
      return handleRefreshToken(req, res, next);
    }
    return next(new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED'));
  }
});

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403, 'FORBIDDEN'));
    }
    next();
  };
};
