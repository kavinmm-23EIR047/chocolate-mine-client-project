const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('dotenv').config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');
const mongoose = require('mongoose');
const excelService = require('./src/services/excelService');

const app = express();

/* ==================================
   DATABASE CONNECT
================================== */
connectDB();

mongoose.connection.once('open', async () => {
  console.log('MongoDB connected');
  await excelService.initializeExcel();
  console.log('✅ Excel sync ready - hooks active');
});

/* ==================================
   TRUST PROXY
================================== */
app.set('trust proxy', 1);

/* ==================================
   SECURITY HEADERS
================================== */
/* ==================================
   CORS CONFIG (Express 5 Safe)
================================== */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://chocolate-mine-client-project.vercel.app',
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .map(origin => origin.replace(/\/$/, '')); // Remove trailing slashes

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

/* ==================================
   SECURITY HEADERS
================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);


/* ==================================
   BODY PARSER
================================== */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ==================================
   COOKIE PARSER
================================== */
app.use(cookieParser());

/* ==================================
   RATE LIMIT
================================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 200,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

app.use('/api/', limiter);

/* ==================================
   LOGGING
================================== */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ==================================
   PASSPORT
================================== */
app.use(passport.initialize());
require('./src/config/passport')(passport);

/* ==================================
   HEALTH CHECK
================================== */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server Running',
    env: process.env.NODE_ENV || 'development'
  });
});

/* ==================================
   API ROUTES (ORDER MATTERS - specific before general)
================================== */

// Public routes first
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/products', require('./src/routes/productRoutes'));
app.use('/api/v1/categories', require('./src/routes/categoryRoutes'));
app.use('/api/v1/occasions', require('./src/routes/occasionRoutes'));
app.use('/api/v1/banners', require('./src/routes/bannerRoutes'));
app.use('/api/v1/custom-cakes/flavours', require('./src/routes/customCakeFlavorRoutes'));
app.use('/api/v1/custom-cakes', require('./src/routes/customCakeRoutes'));

// Protected routes
app.use('/api/v1/cart', require('./src/routes/cartRoutes'));
app.use('/api/v1/orders', require('./src/routes/orderRoutes'));
app.use('/api/v1/payment', require('./src/routes/paymentRoutes'));
app.use('/api/v1/coupon', require('./src/routes/couponRoutes'));
app.use('/api/v1/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/v1/users', require('./src/routes/userRoutes'));
app.use('/api/v1/notifications', require('./src/routes/notificationRoutes'));

// Admin routes
app.use('/api/v1/admin', require('./src/routes/adminRoutes'));
app.use('/api/v1/staff', require('./src/routes/staffRoutes'));
app.use('/api/v1/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/v1/export', require('./src/routes/exportRoutes'));
app.use('/api/v1/google-reviews', require('./src/routes/googleReviewsRoutes'));

/* ==================================
   404 ROUTE HANDLER
================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

/* ==================================
   GLOBAL ERROR HANDLER
================================== */
app.use(errorHandler);

/* ==================================
   CREATE HTTP SERVER & SOCKET.IO
================================== */
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io instance available to routes via app.set
app.set('io', io);

// Import socket handler and controllers that need io
const socketHandler = require('./src/sockets');
const staffController = require('./src/controllers/staffController');
const orderController = require('./src/controllers/orderController');
const paymentController = require('./src/controllers/paymentController');

// Pass io instance to controllers
staffController.setIo(io);
if (orderController.setIo) {
  orderController.setIo(io);
}
if (paymentController.setIo) {
  paymentController.setIo(io);
}

// Initialize socket handler
socketHandler(io);

console.log('✅ Socket.io initialized and passed to controllers');

/* ==================================
   SOCKET.IO CONNECTION LOGGING
================================== */
io.on('connection', (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

/* ==================================
   START SERVER
================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
  logger.info(`WebSocket ready for real-time updates`);
  
  // Initialize scheduled jobs for Google Reviews
  require('./src/jobs/googleReviewsSyncJob').initScheduledJobs();
});

/* ==================================
   HANDLE ERRORS
================================== */
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;