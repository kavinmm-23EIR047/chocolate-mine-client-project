import React, { useState } from 'react';
import { Truck, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    icon: Clock,
    colorClass: 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    colorClass: 'bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-200 hover:bg-blue-500/20'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    colorClass: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/20'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    colorClass: 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200 hover:bg-rose-500/20'
  },
  failed: {
    label: 'Failed',
    icon: AlertTriangle,
    colorClass: 'bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200 hover:bg-red-500/20'
  },
  awaiting_payment: {
    label: 'Awaiting Payment',
    icon: Clock,
    colorClass: 'bg-orange-500/10 border-orange-500/40 text-orange-900 dark:text-orange-200 hover:bg-orange-500/20'
  }
};

/**
 * OrderStatusDropdown
 * Strict Status Flow:
 * - If order is already 'failed' (or payment failed): No updates allowed (static badge).
 * - If order is 'awaiting_payment' (or pending online payment): Can ONLY be moved to 'failed'.
 * - If order is valid/confirmed/active: Allows active delivery pipeline statuses.
 */
const OrderStatusDropdown = ({ order, onUpdate, onRefresh, role = 'admin', className = '' }) => {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const isFailed = order.orderStatus === 'failed' || order.paymentStatus === 'failed';
  const isCancelled = order.orderStatus === 'cancelled';
  const isAwaiting = order.orderStatus === 'awaiting_payment' || (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'pending');

  // 1. If order has failed or cancelled, lock status completely - no dropdown, no updates allowed
  if (isFailed) {
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200 text-[11px] sm:text-xs font-black uppercase tracking-wider select-none shadow-2xs ${className || 'w-full max-w-[210px]'}`}
        title="Failed orders are closed and cannot be updated"
      >
        <AlertTriangle size={14} className="shrink-0 text-red-600 dark:text-red-400" />
        <span>FAILED</span>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200 text-[11px] sm:text-xs font-black uppercase tracking-wider select-none shadow-2xs ${className || 'w-full max-w-[210px]'}`}
        title="Cancelled orders cannot be updated"
      >
        <XCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
        <span>CANCELLED</span>
      </div>
    );
  }

  const currentStatus = order.orderStatus || 'confirmed';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.confirmed;
  const CurrentIcon = config.icon;

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (!newStatus || newStatus === currentStatus) return;

    try {
      setLoading(true);
      await onUpdate(order._id, newStatus);
      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ')}`);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // 2. If awaiting payment: ONLY allow moving to 'failed'
  // 3. Otherwise: Allow normal order flow transitions
  const statusOptions = isAwaiting ? [
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'failed', label: 'Move to Failed' }
  ] : [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className={`relative inline-flex items-center ${className || 'w-full min-w-[140px] max-w-[210px]'}`}
    >
      <div 
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-extrabold transition-all shadow-2xs select-none ${config.colorClass}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {loading ? (
            <Loader2 size={15} className="animate-spin shrink-0" />
          ) : (
            <CurrentIcon size={15} className="shrink-0" />
          )}
          <span className="truncate uppercase tracking-wider text-[11px] sm:text-xs">
            {loading ? 'UPDATING…' : config.label}
          </span>
        </div>
        <ChevronDown size={14} className="shrink-0 opacity-70" />
      </div>

      {/* Accessible native select overlay for robust mobile/tablet/desktop interaction */}
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent disabled:cursor-not-allowed"
        title={isAwaiting ? "Awaiting payment: Can only move to Failed" : "Change Order Status"}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-heading font-medium py-1">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default OrderStatusDropdown;
