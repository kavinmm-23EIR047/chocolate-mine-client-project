const express = require('express');
const passport = require('passport');
const Joi = require('joi');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/* ==================================
   VALIDATION SCHEMAS
================================== */

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required.',
    'any.required': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.'
  }),
  phone: Joi.string().trim().min(8).max(20).required().messages({
    'string.empty': 'Phone number is required.',
    'any.required': 'Phone number is required.',
    'string.min': 'Please enter a valid phone number (at least 8 digits).'
  })
}).unknown(true);

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  })
}).unknown(true);

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  })
}).unknown(true);

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  }),
  otp: Joi.string().trim().required().messages({
    'string.empty': 'OTP is required.',
    'any.required': 'OTP is required.'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.'
  })
}).unknown(true);

const verifySignupSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  }),
  otp: Joi.string().trim().required().messages({
    'string.empty': 'OTP is required.',
    'any.required': 'OTP is required.'
  })
}).unknown(true);

const resendSignupOtpSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  })
}).unknown(true);

const checkEmailSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.'
  })
}).unknown(true);

/* ==================================
   AUTH ROUTES
================================== */

// Auth Rate Limiter
const authLimiter = rateLimiter({ 
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many authentication attempts. Please try again later.' 
});

const otpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many OTP requests. Please try again later.'
});

// POST /api/v1/auth/check-email
router.post('/check-email', authLimiter, validate(checkEmailSchema), authController.checkEmail);

// POST /api/v1/auth/send-signup-otp
router.post('/send-signup-otp', otpLimiter, validate(checkEmailSchema), authController.sendSignupOtp);

// POST /api/v1/auth/verify-email-otp
router.post('/verify-email-otp', otpLimiter, validate(verifySignupSchema), authController.verifyEmailOtp);

// POST /api/v1/auth/signup
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/register', authLimiter, validate(signupSchema), authController.signup);

// POST /api/v1/auth/verify-signup
router.post('/verify-signup', otpLimiter, validate(verifySignupSchema), authController.verifySignup);

// POST /api/v1/auth/resend-signup-otp
router.post('/resend-signup-otp', otpLimiter, validate(resendSignupOtpSchema), authController.resendSignupOtp);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/v1/auth/firebase-login
router.post('/firebase-login', authLimiter, authController.firebaseLogin);
router.post('/save-phone', protect, authController.savePhone);
router.post('/phone-verification/send-otp', protect, otpLimiter, authController.sendPhoneVerificationOtp);
router.post('/phone-verification/verify-otp', protect, otpLimiter, authController.verifyPhoneVerificationOtp);

// GET /api/v1/auth/me
router.get('/me', protect, authController.getMe);

/* ==================================
   GOOGLE AUTH
================================== */

// GET /api/v1/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/v1/auth/google/callback
router.get(
  '/google/callback',
  (req, res, next) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    passport.authenticate('google', { 
      failureRedirect: `${frontendUrl}/login?error=GoogleAuthFailed`, 
      session: false 
    })(req, res, next);
  },
  authController.googleSuccess
);

/* ==================================
   PASSWORD RESET
================================== */

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/* ==================================
   LOGOUT
================================== */

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

module.exports = router;
