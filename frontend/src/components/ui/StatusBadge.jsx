import React from 'react';

// Order Statuses - Updated for delivery workflow (3 statuses only)
export const ORDER_STATUSES = {
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700',
    dot: 'bg-green-500'
  },
  cancelled: {
    label: 'Payment Cancelled',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500'
  }
};

// Payment Statuses
export const PAYMENT_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700'
  },
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-700'
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700'
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-700'
  }
};

// Kitchen Statuses (Legacy - kept for compatibility)
export const KITCHEN_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700'
  },
  preparing: {
    label: 'Preparing',
    color: 'bg-blue-100 text-blue-700'
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-700'
  }
};

export const OrderStatusBadge = ({ status }) => {
  const config = ORDER_STATUSES[status] || ORDER_STATUSES.confirmed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PaymentStatusBadge = ({ status }) => {
  const config = PAYMENT_STATUSES[status] || PAYMENT_STATUSES.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

export const KitchenStatusBadge = ({ status }) => {
  const config = KITCHEN_STATUSES[status] || KITCHEN_STATUSES.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};