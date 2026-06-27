import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  CheckCircle2,
  Package,
  Truck,
  Download,
  Phone,
  Receipt,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";

import api from "../../utils/api";
import orderService from "../../services/orderService";
import reviewService from "../../services/reviewService";
import { formatCurrency } from "../../utils/helpers";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import { CardSkeleton } from "../../components/ui/Skeleton";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

const STATUS_ORDER = ["confirmed", "out_for_delivery", "delivered"];

// Status display mapping
const STATUS_MAP = {
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-500/10 border border-blue-200/20" },
  out_for_delivery: { label: "Out for Delivery", color: "text-orange-600 bg-orange-500/10 border border-orange-200/20" },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-500/10 border border-green-200/20" },
  cancelled: { label: "Payment Cancelled", color: "text-red-600 bg-red-500/10 border border-red-200/20" }
};

const getDisplayFlavor = (item) => {
  if (item.isCustomCake) return item.selectedFlavor || 'Custom';
  const flavor = item.selectedFlavor;
  if (!flavor || flavor.toLowerCase() === 'standard') {
    const cat = String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (cat.includes('chocolate') || name.includes('chocolate') || name.includes('forest') || name.includes('fudge') || name.includes('truffle') || name.includes('oreo') || name.includes('caramel')) return 'Chocolate';
    if (cat.includes('vanilla') || name.includes('vanilla') || name.includes('pineapple') || name.includes('butterscotch') || name.includes('strawberry') || name.includes('blueberry') || name.includes('biscoff') || name.includes('jamun') || name.includes('gulkand') || name.includes('rasmalai') || name.includes('honey') || name.includes('almond') || name.includes('lychee') || name.includes('rose')) return 'Vanilla';
    if (cat.includes('red-velvet') || cat.includes('red velvet') || name.includes('red-velvet') || name.includes('red velvet')) return 'Red Velvet';
    if (cat.includes('bento') || name.includes('bento')) return 'Bento';
    return 'Standard';
  }
  return flavor;
};


const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [canReview, setCanReview] = useState(false);
  const [reviewCheckLoading, setReviewCheckLoading] = useState(true);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (!user || !id) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('OrderDetails socket connected');
      socketRef.current.emit('join_order_room', id);
    });

    socketRef.current.on('order_detail_updated', (data) => {
      console.log('Order detail update received:', data);
      fetchOrder(true); // Silent refresh
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // First try to get order directly by ID
      let orderData = null;
      
      try {
        const directRes = await api.get(`/orders/${id}`);
        orderData = directRes.data.data;
      } catch (err) {
        // If direct fetch fails, try from my orders list
        const res = await api.get("/orders/my");
        orderData = res.data.data.find((o) => o._id === id);
      }

      if (orderData) {
        setOrder(orderData);
        
        // Check if order can be reviewed (delivered and not yet reviewed)
        if (orderData.orderStatus === 'delivered') {
          try {
            const checkRes = await reviewService.checkOrderReviewable(id);
            setCanReview(checkRes.data.data.canReview);
          } catch (err) {
            console.error('Failed to check review status:', err);
            setCanReview(false);
          }
        }
        setReviewCheckLoading(false);
      } else if (!silent) {
        toast.error("Order not found");
        navigate("/account/orders");
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      if (!silent) {
        toast.error("Failed to load order");
        navigate("/account/orders");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id, navigate]);

  const toggleItemExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleWriteReview = () => {
    navigate(`/review/${order._id}`);
  };

  /* ----------------------------------------
     BACKEND PDF DOWNLOAD (CORRECT METHOD)
  ---------------------------------------- */
  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const res = await orderService.downloadInvoice(order._id);

      const blob = res.data;

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.invoiceNumber || order.orderNumber || order._id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded");
    } catch (err) {
      console.error("Invoice download failed:", err);
      toast.error("Unable to download invoice");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!order) return null;

  // Calculate current step index for timeline
  const activeStep = STATUS_ORDER.indexOf(order.orderStatus);
  const progressPercent = activeStep >= 0 ? (activeStep / (STATUS_ORDER.length - 1)) * 100 : 0;

  // Format timeline steps with proper dates
  const timelineSteps = [
    {
      id: "confirmed",
      label: "Order Confirmed",
      icon: Receipt,
      description: "Your order has been confirmed and paid for.",
      time: order.createdAt,
      completed: activeStep >= 0,
    },
    {
      id: "out_for_delivery",
      label: "Out For Delivery",
      icon: Truck,
      description: "Your order is on the way to your doorstep.",
      time: order.orderStatus === "out_for_delivery" || order.orderStatus === "delivered" 
        ? (order.otpVerifiedAt || order.updatedAt) 
        : null,
      completed: activeStep >= 1,
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      description: "Your order has been delivered. Enjoy!",
      time: order.orderStatus === "delivered" ? (order.otpVerifiedAt || order.updatedAt) : null,
      completed: activeStep >= 2,
    },
  ];

  return (
    <div className="space-y-8">

      <div className="flex items-center gap-4 border-b border-border/50 pb-6 flex-wrap">
        <button
          onClick={() => navigate("/account/orders")}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-border/20 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-2xl font-black uppercase">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
          {order.trackingCode && (
            <p className="text-[9px] text-muted font-mono mt-0.5">
              Tracking: {order.trackingCode}
            </p>
          )}
        </div>

        <div className="ml-auto flex gap-2 sm:gap-3 items-center">
          {/* Status Badge */}
          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase text-center whitespace-nowrap shrink-0 ${STATUS_MAP[order.orderStatus]?.color || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_MAP[order.orderStatus]?.label || order.orderStatus.replace(/_/g, ' ')}
          </div>

          <Button
            icon={Download}
            onClick={handleDownloadInvoice}
            variant="outline"
          >
            INVOICE
          </Button>

          {/* ✅ Write Review Button - Only show if order is delivered and not yet reviewed */}
          {order.orderStatus === 'delivered' && canReview && !reviewCheckLoading && (
            <Button
              icon={Star}
              onClick={handleWriteReview}
              className="bg-primary hover:bg-primary/90"
            >
              WRITE REVIEW
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">

          {/* Delivery Timeline */}
          <div className="card-premium p-4 sm:p-8 bg-card rounded-[2rem] border border-border overflow-hidden">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-6 sm:mb-10 pl-1 sm:pl-2">
              Delivery Status
            </h3>

            <div className="relative pl-1 sm:pl-2">
              <div className="space-y-0">
                {timelineSteps.map((step, index) => {
                  const isCompleted = step.completed;
                  const isCurrent = index === activeStep;

                  return (
                    <div key={step.id} className="relative flex gap-3 sm:gap-6 mb-6 last:mb-0">
                      <div className="relative flex flex-col items-center z-10 w-8 sm:w-10 shrink-0">
                        {/* Background connecting line */}
                        {index !== timelineSteps.length - 1 && (
                          <div className="absolute top-8 sm:top-10 -bottom-6 left-1/2 -translate-x-1/2 w-[2px] sm:w-[3px] bg-border/30 -z-10" />
                        )}
                        {/* Filled connecting line */}
                        {index !== timelineSteps.length - 1 && activeStep > index && (
                          <div className="absolute top-8 sm:top-10 -bottom-6 left-1/2 -translate-x-1/2 w-[2px] sm:w-[3px] bg-secondary -z-10" />
                        )}

                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-[3px] sm:border-4 border-card shadow-sm transition-all duration-300 ${
                            isCompleted || isCurrent
                              ? "bg-secondary text-white"
                              : "bg-card text-muted border-border"
                          } ${isCurrent ? "ring-4 ring-secondary/20 scale-110" : ""}`}
                        >
                          <step.icon size={14} className="sm:w-4 sm:h-4" />
                        </div>
                      </div>

                      <div className={`flex-1 p-3 sm:p-5 rounded-2xl border transition-all ${
                        isCurrent ? "border-secondary bg-secondary/5" : "border-border"
                      }`}>
                        <div className="flex justify-between items-start flex-wrap gap-1 sm:gap-2">
                          <h4 className={`text-[11px] sm:text-sm font-black uppercase whitespace-nowrap sm:whitespace-normal ${isCurrent ? "text-secondary" : ""}`}>
                            {step.label}
                          </h4>
                          {step.time && (
                            <span className="text-[9px] sm:text-[10px] text-muted">
                              {new Date(step.time).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-2 text-muted">
                          {step.description}
                        </p>
                        {step.id === "confirmed" && order.orderStatus === "cancelled" && (
                          <div className="mt-3 p-3 bg-red-500/10 rounded-xl text-xs text-red-600 border border-red-200/20">
                            ❌ Order Cancelled / Payment Failed.
                          </div>
                        )}
                        {step.id === "out_for_delivery" && order.orderStatus === "out_for_delivery" && (
                          <div className="mt-3 p-3 bg-orange-500/10 rounded-xl text-xs text-orange-600 border border-orange-200/20">
                            📦 Your order is out for delivery! Please keep your phone handy.
                          </div>

                        )}
                        {step.id === "delivered" && order.orderStatus === "delivered" && (
                          <div className="mt-3 p-3 bg-green-500/10 rounded-xl text-xs text-green-600 border border-green-200/20">
                            ✅ Order delivered successfully! Please share your feedback by clicking the "WRITE REVIEW" button above.
                          </div>

                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Items with SKU and Custom Details */}
          <div className="card-premium p-6 bg-card rounded-3xl border border-border">
            <h3 className="font-black uppercase mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="border rounded-xl p-3">
                  <div className="flex gap-4">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold break-words">{item.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted break-all">SKU: {item.sku || 'N/A'}</p>
                        </div>
                        <p className="font-bold shrink-0">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm">Qty: {item.qty}</span>
                        <span className="text-xs text-muted">{formatCurrency(item.price)} each</span>
                      </div>
                      {(item.selectedFlavor || item.selectedWeight || getDisplayFlavor(item) !== 'Standard') && (
                        <div className="text-xs text-muted mt-1">
                          {(item.selectedFlavor || getDisplayFlavor(item) !== 'Standard') && (
                            <span>{item.isCustomCake ? 'Color' : 'Flavor'}: {getDisplayFlavor(item)}</span>
                          )}
                          {item.selectedWeight && <span className="ml-2">Weight: {item.selectedWeight}</span>}
                        </div>
                      )}
                      {item.customDetails && Object.values(item.customDetails).some(val => val) && (
                        <button 
                          onClick={() => toggleItemExpand(idx)}
                          className="text-xs text-secondary flex items-center gap-1 mt-2"
                        >
                          {expandedItems[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Custom Details
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedItems[idx] && item.customDetails && (
                    <div className="mt-3 p-4 bg-card-soft rounded-xl text-xs border border-border/30">
                      {Object.entries(item.customDetails).map(([k, v]) => {
                        if (v === false || v === null || v === undefined || v === '') return null;
                        const label = k === 'flavour' ? 'Color' : k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const displayVal = v === true ? 'Yes' : v;
                        return (
                          <p key={k}><span className="font-medium">{label}:</span> {displayVal}</p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Delivery Info */}
          <div className="card-premium p-6 bg-card rounded-3xl border border-border">
            <h3 className="font-black uppercase mb-4 flex gap-2 items-center">
              <MapPin size={16} />
              Delivery Info
            </h3>

            <div className="p-4 rounded-2xl bg-muted/5 border border-border">
              <p className="font-black">{order.address?.fullName}</p>
              <p className="text-sm">{order.address?.phone}</p>
              <p className="text-sm text-muted mt-2">
                {order.address?.houseNo}, {order.address?.street}
                <br />
                {order.address?.city}, {order.address?.pincode}
              </p>
              {order.deliverySlot && (
                <p className="text-xs text-muted mt-2">
                  Delivery Slot: {order.deliverySlot}
                </p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card-premium p-6 bg-card rounded-3xl border border-border">
            <h3 className="font-black uppercase mb-4 flex gap-2 items-center">
              <CreditCard size={16} />
              Payment Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted">Delivery Charge</span>
                <span>{formatCurrency(order.deliveryCharge)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">GST (18%)</span>
                <span>{formatCurrency(order.gst)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">Convenience Fee</span>
                <span>{formatCurrency(order.convenienceFee)}</span>
              </div>

              <div className="border-t pt-3 mt-2 flex justify-between font-black text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted">
                  Payment Status:{" "}
                  <span className={`font-bold ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {order.paymentStatus?.toUpperCase()}
                  </span>
                </p>
                <p className="text-xs text-muted mt-1">
                  Payment Method: {order.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          {/* Need Help? */}
          <div className="card-premium p-6 bg-card rounded-3xl border border-border">
            <h3 className="font-black uppercase mb-3 flex gap-2 items-center">
              <Phone size={16} />
              Need Help?
            </h3>
            <p className="text-sm text-muted mb-3">
              Have questions about your order? Contact our support team.
            </p>
            <a href={`tel:${order.assignedStaff?.phone || '+918098009228'}`} className="block w-full">
              <Button variant="outline" className="w-full" icon={Phone}>
                {order.assignedStaff ? 'Contact Delivery Partner' : 'Contact Support'}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;