const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  try {
    const { range } = req.query;
    let startDate = new Date();
    if (range === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (range === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (range === 'all') {
      startDate = new Date(0); // Beginning of time
    } else {
      // default 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    // Match filter for the selected time range
    const timeFilter = { createdAt: { $gte: startDate } };
    const paidTimeFilter = { paymentStatus: 'paid', createdAt: { $gte: startDate } };

    const [
      ordersCount,
      usersCount,
      revenueResults,
      monthlyRevenueResults,
      paymentStats,
      salesChart,
      topProducts,
      categoryStats
    ] = await Promise.all([
      // Basic Counts
      Order.countDocuments(timeFilter),
      User.countDocuments({ role: 'user', ...timeFilter }),
      
      // Total Revenue
      Order.aggregate([
        { $match: paidTimeFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' }
          }
        }
      ]),

      // Monthly Revenue
      Order.aggregate([
        { 
          $match: { 
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: '$total' }
          }
        }
      ]),

      // Payment Stats
      Order.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 }
          }
        }
      ]),

      // Sales Chart
      Order.aggregate([
        { $match: paidTimeFilter },
        {
          $group: {
            _id: { $dateToString: { format: range === 'year' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$total', 0] } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top Selling Products
      Order.aggregate([
        { $match: paidTimeFilter },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            salesCount: { $sum: { $ifNull: ['$items.qty', 0] } },
            revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.qty', 0] }] } }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1,
            category: { $ifNull: ['$productInfo.category', 'unknown'] },
            salesCount: 1,
            revenue: 1
          }
        },
        { $sort: { salesCount: -1 } },
        { $limit: 5 }
      ]),

      // Category Split
      Order.aggregate([
        { $match: paidTimeFilter },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$productInfo.category', 'unassigned'] },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Safely extract values with null checks
    const revInfo = (revenueResults && revenueResults[0]) || { totalRevenue: 0, avgOrderValue: 0 };
    const monthRevInfo = (monthlyRevenueResults && monthlyRevenueResults[0]) || { monthlyRevenue: 0 };
    
    // Map payment stats to required format
    const paymentStatsList = paymentStats || [];
    const payments = {
      successful: paymentStatsList.find(p => p._id === 'paid')?.count || 0,
      pending: paymentStatsList.find(p => p._id === 'pending')?.count || 0,
      failed: paymentStatsList.find(p => p._id === 'failed')?.count || 0,
      refunded: paymentStatsList.find(p => p._id === 'refunded')?.count || 0
    };

    // Format sales chart data
    const salesChartData = (salesChart || []).map(item => ({
      date: item._id,
      revenue: item.revenue || 0,
      orders: item.orders || 0
    }));

    // Calculate category percentages
    const categoryStatsList = categoryStats || [];
    const totalCategorySales = categoryStatsList.reduce((sum, cat) => sum + (cat.count || 0), 0);
    const categorySplit = categoryStatsList.map(cat => ({
      name: cat._id || 'unknown',
      percentage: totalCategorySales > 0 ? Math.round(((cat.count || 0) / totalCategorySales) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage);

    // Ensure topProducts has valid data
    const topProductsList = (topProducts || []).map(product => ({
      name: product.name || 'Unknown Product',
      category: product.category || 'unknown',
      salesCount: product.salesCount || 0,
      revenue: product.revenue || 0
    }));

    res.status(200).json({ 
      status: 'success', 
      data: { 
        revenue: {
          totalRevenue: revInfo.totalRevenue || 0,
          monthlyRevenue: monthRevInfo.monthlyRevenue || 0,
          avgOrderValue: revInfo.avgOrderValue || 0
        },
        payments,
        salesChart: salesChartData,
        ordersCount: ordersCount || 0,
        usersCount: usersCount || 0,
        topProducts: topProductsList,
        categorySplit: categorySplit || []
      } 
    });
  } catch (error) {
    console.error('Analytics Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

exports.getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};
  
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const sales = await Order.find(filter)
    .populate('userId', 'name email phone')
    .sort('-createdAt');

  // Calculate summary statistics
  const summary = {
    totalOrders: sales.length,
    totalRevenue: sales.reduce((sum, order) => sum + (order.total || 0), 0),
    averageOrderValue: sales.length > 0 ? sales.reduce((sum, order) => sum + (order.total || 0), 0) / sales.length : 0,
    paidOrders: sales.filter(order => order.paymentStatus === 'paid').length,
    pendingOrders: sales.filter(order => order.paymentStatus === 'pending').length
  };

  res.status(200).json({
    status: 'success',
    data: sales,
    summary
  });
});

exports.getOrderStatusDistribution = asyncHandler(async (req, res) => {
  const statusStats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const distribution = {
    confirmed: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  };

  statusStats.forEach(stat => {
    if (distribution.hasOwnProperty(stat._id)) {
      distribution[stat._id] = stat.count;
    }
  });

  // Calculate total orders
  const totalOrders = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  res.status(200).json({
    status: 'success',
    data: distribution,
    totalOrders
  });
});

exports.getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const recentOrders = await Order.find()
    .populate('userId', 'name email phone')
    .sort('-createdAt')
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    data: recentOrders,
    count: recentOrders.length
  });
});