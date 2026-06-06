import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Package, Truck, CheckCircle2, Clock, 
  Phone, ChevronRight, ShoppingBag, ArrowLeft, 
  CalendarCheck, Map, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

// Custom Marker Icons
const bakeryIcon = L.divIcon({
  html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-xl text-white text-xl">🧁</div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 40]
});

const riderIcon = L.divIcon({
  html: `<div class="w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-4 border-white shadow-xl text-white text-2xl animate-bounce">🛵</div>`,
  className: '', iconSize: [48, 48], iconAnchor: [24, 48]
});

const userIcon = L.divIcon({
  html: `<div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl text-white text-xl">📍</div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 40]
});

// Status mapping for display
const STATUS_INFO = {
  1: { label: 'Confirmed', color: 'info', message: 'Your order has been confirmed and is ready for delivery' },
  2: { label: 'Out for Delivery', color: 'warning', message: 'Your order is on the way to your doorstep' },
  3: { label: 'Delivered', color: 'success', message: 'Your order has been delivered. Enjoy!' }
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const trackingCode = orderId || searchParams.get('id');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async (showToast = false) => {
    if (!trackingCode) return;

    try {
      if (showToast) setRefreshing(true);
      const response = await api.get(`/orders/track/${trackingCode}`);
      const orderData = response.data.data;
      setOrder(orderData);
      
      // Updated status mapping for 3-step delivery workflow
      const statusMap = {
        'confirmed': 1,
        'out_for_delivery': 2,
        'out-for-delivery': 2,
        'delivered': 3
      };
      const newStatus = statusMap[orderData.orderStatus] || 1;
      setStatus(newStatus);
      
      if (showToast && newStatus === 3) {
        toast.success('Order delivered! 🎉');
      } else if (showToast) {
        toast.success(`Order status: ${orderData.orderStatus?.replace(/_/g, ' ').toUpperCase()}`);
      }
    } catch (err) {
      console.error('Tracking Error:', err);
      setOrder(null);
      if (showToast) toast.error('Failed to fetch tracking info');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => fetchTracking(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [trackingCode]);

  const handleRefresh = () => {
    fetchTracking(true);
  };

  const SHOP_LAT = parseFloat(import.meta.env.VITE_SHOP_LAT) || 11.0045;
  const SHOP_LNG = parseFloat(import.meta.env.VITE_SHOP_LNG) || 76.9751;

  const bakeryPos = [SHOP_LAT, SHOP_LNG];
  const userPos = order?.address?.lat ? [order.address.lat, order.address.lng] : [SHOP_LAT + 0.01, SHOP_LNG + 0.01];
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const dist = order?.address?.lat ? calculateDistance(SHOP_LAT, SHOP_LNG, order.address.lat, order.address.lng) : 0;
  const timeToArrive = Math.round(dist * 5 + 5); // Rough estimate: 5 min per KM + 5 min buffer

  // Rider position between bakery and user (only shown when status >= 2)
  const riderPos = status >= 2 ? [
    bakeryPos[0] + (userPos[0] - bakeryPos[0]) * 0.4,
    bakeryPos[1] + (userPos[1] - bakeryPos[1]) * 0.4
  ] : bakeryPos;

  // Updated steps for 3-step delivery workflow
  const steps = [
    { id: 1, label: 'Order Confirmed', icon: CalendarCheck, desc: 'Your order has been confirmed and is ready for delivery' },
    { id: 2, label: 'Out for Delivery', icon: Truck, desc: 'Your order is on the way to your doorstep' },
    { id: 3, label: 'Delivered', icon: CheckCircle2, desc: 'Your order has been delivered. Enjoy!' },
  ];

  if (!loading && !order) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-error/5 text-error rounded-full flex items-center justify-center mb-6">
        <Package size={40} className="opacity-20" />
      </div>
      <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Order Not Found</h2>
      <p className="text-muted text-sm max-w-xs mb-8">We couldn't find an order with the ID <span className="text-heading font-black">#{trackingCode}</span>. Please check the link or browse your order history.</p>
      <Link to="/account/orders"><Button icon={ArrowLeft}>MY ORDERS</Button></Link>
    </div>
  );

  if (loading && !order) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary" />
    </div>
  );

  const currentStatusInfo = STATUS_INFO[status] || STATUS_INFO[1];

  return (
    <div className="pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left: Status Sidebar */}
          <div className="lg:w-96 space-y-8">
            <div className="card-premium p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black text-heading">Tracking Order</h1>
                  <p className="text-xs text-muted font-bold mt-1">
                    #{order?.orderNumber || order?.trackingCode || trackingCode}
                  </p>
                  {order?.orderNumber && order?.trackingCode && order.orderNumber !== order.trackingCode && (
                    <p className="text-[9px] text-muted mt-0.5 font-mono">
                      Tracking: {order.trackingCode}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={status === 3 ? 'success' : status === 2 ? 'warning' : 'info'}>
                    {currentStatusInfo.label.toUpperCase()}
                  </Badge>
                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-[10px] text-muted hover:text-secondary flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="space-y-10 relative">
                {/* Vertical Progress Line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-border z-0">
                   <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${((status - 1) / 2) * 100}%` }}
                    className="w-full bg-secondary transition-all duration-500"
                   />
                </div>
                
                {steps.map((step) => {
                  const isActive = status >= step.id;
                  const isCurrent = status === step.id;
                  return (
                    <div key={step.id} className="flex gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isActive ? 'bg-secondary text-white shadow-lg' : 'bg-card border border-border text-muted'
                      } ${isCurrent ? 'scale-110 ring-4 ring-secondary/20' : ''}`}>
                        <step.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-black transition-colors ${isActive ? 'text-heading' : 'text-muted'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mt-1">{step.desc}</p>
                        {isCurrent && step.id === 2 && order?.assignedStaff && (
                          <div className="mt-2 p-2 bg-orange-50 rounded-lg text-[10px] text-orange-700">
                            📞 Contact rider at {order.assignedStaff.phone}
                          </div>
                        )}
                      </div>
                      {isCurrent && (
                        <div className="ml-auto w-2 h-2 bg-secondary rounded-full animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rider Details Card - Only shown when status >= 2 (out for delivery) */}
            <AnimatePresence>
              {status >= 2 && order?.assignedStaff && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-6 border-l-4 border-secondary"
                >
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Your Delivery Hero</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center text-xl font-black">
                      {order.assignedStaff.name?.charAt(0) || 'R'}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-heading leading-none">{order.assignedStaff.name || 'Delivery Partner'}</p>
                      <div className="flex items-center gap-1 text-yellow-500 mt-1">
                        {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={10} fill="currentColor" />)}
                        <span className="text-[10px] font-bold text-muted ml-1">4.9 Star Rider</span>
                      </div>
                      <p className="text-[9px] text-muted mt-1">ID: {order.assignedStaff._id?.slice(-6)}</p>
                    </div>
                    <a 
                      href={`tel:${order.assignedStaff.phone}`}
                      className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                    >
                      <Phone size={20} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order Summary */}
            <div className="card-premium p-6 bg-border/20 border-dashed">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-heading uppercase">Order Summary</h3>
                  <Link to={`/account/orders/${order?._id}`} className="text-[10px] text-secondary hover:underline">
                    View Details
                  </Link>
               </div>
               <div className="space-y-3">
                  {order?.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted">{item.name} x{item.qty}</span>
                      <span className="text-heading">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                  {order?.items?.length > 3 && (
                    <p className="text-[9px] text-muted text-center">
                      + {order.items.length - 3} more items
                    </p>
                  )}
                  <div className="pt-3 border-t border-border flex justify-between font-black text-xs">
                     <span>Total Paid</span>
                     <span className="text-primary">{formatCurrency(order?.total || 0)}</span>
                  </div>
                  {order?.deliveryDate && (
                    <div className="pt-3 border-t border-border flex flex-col gap-1 text-[10px] font-bold">
                       <div className="flex justify-between">
                         <span className="text-muted uppercase tracking-widest">Delivery Date</span>
                         <span className="text-primary">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                       </div>
                       {order?.deliverySlot && (
                         <div className="flex justify-between">
                           <span className="text-muted uppercase tracking-widest">Time Slot</span>
                           <span className="text-primary">{order.deliverySlot}</span>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>

            {/* Delivery Address */}
            <div className="card-premium p-6 bg-border/20">
              <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-1">
                <MapPin size={12} /> Delivery Address
              </h3>
              <p className="text-xs font-medium text-heading">{order?.address?.fullName}</p>
              <p className="text-[10px] text-muted">{order?.address?.phone}</p>
              <p className="text-[10px] text-muted mt-1">{order?.address?.houseNo}, {order?.address?.street}</p>
              <p className="text-[10px] text-muted">{order?.address?.city}, {order?.address?.pincode}</p>
            </div>
          </div>

          {/* Right: Map Container */}
          <div className="flex-1 min-h-[500px] lg:h-auto">
            <div className="card-premium h-full relative overflow-hidden shadow-2xl">
              <MapContainer 
                center={bakeryPos} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                <Marker position={bakeryPos} icon={bakeryIcon}>
                  <Popup><p className="font-black">The Chocolate Mine</p></Popup>
                </Marker>

                {status >= 2 && (
                  <Marker position={riderPos} icon={riderIcon}>
                    <Popup><p className="font-black">Your Rider is on the way!</p></Popup>
                  </Marker>
                )}

                <Marker position={userPos} icon={userIcon}>
                  <Popup><p className="font-black">Your Delivery Address</p></Popup>
                </Marker>

                <Polyline 
                  positions={[bakeryPos, ...(status >= 2 ? [riderPos] : []), userPos]} 
                  color="#3B1A0F" 
                  weight={4} 
                  dashArray="10, 15" 
                  opacity={0.3}
                />
              </MapContainer>

              {/* Floating Map Overlay */}
              <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none">
                 <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl flex items-center justify-between border border-white/20">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                         status === 3 ? 'bg-success/10 text-success' : 
                         status === 2 ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                       }`}>
                          {status === 3 ? <CheckCircle2 size={24} /> : <Clock size={24} className="animate-pulse" />}
                       </div>
                        <div>
                          <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                            {status === 3 ? 'Delivered On' : status === 2 ? 'Approximate Arrival' : 'Order Status'}
                          </p>
                          <p className="text-xl font-black text-heading">
                            {status === 3 
                              ? new Date(order?.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : status === 2 
                                ? `${timeToArrive} - ${timeToArrive + 5} mins` 
                                : 'Confirmed'}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                        {status >= 2 ? 'Distance from Shop' : 'Shop Distance'}
                       </p>
                       <p className="text-sm font-black text-secondary">
                        {status === 3 ? '0.0 km' : `${dist.toFixed(1)} km`}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Bottom Actions Mobile */}
              <div className="absolute bottom-6 left-6 right-6 z-[1000] lg:hidden">
                 <Button size="lg" variant="secondary" className="w-full shadow-2xl" icon={Phone}>
                   CONTACT SUPPORT
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;