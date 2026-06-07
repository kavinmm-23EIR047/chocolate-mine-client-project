const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/* =========================================
   HELPER: UPDATE PRODUCT RATING
========================================= */
const updateProductRatings = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: '$productId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: stats[0].nRating,
      ratingsAverage: Number(stats[0].avgRating.toFixed(1)),
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: 0,
      ratingsAverage: 0,
    });
  }
};

/* =========================================
   CREATE REVIEW
========================================= */
exports.createReview = asyncHandler(async (req, res, next) => {
  const { orderId, productId, rating, comment } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!orderId || !productId || !rating) {
    return next(new AppError('Order, product and rating are required', 400));
  }

  // Check if already reviewed
  const existingReview = await Review.findOne({ orderId, productId, userId });
  if (existingReview) {
    return next(new AppError('You already reviewed this product', 400));
  }

  // Check order ownership and status
  const order = await Order.findOne({ _id: orderId, userId: userId });
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Only delivered orders can be reviewed
  if (order.orderStatus !== 'delivered') {
    return next(new AppError('You can review only delivered orders', 400));
  }

  // Check if product exists in order
  const itemFound = order.items.find(
    (item) => String(item.productId) === String(productId)
  );
  if (!itemFound) {
    return next(new AppError('Product not found in this order', 400));
  }

  // Create review
  const review = await Review.create({
    orderId,
    productId,
    userId,
    rating,
    comment: comment || '',
    userName: req.user.name || 'User',
    userImage: req.user.image || '',
    isApproved: true,
  });

  // Mark order as reviewed
  if (!order.reviewed) {
    order.reviewed = true;
    await order.save();
  }

  // Update product ratings
  await updateProductRatings(productId);

  try {
    const notificationManager = require('../services/notificationManager');
    const product = await Product.findById(productId);
    notificationManager.notifyNewReview(review, req.user, product).catch(console.error);
  } catch (err) {
    console.error('Notification Error:', err);
  }

  res.status(201).json({
    status: 'success',
    message: 'Review submitted successfully',
    data: { review },
  });
});

/* =========================================
   CHECK IF ORDER CAN BE REVIEWED
========================================= */
exports.checkOrderReviewable = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  const order = await Order.findOne({ _id: orderId, userId: userId });
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if order is delivered and not yet reviewed
  const canReview = order.orderStatus === 'delivered' && !order.reviewed;

  // Get reviewable products (items that haven't been reviewed yet)
  const reviewedProducts = await Review.find({ orderId, userId }).distinct('productId');
  const reviewableProducts = order.items.filter(
    (item) => !reviewedProducts.some((rp) => String(rp) === String(item.productId))
  );

  res.status(200).json({
    status: 'success',
    data: {
      canReview,
      reviewed: order.reviewed,
      orderStatus: order.orderStatus,
      reviewableProducts: reviewableProducts.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
      })),
    },
  });
});

/* =========================================
   GET LATEST REVIEWS
========================================= */
exports.getLatestReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ isApproved: true })
    .sort('-createdAt')
    .limit(10)
    .populate('productId', 'name image price');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

/* =========================================
   GET MY REVIEWS
========================================= */
exports.getMyReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ userId: req.user._id })
    .sort('-createdAt')
    .populate('productId', 'name image price');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

/* =========================================
   GET PRODUCT REVIEWS
========================================= */
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({
    productId: req.params.productId,
    isApproved: true,
  }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

/* =========================================
   ADMIN APPROVE REVIEW
========================================= */
exports.approveReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: true },
    { new: true }
  );

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  await updateProductRatings(review.productId);

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

/* =========================================
   ADMIN DELETE REVIEW
========================================= */
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  await updateProductRatings(review.productId);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/* =========================================
   ADMIN GET ALL REVIEWS
========================================= */
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('productId', 'name image price')
    .populate('userId', 'name email phone')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

/* =========================================
   ADMIN UPDATE/TOGGLE REVIEW
========================================= */
exports.updateReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, isApproved } = req.body;
  const updateData = {};
  if (rating !== undefined) updateData.rating = rating;
  if (comment !== undefined) updateData.comment = comment;
  if (isApproved !== undefined) updateData.isApproved = isApproved;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Recalculate ratings
  await updateProductRatings(review.productId);

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});