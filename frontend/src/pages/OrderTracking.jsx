import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  MapPin, Package, Truck, CheckCircle2, Clock,
  Phone, ArrowLeft, RefreshCw, X, User, Navigation
} from 'lucide-react';

import api from '../utils/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/helpers';
import 'leaflet/dist/leaflet.css';

// --- Configuration & Global Constants ---
const DEFAULT_SHOP_LAT = parseFloat(import.meta.env.VITE_SHOP_LAT) || 11.0045;
const DEFAULT_SHOP_LNG = parseFloat(import.meta.env.VITE_SHOP_LNG) || 76.9751;
const SHOP_POS = [DEFAULT_SHOP_LAT, DEFAULT_SHOP_LNG];

// Maps backend string tokens directly to the 3-step visual timeline indices
const STATUS_MAP = {
  'confirmed': 1,
  'out_for_delivery': 2,
  'out-for-delivery': 2,
  'delivered': 3,
  'cancelled': 0   // 0 means cancelled state
};

const STATUS_INFO = {
  1: { label: 'Confirmed', color: 'info', message: 'Your order has been confirmed and is ready for delivery' },
  2: { label: 'Out for Delivery', color: 'warning', message: 'Your order is on the way to your doorstep' },
  3: { label: 'Delivered', color: 'success', message: 'Your order has been delivered. Enjoy!' },
  0: { label: 'Cancelled', color: 'error', message: 'This order has been cancelled.' }
};

// --- Custom Leaflet Marker Creators with theme-aware styling ---
const createCustomIcon = (emoji, bgClass, textColor = 'text-white', animationClass = '') => L.divIcon({
  html: `<div class="w-10 h-10 ${bgClass} rounded-full flex items-center justify-center border-4 border-white shadow-xl ${textColor} text-xl ${animationClass}">
           ${emoji}
         </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Use CSS variables for dynamic theming – actual colors come from Tailwind classes
const icons = {
  bakery: createCustomIcon('🧁', 'bg-primary', 'text-white'),
  rider: createCustomIcon('🛵', 'bg-secondary', 'text-white', 'animate-gentle-bounce'),
  user: createCustomIcon('📍', 'bg-success', 'text-white')
};

// --- Pure Utility Math Functions ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Map Sub-Component to center/fit boundaries dynamically
const ChangeView = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
};

// --- Motion Variants ---
const pageLayoutVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const cardMotionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const trackingCode = orderId || searchParams.get('id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(true);
  const prevStatusRef = useRef(null);

  // --- Real-Time Data Fetch Handler ---
  const fetchTracking = useCallback(async (showToast = false) => {
    if (!trackingCode) return;
    try {
      if (showToast) setRefreshing(true);
      const response = await api.get(`/orders/track/${trackingCode}`);
      const orderData = response.data?.data;
      if (!orderData) throw new Error('Tracking context parsing error');

      // Preserve previous status before update
      const oldStatusNum = STATUS_MAP[order?.orderStatus] ?? 1;
      const newStatusNum = STATUS_MAP[orderData.orderStatus] ?? 1;

      setOrder(orderData);
      setStatus(newStatusNum);

      // Trigger confetti if newly delivered
      if (newStatusNum === 3 && oldStatusNum !== 3 && orderData.orderStatus === 'delivered') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success('Order delivered! 🎉 Enjoy your treats!');
      } else if (showToast && newStatusNum !== oldStatusNum) {
        if (newStatusNum === 0) toast.error('Order cancelled');
        else if (newStatusNum === 3) toast.success('Order delivered! 🎉');
        else toast.success(`Status updated: ${orderData.orderStatus?.replace(/_/g, ' ').toUpperCase()}`);
      }

      // Reset floating panel visibility on status change
      if (newStatusNum !== oldStatusNum) {
        setShowFloatingPanel(true);
        setTimeout(() => setShowFloatingPanel(false), 8000);
      }
    } catch (err) {
      console.error('Tracking Data Fetch Failure:', err);
      if (showToast) toast.error('Failed to look up latest status changes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trackingCode, order?.orderStatus]);

  useEffect(() => {
    fetchTracking();
    const pollingInterval = setInterval(() => fetchTracking(), 30000);
    return () => clearInterval(pollingInterval);
  }, [fetchTracking]);

  // Auto-hide floating panel after 8 seconds initially
  useEffect(() => {
    const timer = setTimeout(() => setShowFloatingPanel(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // --- Memoized Coordinates ---
  const userPos = useMemo(() => {
    return order?.address?.lat && order?.address?.lng
      ? [parseFloat(order.address.lat), parseFloat(order.address.lng)]
      : [DEFAULT_SHOP_LAT + 0.008, DEFAULT_SHOP_LNG + 0.008];
  }, [order]);

  const distance = useMemo(() => {
    return calculateDistance(SHOP_POS[0], SHOP_POS[1], userPos[0], userPos[1]);
  }, [userPos]);

  const timeToArrive = useMemo(() => {
    return Math.max(5, Math.round(distance * 5 + 5));
  }, [distance]);

  const riderPos = useMemo(() => {
    if (status < 2) return SHOP_POS;
    // Dynamic interpolation: 40% along the route
    return [
      SHOP_POS[0] + (userPos[0] - SHOP_POS[0]) * 0.4,
      SHOP_POS[1] + (userPos[1] - SHOP_POS[1]) * 0.4
    ];
  }, [status, userPos]);

  const mapBounds = useMemo(() => {
    const locations = [SHOP_POS, userPos];
    if (status === 2) locations.push(riderPos);
    return locations;
  }, [userPos, riderPos, status]);

  const steps = [
    { id: 1, label: 'Order Confirmed', icon: CheckCircle2, desc: 'Your order has been confirmed and paid for.' },
    { id: 2, label: 'Out for Delivery', icon: Truck, desc: 'Your order is on the way to your doorstep.' },
    { id: 3, label: 'Delivered', icon: Package, desc: 'Your order has been delivered. Enjoy!' },
  ];

  // Loading state
  if (loading && !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-transparent">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div className="absolute inset-0 rounded-full border-t-4 border-secondary animate-spin"></div>
        </div>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
          <Package size={40} className="opacity-40" />
        </motion.div>
        <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Order Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-8">
          We could not resolve an order matching tracking code <span className="font-bold text-foreground">#{trackingCode}</span>.
        </p>
        <Link to="/account/orders"><Button icon={ArrowLeft}>MY ORDERS</Button></Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'cancelled';
  const currentStatusInfo = STATUS_INFO[isCancelled ? 0 : status] || STATUS_INFO[1];

  // Progress percentage for stepper line (only if not cancelled)
  const progressPercent = !isCancelled ? ((status - 1) / 2) * 100 : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageLayoutVariants}
      className="pb-20 overflow-hidden text-foreground antialiased"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* --- LEFT COLUMN: Order & Stepper --- */}
          <div className="lg:w-96 space-y-6 flex-shrink-0">
            <motion.div variants={cardMotionVariants} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-xl font-black tracking-tight">Delivery Status</h1>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    #{order.orderNumber || trackingCode}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={isCancelled ? 'error' : currentStatusInfo.color}>
                    {isCancelled ? 'CANCELLED' : currentStatusInfo.label.toUpperCase()}
                  </Badge>
                  <button
                    onClick={() => fetchTracking(true)}
                    disabled={refreshing}
                    className="text-[11px] text-muted-foreground hover:text-secondary flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Stepper Timeline with animated line */}
              <div className="space-y-8 relative">
                {/* Background track line */}
                <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-border rounded-full z-0" />

                {/* Animated fill line (only when not cancelled) */}
                {!isCancelled && (
                  <motion.div
                    className="absolute left-[23px] top-6 w-[2px] bg-secondary rounded-full z-0 origin-top"
                    initial={{ height: 0 }}
                    animate={{ height: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}

                {steps.map((step) => {
                  const isActive = !isCancelled && status >= step.id;
                  const isCurrent = !isCancelled && status === step.id;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="flex gap-4 relative z-10 items-start">
                      <motion.div
                        initial={false}
                        animate={{ scale: isCurrent ? 1.05 : 1 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md
                          ${isActive ? 'bg-secondary text-white' :
                            isCancelled ? 'bg-error/20 text-error' : 'bg-muted text-muted-foreground'}
                          ${isCurrent ? 'ring-4 ring-secondary/30' : ''}
                        `}
                      >
                        {isCancelled && step.id === 1 ? <X size={20} /> : <StepIcon size={20} />}
                      </motion.div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-bold ${isActive ? 'text-foreground' : isCancelled ? 'text-error' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                      {isCurrent && !isCancelled && status !== 3 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative flex h-2 w-2 mt-4"
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Delivery Partner Card */}
            <AnimatePresence mode="wait">
              {status === 2 && order.assignedStaff && !isCancelled && (
                <motion.div
                  variants={cardMotionVariants} initial="hidden" animate="visible" exit="exit" layout
                  className="bg-card border border-border border-l-4 border-l-secondary p-5 rounded-2xl shadow-sm"
                >
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Delivery Partner</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center font-black text-lg">
                      {order.assignedStaff.name?.charAt(0) || 'R'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{order.assignedStaff.name || 'Courier Driver'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Assigned Courier Partner</p>
                    </div>
                    {order.assignedStaff.phone && (
                      <a
                        href={`tel:${order.assignedStaff.phone}`}
                        className="w-10 h-10 bg-success rounded-xl flex items-center justify-center text-white shadow hover:bg-success/80 transition-transform hover:scale-105"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order Items Summary */}
            <motion.div variants={cardMotionVariants} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Order Items</h3>
              <div className="divide-y divide-border text-sm">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between gap-4">
                    <span className="text-muted-foreground break-words">{item.name} <strong className="text-foreground font-normal">x{item.qty}</strong></span>
                    <span className="font-medium flex-shrink-0">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border flex justify-between font-bold text-sm">
                <span>Amount Paid</span>
                <span className="text-primary">{formatCurrency(order.total || 0)}</span>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div variants={cardMotionVariants} className="bg-muted/50 border border-border p-5 rounded-2xl text-xs space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                <MapPin size={14} /> Shipping Destination
              </h3>
              <p className="font-bold text-foreground">{order.address?.fullName}</p>
              <p className="text-muted-foreground">{order.address?.phone}</p>
              <p className="text-muted-foreground mt-1">
                {[order.address?.houseNo, order.address?.street, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}
              </p>
            </motion.div>
          </div>

          {/* --- RIGHT COLUMN: Interactive Map --- */}
          <motion.div
            variants={cardMotionVariants}
            className="flex-1 min-h-[450px] lg:min-h-[600px] h-full relative rounded-2xl overflow-hidden border border-border shadow-md z-10"
          >
            <MapContainer
              center={SHOP_POS}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              <ChangeView bounds={mapBounds} />

              <Marker position={SHOP_POS} icon={icons.bakery}>
                <Popup><span className="font-bold">The Chocolate Mine Store</span></Popup>
              </Marker>

              {status === 2 && !isCancelled && (
                <Marker position={riderPos} icon={icons.rider}>
                  <Popup><span className="font-bold">Rider en Route</span></Popup>
                </Marker>
              )}

              <Marker position={userPos} icon={icons.user}>
                <Popup><span className="font-bold">Your Location</span></Popup>
              </Marker>

              <Polyline
                positions={[SHOP_POS, ...(status === 2 && !isCancelled ? [riderPos] : []), userPos]}
                color={isCancelled ? '#D32F2F' : 'var(--primary)'}
                weight={3}
                dashArray="8, 10"
                opacity={0.6}
              />
            </MapContainer>

            {/* Floating ETA Panel - Auto hides */}
            <AnimatePresence>
              {showFloatingPanel && !isCancelled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none"
                >
                  <div className="bg-background/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === 3 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                        }`}>
                        {status === 3 ? <CheckCircle2 size={20} /> : <Clock size={20} className="animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                          {status === 3 ? 'Delivered at' : 'Estimated Arrival'}
                        </p>
                        <p className="text-base font-black">
                          {status === 3
                            ? new Date(order.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : `${timeToArrive} - ${timeToArrive + 5} mins`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Distance</p>
                      <p className="text-sm font-black text-secondary">
                        {status === 3 ? '0.0 km' : `${distance.toFixed(1)} km`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cancelled overlay */}
            {isCancelled && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-[1000] flex items-center justify-center">
                <div className="bg-card p-6 rounded-2xl shadow-xl text-center max-w-xs border border-error/30">
                  <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X size={32} className="text-error" />
                  </div>
                  <h3 className="font-black text-lg mb-1">Order Cancelled</h3>
                  <p className="text-sm text-muted-foreground">This order has been cancelled and will not be delivered.</p>
                </div>
              </div>
            )}

            {/* Mobile Support Button */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] lg:hidden">
              <Button size="lg" variant="secondary" className="w-full shadow-lg font-bold" icon={Phone}>
                SUPPORT HELP
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderTracking;