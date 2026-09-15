const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.code = err.code || null;
  error.errors = err.errors || null;

  // Mongoose duplicate key (11000)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'unknown field';
    let message = `Duplicate value entered for ${field}. Please use another value.`;
    let code = 'DUPLICATE_KEY';
    if (field === 'email') {
      message = 'An account with this email already exists. Please log in instead.';
      code = 'ACCOUNT_EXISTS';
    }
    error = new AppError(message, 400, code);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors).map((val) => ({
      field: val.path || 'general',
      message: val.message
    }));
    error = new AppError('Validation failed on server.', 400, 'VALIDATION_ERROR', errorDetails);
  }

  // Mongoose Cast Error (Invalid ID)
  if (err.name === 'CastError') {
    const message = `Invalid resource ID provided: ${err.value}`;
    error = new AppError(message, 400, 'INVALID_ID');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid session token. Please log in again.', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
  }

  // Clean, structured logging
  const method = req.method || 'UNKNOWN';
  const url = req.originalUrl || req.url || '';
  const isOperational = error.isOperational || err.isOperational;

  if (isOperational && (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404)) {
    // Log clean operational notice without noisy stack trace
    console.log(`[API][${error.status?.toUpperCase() || 'FAIL'}] ${method} ${url} | Status: ${error.statusCode} | ${error.code ? '[' + error.code + '] ' : ''}${error.message}`);
  } else {
    // True server or unknown errors - log full trace
    console.error(`❌ [SERVER ERROR] ${method} ${url}:`, err);
  }

  // Ensure CORS headers are present even on errors
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    code: error.code || (error.statusCode === 400 ? 'BAD_REQUEST' : error.statusCode === 401 ? 'UNAUTHORIZED' : error.statusCode === 403 ? 'FORBIDDEN' : error.statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
    message: error.message || 'Something went wrong',
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};
