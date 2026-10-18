const Order = require('../models/Order');

/**
 * Automatically expire orders that have been in 'awaiting_payment' status
 * for more than 30 minutes without successful payment.
 */
const expireAwaitingPaymentOrders = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await Order.updateMany(
      {
        orderStatus: 'awaiting_payment',
        paymentStatus: { $in: ['pending', 'created'] },
        createdAt: { $lt: thirtyMinutesAgo }
      },
      {
        $set: {
          orderStatus: 'failed',
          paymentStatus: 'failed',
          paymentFailureReason: 'Payment window expired (auto-cancelled after 30 minutes)'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[OrderExpiryService] Auto-expired ${result.modifiedCount} order(s) awaiting payment > 30 mins.`);
    }
    return result.modifiedCount || 0;
  } catch (err) {
    console.error('[OrderExpiryService Error]:', err.message);
    return 0;
  }
};

/**
 * Start periodic background check every 2 minutes
 */
const startOrderExpiryJob = () => {
  // Run immediately on boot
  expireAwaitingPaymentOrders();

  // Run every 2 minutes
  const intervalId = setInterval(expireAwaitingPaymentOrders, 2 * 60 * 1000);
  return intervalId;
};

module.exports = {
  expireAwaitingPaymentOrders,
  startOrderExpiryJob
};
