import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Eye, ChefHat, Filter, Download, RefreshCw, Info, Package, ChevronDown, ChevronUp,
  X, Volume2, VolumeX, Search, MapPin, Truck, CheckCircle2, Phone, Receipt, Navigation, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/helpers';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { TableSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import useNotificationSound from '../../hooks/useNotificationSound';
import { isWithinServiceHours, getServiceHoursMessage } from '../../utils/serviceHours';
import { joinAdminRoom } from '../../sockets/socketManager';
import OrderStatusDropdown from '../../components/orders/OrderStatusDropdown';

const STATUS_ORDER = ["confirmed", "out_for_delivery", "delivered"];

/* ─────────────────────────────────────────────────────────────
   CLEAN FULL-PAGE ORDER DETAILS VIEW (UPDATED FONT SIZES)
───────────────────────────────────────────────────────────── */
const AdminOrderDetailsView = ({ orderId, onBack }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrder(orderId);
      setOrder(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load order:', err);
      toast.error('Failed to load order details');
      if (onBack) onBack();
      else navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate, onBack]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  const toggleItemExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getDisplayFlavor = (item) => {
    if (item.selectedFlavor && item.selectedFlavor !== 'Standard') return item.selectedFlavor;
    if (item.customDetails?.flavour) return item.customDetails.flavour;
    return 'Standard';
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const res = await adminService.downloadInvoice(order._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order.orderNumber || order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download invoice');
    }
  };

  const handleDeliveryStatusUpdate = async (id, status) => {
    try {
      await adminService.updateOrderStatus(id, status);
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      await fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" icon={ArrowLeft} onClick={onBack || (() => navigate('/admin/orders'))}>
            Back to Orders
          </Button>
          <span className="text-xl font-bold text-heading">Loading Order Details...</span>
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-xl font-bold text-heading">Order not found</p>
        <Button icon={ArrowLeft} onClick={onBack || (() => navigate('/admin/orders'))}>
          Back to Orders List
        </Button>
      </div>
    );
  }

  const activeStep = STATUS_ORDER.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  const timelineSteps = [
    {
      id: "confirmed",
      label: "Order Confirmed",
      icon: Receipt,
      description: "Order has been confirmed and registered in backend.",
      time: order.createdAt,
      completed: activeStep >= 0,
    },
    {
      id: "out_for_delivery",
      label: "Out For Delivery",
      icon: Truck,
      description: "Order is dispatched and on the way to customer.",
      time: order.orderStatus === "out_for_delivery" || order.orderStatus === "delivered" ? order.updatedAt : null,
      completed: activeStep >= 1,
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      description: "Order has been delivered to customer.",
      time: order.orderStatus === "delivered" ? order.updatedAt : null,
      completed: activeStep >= 2,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center gap-4 border-b border-border/60 pb-6 flex-wrap">
        <button
          onClick={onBack || (() => navigate('/admin/orders'))}
          className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-border/20 transition-colors shadow-xs cursor-pointer"
          title="Back to Orders List"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black uppercase text-heading">
              Order #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
          {order.trackingCode && order.trackingCode !== order.orderNumber && (
            <p className="text-xs text-muted font-mono mt-0.5">
              Tracking Code: {order.trackingCode}
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="min-w-[190px]">
            <OrderStatusDropdown
              order={order}
              onUpdate={handleDeliveryStatusUpdate}
              onRefresh={fetchOrder}
              role="admin"
            />
          </div>
          <Button icon={RefreshCw} variant="outline" onClick={fetchOrder}>
            Refresh
          </Button>
          <Button icon={ChefHat} variant="outline" onClick={() => adminService.printKOT(order._id)}>
            KOT TICKET
          </Button>
          <Button icon={Download} onClick={handleDownloadInvoice} variant="primary">
            INVOICE
          </Button>
        </div>
      </div>

      {/* Main Full-Page Grid */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left Column: Timeline & Items */}
        <div className="lg:col-span-2 space-y-8">

          {/* Delivery Timeline */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-soft">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-heading flex items-center gap-2.5">
                <Truck size={22} className="text-primary" /> Delivery Status Timeline
              </h3>
              <div className="flex items-center gap-3">
                <Badge variant={order.orderStatus === 'delivered' ? 'success' : isCancelled ? 'error' : 'warning'}>
                  {order.orderStatus?.replace(/_/g, ' ')?.toUpperCase()}
                </Badge>
                <OrderStatusDropdown
                  order={order}
                  onUpdate={handleDeliveryStatusUpdate}
                  onRefresh={fetchOrder}
                  role="admin"
                />
              </div>
            </div>

            <div className="relative pl-2 sm:pl-4">
              <div className="space-y-0">
                {timelineSteps.map((step, index) => {
                  const isCompleted = step.completed;
                  const isCurrent = index === activeStep && !isCancelled;

                  return (
                    <div key={step.id} className="relative flex gap-4 sm:gap-6 mb-8 last:mb-0">
                      <div className="relative flex flex-col items-center z-10 w-9 sm:w-11 shrink-0">
                        {index !== timelineSteps.length - 1 && (
                          <div className={`absolute top-9 sm:top-11 -bottom-8 left-1/2 -translate-x-1/2 w-[3px] ${activeStep > index ? 'bg-primary' : 'bg-border/40'}`} />
                        )}

                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-4 border-card shadow-sm transition-all duration-300 ${isCompleted
                            ? "bg-primary text-white"
                            : "bg-card text-muted border-border"
                          } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}>
                          <step.icon size={18} />
                        </div>
                      </div>

                      <div className={`flex-1 p-5 rounded-2xl border transition-all ${isCurrent ? "border-primary bg-primary/5" : "border-border/60"
                        }`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <h4 className={`text-sm sm:text-base font-black uppercase ${isCurrent ? "text-primary" : "text-heading"}`}>
                            {step.label}
                          </h4>
                          {step.time && (
                            <span className="text-xs sm:text-sm text-muted font-medium">
                              {new Date(step.time).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm mt-2 text-muted leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier driver info if assigned */}
            {order.assignedStaff && (
              <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between bg-card-soft/40 p-4 rounded-2xl border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center text-base">
                    🚚
                  </div>
                  <div>
                    <p className="font-bold text-base text-heading">{order.assignedStaff.name || 'Assigned Driver'}</p>
                    <p className="text-sm text-muted">{order.assignedStaff.phone || 'Delivery Courier Partner'}</p>
                  </div>
                </div>
                {order.assignedStaff.phone && (
                  <a href={`tel:${order.assignedStaff.phone}`} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                    <Phone size={16} /> Call Driver
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-soft">
            <h3 className="font-black uppercase tracking-wider text-base sm:text-lg mb-5 text-heading flex items-center gap-2.5">
              <Package size={22} className="text-muted" /> Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="border border-border/60 rounded-2xl p-5 bg-card-soft/20">
                  <div className="flex gap-4">
                    {item.image && (
                      <img src={getOptimizedCloudinaryUrl(item.image, 200)} alt={item.name} className="w-24 h-24 rounded-xl object-cover border border-border/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-heading text-lg break-words">{item.name}</p>
                          <p className="text-xs sm:text-sm text-muted font-mono break-all mt-1">SKU: {item.sku || 'N/A'}</p>
                        </div>
                        <p className="font-black text-heading text-lg sm:text-xl shrink-0">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                      <div className="flex justify-between text-sm text-muted mt-3">
                        <span>Quantity: <strong className="text-heading font-bold">{item.qty}</strong></span>
                        <span>{formatCurrency(item.price)} each</span>
                      </div>
                      {(item.selectedFlavor || item.selectedWeight || item.cakeMessage || item.messageOnCake || getDisplayFlavor(item) !== 'Standard') && (
                        <div className="text-sm text-muted mt-2">
                          {(item.selectedFlavor || getDisplayFlavor(item) !== 'Standard') && (
                            <span>{item.isCustomCake ? 'Color' : 'Flavor'}: <strong className="text-heading">{getDisplayFlavor(item)}</strong></span>
                          )}
                          {item.selectedWeight && <span className="ml-4">Weight: <strong className="text-heading">{item.selectedWeight}</strong></span>}
                          {(item.cakeMessage || item.messageOnCake) && (
                            <div className="mt-1.5 font-bold text-base text-heading">🎂 Message on Cake: "{item.cakeMessage || item.messageOnCake}"</div>
                          )}
                        </div>
                      )}
                      {item.customDetails && Object.keys(item.customDetails).length > 0 && (
                        <button
                          onClick={() => toggleItemExpand(idx)}
                          className="text-sm text-secondary flex items-center gap-1.5 mt-3 font-bold cursor-pointer"
                        >
                          {expandedItems[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          Custom Cake Details
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedItems[idx] && item.customDetails && (
                    <div className="mt-4 p-4 bg-card-soft border border-border/40 rounded-xl text-sm space-y-2.5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {item.customDetails.flavour && <p><span className="font-bold text-heading">Color:</span> {item.customDetails.flavour}</p>}
                        {item.customDetails.tiers && <p><span className="font-bold text-heading">Tiers:</span> {item.customDetails.tiers}</p>}
                        {item.customDetails.weight && <p><span className="font-bold text-heading">Weight:</span> {item.customDetails.weight}</p>}
                        {item.customDetails.eggless && <p><span className="font-bold text-heading">Eggless:</span> Yes</p>}
                        {item.customDetails.lessSugar && <p><span className="font-bold text-heading">Less Sugar:</span> Yes</p>}
                      </div>
                      {(item.customDetails.photoReferenceUrl || item.customDetails.photoUrl || item.customDetails.photo || item.options?.photoUrl) && (
                        <div className="pt-3 border-t border-border/30 flex items-center gap-3">
                          <span className="font-bold text-heading">🖼️ Photo to Print:</span>
                          <a
                            href={item.customDetails.photoReferenceUrl || item.customDetails.photoUrl || item.customDetails.photo || item.options?.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 font-bold text-primary hover:underline bg-card px-3 py-1.5 rounded-lg border border-border"
                          >
                            <img
                              src={item.customDetails.photoReferenceUrl || item.customDetails.photoUrl || item.customDetails.photo || item.options?.photoUrl}
                              alt="Cake Photo"
                              className="w-10 h-10 rounded object-cover border border-border"
                            />
                            <span>View Full Photo ↗</span>
                          </a>
                        </div>
                      )}
                      {item.customDetails.messageOnCake && <p><span className="font-bold text-heading">Message on Cake:</span> "{item.customDetails.messageOnCake}"</p>}
                      {item.customDetails.notes && <p><span className="font-bold text-heading">Notes:</span> {item.customDetails.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Payment Summary */}
        <div className="space-y-8">

          {/* Shipping / Customer Info */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-soft">
            <h3 className="font-black uppercase tracking-wider text-base sm:text-lg mb-4 text-heading flex items-center gap-2.5">
              <MapPin size={22} className="text-muted" /> Customer & Shipping Info
            </h3>

            <div className="p-5 rounded-2xl bg-card-soft/40 border border-border/40 space-y-3 text-base">
              <p className="font-black text-heading text-lg">{order.address?.fullName}</p>
              <p className="text-muted font-bold text-base">{order.address?.phone}</p>
              <p className="text-muted text-sm sm:text-base leading-relaxed">
                {[order.address?.houseNo, order.address?.street].filter(Boolean).join(', ')}
                {order.address?.landmark && <><br /><strong className="text-heading">Landmark:</strong> {order.address.landmark}</>}
                <br />
                <span className="font-black text-heading">Pincode: {order.address?.pincode || '641001'}</span>
              </p>

              {order.address?.lat && order.address?.lng && (
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.address.lat},${order.address.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-colors"
                  >
                    📍 Directions in Google Maps ↗
                  </a>
                </div>
              )}

              {order.deliveryDate && (
                <p className="text-sm text-primary font-bold pt-3 border-t border-border/30">
                  📅 Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              )}
              {order.deliverySlot && (
                <p className="text-sm text-muted font-semibold">⏰ Delivery Slot: {order.deliverySlot}</p>
              )}
              {order.cakeMessage && (
                <div className="mt-3 p-3 bg-muted/5 border border-border rounded-xl text-base text-heading">
                  <span className="font-bold">🎂 Message on Cake:</span> "{order.cakeMessage}"
                </div>
              )}
              {order.notes && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
                  <span className="font-bold text-blue-600 dark:text-blue-400">📝 Notes:</span> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-soft">
            <h3 className="font-black uppercase tracking-wider text-base sm:text-lg mb-5 text-heading">
              Payment Summary
            </h3>

            <div className="space-y-3.5 text-base">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-heading">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-success-text">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted">Delivery Charge</span>
                <span className="font-semibold text-heading">{formatCurrency(order.deliveryCharge)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">Convenience Fee (2.5%)</span>
                <span className="font-semibold text-heading">{formatCurrency(order.convenienceFee)}</span>
              </div>

              <div className="flex justify-between text-sm text-muted">
                <span>GST (5%)</span>
                <span className="font-semibold text-success-text">Inclusive on product price</span>
              </div>

              <div className="border-t border-border/40 pt-4 mt-3 flex justify-between font-black text-xl text-heading">
                <span>Total Amount</span>
                <span className="text-primary text-2xl">{formatCurrency(order.total)}</span>
              </div>

              <div className="pt-3 border-t border-border/30 flex justify-between items-center text-sm">
                <span className="text-muted font-semibold">Payment Status</span>
                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {order.paymentStatus?.toUpperCase()}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-semibold">Payment Method</span>
                <span className="font-bold text-heading">{order.paymentMethod || 'ONLINE'}</span>
              </div>

              {order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'paid' && (
                <div className="mt-4 p-4 bg-red-600 text-white rounded-2xl shadow-md">
                  <p className="text-sm font-black uppercase tracking-wider mb-1 flex items-center gap-2">
                    <X size={16} /> Payment Issue ({order.paymentStatus})
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-white/95 leading-relaxed">
                    {order.paymentFailureReason || 'Customer initiated the payment but did not complete the transaction successfully.'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN ADMIN ORDERS PAGE
───────────────────────────────────────────────────────────── */
const AdminOrders = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceHoursInfo, setServiceHoursInfo] = useState(null);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  const socketRef = useRef(null);
  const { playSound, toggleMute, testSounds } = useNotificationSound();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrders();
      const rawOrders = res.data?.data?.orders || res.data?.data || (Array.isArray(res.data) ? res.data : []);

      let filtered = rawOrders;
      if (statusFilter === 'success') {
        filtered = rawOrders.filter(o => 
          o.paymentStatus === 'paid' || 
          (['confirmed', 'out_for_delivery', 'delivered'].includes(o.orderStatus) && o.paymentStatus !== 'failed')
        );
      } else if (statusFilter === 'failed') {
        filtered = rawOrders.filter(o => 
          o.paymentStatus === 'failed' || 
          o.orderStatus === 'cancelled' || 
          o.orderStatus === 'failed'
        );
      } else if (statusFilter) {
        filtered = rawOrders.filter(o => o.orderStatus === statusFilter);
      }

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        filtered = filtered.filter(o => {
          const numMatch = o.orderNumber?.toString().toLowerCase().includes(q);
          const trackMatch = o.trackingCode?.toString().toLowerCase().includes(q);
          const nameMatch = o.address?.fullName?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q) || o.userId?.name?.toLowerCase().includes(q);
          const phoneMatch = o.address?.phone?.toLowerCase().includes(q) || o.user?.phone?.toLowerCase().includes(q) || o.userId?.phone?.toLowerCase().includes(q);
          const emailMatch = o.user?.email?.toLowerCase().includes(q) || o.userId?.email?.toLowerCase().includes(q);
          return numMatch || trackMatch || nameMatch || phoneMatch || emailMatch;
        });
      }

      setOrders(filtered);
      setTotalPages(Math.ceil(filtered.length / 10) || 1);
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, orderSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const hoursInfo = isWithinServiceHours();
    setServiceHoursInfo(hoursInfo);

    joinAdminRoom();

    const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    const socketUrl = rawUrl.replace(/\/api\/v\d+.*$/, '');

    socketRef.current = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_admin_room');
      socketRef.current.emit('join_admin');
    });

    const handleNewOrder = (data) => {
      if (!notificationsMuted) {
        playSound('new_order');
      }
      toast.success(`🎉 New Order Received! #${data.orderNumber || data.orderId}`);
      fetchOrders();
    };

    socketRef.current.on('new_order_confirmed', handleNewOrder);
    socketRef.current.on('new_order_alert', handleNewOrder);
    socketRef.current.on('order_status_updated', () => fetchOrders());
    socketRef.current.on('dashboard_needs_refresh', () => fetchOrders());

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [notificationsMuted, fetchOrders, playSound]);

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'success', label: 'Success Orders' },
    { value: 'failed', label: 'Failed / Cancelled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleDeliveryStatusUpdate = async (id, status) => {
    try {
      await adminService.updateOrderStatus(id, status);
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getOrderDisplayId = (order) => {
    if (order.orderNumber) return order.orderNumber;
    if (order.trackingCode) return order.trackingCode;
    return order._id.slice(-8).toUpperCase();
  };

  if (id) {
    return (
      <AdminOrderDetailsView orderId={id} onBack={() => navigate('/admin/orders')} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-heading">Orders</h2>
          <p className="text-base text-muted font-medium mt-1">View and manage customer orders and delivery status</p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={fetchOrders}>Refresh</Button>
      </div>

      {/* Search & Filters Section - Clean Responsive Mobile & Desktop */}
      <div className="space-y-3">
        {/* Row 1: Full-Width Search Input */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search orders by customer name, phone, order #..."
            value={orderSearch}
            onChange={(e) => { setOrderSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-9 py-3 bg-card border border-border rounded-2xl text-heading text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted/70 shadow-2xs"
          />
          {orderSearch && (
            <button onClick={() => setOrderSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-heading cursor-pointer p-1">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Row 2: Smooth Horizontal Scroll Tabs for Quick Filters */}
        <div className="w-full overflow-x-auto pb-1 pt-0.5 flex items-center gap-2 select-none touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { key: '', label: 'All Orders' },
            { key: 'success', label: 'Success Orders' },
            { key: 'failed', label: 'Failed / Cancelled' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'out_for_delivery', label: 'Out for Delivery' },
            { key: 'delivered', label: 'Delivered' }
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-button-text shadow-sm ring-2 ring-primary/40'
                    : 'bg-card border border-border text-heading/80 hover:bg-border/20 shadow-2xs'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Status Select Dropdown & Service / Sound Notification Controls */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          {/* Detailed Status Filter Dropdown */}
          <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl shadow-2xs flex-1 min-w-[150px] max-w-full sm:max-w-xs">
            <Filter size={15} className="text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-bold text-heading outline-none cursor-pointer w-full"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-card text-heading py-1">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service Hours & Sound Notification Bar */}
          <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-xl shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card-soft/60">
              <span className={`w-2 h-2 rounded-full ${serviceHoursInfo?.isWithinHours ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] sm:text-xs font-bold text-muted">
                {serviceHoursInfo?.isWithinHours ? 'Service Active' : 'Service Closed'}
              </span>
            </div>

            <button
              onClick={() => {
                const newMuted = toggleMute();
                setNotificationsMuted(newMuted);
                toast.success(newMuted ? '🔇 Notifications Muted' : '🔊 Notifications Enabled', { duration: 2 });
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all ${notificationsMuted
                ? 'bg-amber-700 text-white'
                : 'bg-emerald-700 text-white'
                }`}
              title={notificationsMuted ? 'Notifications Muted' : 'Notifications Enabled'}
            >
              {notificationsMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={() => {
                testSounds();
                toast.success('Testing notification sound...', { duration: 2 });
              }}
              className="px-2.5 py-1.5 text-xs font-black rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              title="Test sound notification"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          message="When customers place orders, they'll appear here."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-2xl shadow-soft">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1260px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-border/20">
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Order ID</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Items</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Payment</th>
                    <th className="text-left px-5 py-4 text-xs font-black text-muted uppercase tracking-wider">Status / Action</th>
                    <th className="text-right px-6 py-4 text-xs font-black text-muted uppercase tracking-wider min-w-[220px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice((page - 1) * 10, page * 10).map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="hover:bg-border/10 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-black text-heading text-base">
                        #{getOrderDisplayId(order)}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-heading text-base">{order.address?.fullName || order.user?.name || 'Guest'}</p>
                          <p className="text-sm text-muted font-medium mt-0.5">{order.address?.phone || order.user?.email}</p>
                          {order.deliveryDate && (
                            <p className="text-xs text-primary font-bold mt-1">
                              Deliver: {new Date(order.deliveryDate).toLocaleDateString()}
                            </p>
                          )}
                          {order.deliverySlot && (
                            <p className="text-xs text-muted mt-0.5">Slot: {order.deliverySlot}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-base font-bold text-heading">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Package size={16} className="text-muted" />
                          <span className="text-base font-bold text-heading">{order.items?.length || 0}</span>
                          <span className="text-xs text-muted">items</span>
                        </div>
                        {order.items?.[0] && (
                          <div className="mt-1">
                            <p className="text-xs text-heading/90 font-medium truncate max-w-[180px]">
                              {order.items[0].name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                            </p>
                            {order.items[0].sku && (
                              <p className="text-xs text-muted font-mono mt-0.5">SKU: {order.items[0].sku}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-primary text-lg">{formatCurrency(order.total || 0)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {order.paymentStatus?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <OrderStatusDropdown
                          order={order}
                          onUpdate={handleDeliveryStatusUpdate}
                          onRefresh={fetchOrders}
                          role="admin"
                        />
                      </td>
                      <td className="px-6 py-4 text-right min-w-[220px]">
                        <div className="flex items-center justify-end gap-2 shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => adminService.printKOT(order._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer shrink-0"
                            title="Print Kitchen Order Ticket (KOT)"
                          >
                            <ChefHat size={14} />
                            <span>KOT</span>
                          </button>
                          <button
                            onClick={() => navigate(`/admin/orders/${order._id}`)}
                            className="p-2 bg-heading text-background hover:opacity-90 rounded-xl transition-all shrink-0 shadow-xs cursor-pointer flex items-center justify-center w-8 h-8"
                            title="View Full Order Details"
                          >
                            <Eye size={16} />
                          </button>

                          {order.orderStatus === 'delivered' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await adminService.downloadInvoice(order._id);
                                  const url = window.URL.createObjectURL(new Blob([res.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `Invoice-${getOrderDisplayId(order)}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  window.URL.revokeObjectURL(url);
                                  toast.success('Invoice downloaded');
                                } catch (err) {
                                  console.error('Download failed:', err);
                                  toast.error('Failed to download invoice');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer shrink-0"
                              title="Download Invoice"
                            >
                              <Download size={14} />
                              <span>Invoice</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Accordion List - Crystal Clear Responsive Design */}
          <div className="md:hidden space-y-3.5">
            {orders.slice((page - 1) * 10, page * 10).map((order) => (
              <div
                key={`mobile-${order._id}`}
                onClick={() => navigate(`/admin/orders/${order._id}`)}
                className="bg-card border border-border rounded-2xl overflow-hidden p-4 sm:p-5 space-y-3 cursor-pointer hover:border-primary/50 transition-all shadow-soft"
              >
                {/* Header: Order ID & Date/Time & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-black text-heading text-lg">#{getOrderDisplayId(order)}</span>
                    <p className="text-[11px] text-muted font-medium mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>

                {/* Customer Details */}
                <div className="bg-card-soft/40 border border-border/40 rounded-xl p-3 space-y-1">
                  <p className="font-bold text-heading text-sm sm:text-base">{order.address?.fullName || order.user?.name || 'Guest Customer'}</p>
                  {order.address?.phone && (
                    <a
                      href={`tel:${order.address.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                    >
                      <Phone size={13} /> {order.address.phone}
                    </a>
                  )}
                  {order.deliveryDate && (
                    <p className="text-xs text-primary font-bold mt-1">
                      Deliver: {new Date(order.deliveryDate).toLocaleDateString()} {order.deliverySlot ? `(${order.deliverySlot})` : ''}
                    </p>
                  )}
                </div>

                {/* Items & Payment Info */}
                <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                  <div className="flex items-center gap-1.5 text-muted truncate max-w-[65%]">
                    <Package size={14} className="text-muted shrink-0" />
                    <span className="font-bold text-heading">{order.items?.length || 0} items</span>
                    {order.items?.[0] && (
                      <span className="truncate text-muted">({order.items[0].name})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'error' : 'warning'}>
                      {order.paymentStatus?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Amount</span>
                  <span className="font-black text-primary text-lg">{formatCurrency(order.total || 0)}</span>
                </div>

                {/* Order Status Action Dropdown */}
                <div className="pt-2 border-t border-border/40 space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-muted">
                    <span>Update Status</span>
                    <span className="text-[10px] text-muted/80 font-normal">Tap to modify</span>
                  </div>
                  <OrderStatusDropdown
                    order={order}
                    className="w-full"
                    onUpdate={handleDeliveryStatusUpdate}
                    onRefresh={fetchOrders}
                    role="admin"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => adminService.printKOT(order._id)}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    title="Print Kitchen Order Ticket (KOT)"
                  >
                    <ChefHat size={14} /> Print KOT
                  </button>

                  {order.orderStatus === 'delivered' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await adminService.downloadInvoice(order._id);
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Invoice-${getOrderDisplayId(order)}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                          toast.success('Invoice downloaded');
                        } catch (err) {
                          console.error('Download failed:', err);
                          toast.error('Failed to download invoice');
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      title="Download Invoice"
                    >
                      <Download size={14} /> Invoice
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="flex-1 py-2 px-3 bg-heading text-background rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye size={14} /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        
        </>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AdminOrders;