import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ShoppingBag, Clock, CheckCircle, Printer, RefreshCw, Eye, Flame, Truck, Package, X, KeyRound, Phone, ChevronDown, ChevronUp, LayoutDashboard, History, ClipboardList, MapPin, CreditCard, Calendar, Hash } from 'lucide-react';
import staffService from '../../services/staffService';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import orderService from '../../services/orderService';



// Order Status Dropdown – fully theme-aware
const OrderStatusDropdown = ({ order, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [];
  if (order.orderStatus === 'confirmed') {
    actions.push({ id: 'out_for_delivery', label: 'Out For Delivery', icon: Truck, color: 'text-primary', hover: 'hover:bg-primary/10' });
  } else if (order.orderStatus === 'out_for_delivery') {
    actions.push({ id: 'delivered', label: 'Deliver Order', icon: CheckCircle, color: 'text-success', hover: 'hover:bg-success/10' });
  }

  if (actions.length === 0) {
    return (
      <Button disabled className="flex-1 rounded-2xl py-3 text-xs opacity-50 cursor-not-allowed bg-card-soft text-muted">
        COMPLETED
      </Button>
    );
  }

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <Button
        className="w-full rounded-2xl py-3 text-xs flex justify-center items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
      >
        <span>UPDATE STATUS</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-20"
          >
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => {
                  setIsOpen(false);
                  onUpdate(order._id, action.id);
                }}
                className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors ${action.color} ${action.hover}`}
              >
                <action.icon size={16} />
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Order Details Modal – theme-aware
const OrderDetailsModal = ({ order, onClose }) => {
  const [expandedItems, setExpandedItems] = useState({});
  if (!order) return null;

  const toggleItemExpand = (index) => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 cursor-pointer" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card text-foreground border border-border rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-heading text-xl">Order Details</h3>
              <p className="text-xs text-muted">#{order.orderNumber} | {order.trackingCode}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-border/20 rounded-full transition-colors">
              <X size={20} className="text-heading" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-card-soft border border-border/40 rounded-xl">
            <h4 className="font-bold text-sm mb-2 text-heading">Customer & Delivery</h4>
            <p className="text-sm font-semibold text-heading">{order.address?.fullName}</p>
            <p className="text-sm text-muted">{order.address?.phone}</p>
            <div className="flex items-start gap-2 mt-2">
              <MapPin size={14} className="text-muted mt-0.5 shrink-0" />
              <p className="text-xs text-muted">{order.address?.houseNo}, {order.address?.street}, {order.address?.city} - {order.address?.pincode}</p>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <div className="flex items-center gap-1 text-muted">
                <Calendar size={12} />
                <span>{new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-muted">
                <Clock size={12} />
                <span>{order.deliverySlot}</span>
              </div>
            </div>
          </div>
          {/* Items List */}
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3 text-heading">Order Items</h4>
            <div className="space-y-3">
              {order.items?.map((item, idx) => {
                const itemPrice = item.price || item.originalPrice;
                const total = itemPrice * item.qty;
                return (
                  <div key={idx} className="border border-border/50 rounded-xl p-3 bg-card-soft/30">
                    <div className="flex gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-border/20" />}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-heading">{item.name}</p>
                            <p className="text-xs text-muted font-mono">{item.sku}</p>
                          </div>
                          <p className="font-bold text-heading">{formatCurrency(total)}</p>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted">Qty: {item.qty}</span>
                          <span className="text-muted">{formatCurrency(itemPrice)} each</span>
                        </div>
                        {(item.selectedFlavor || item.selectedWeight) && (
                          <div className="text-xs text-muted mt-1">
                            {item.selectedFlavor && <span>{item.isCustomCake ? 'Color' : 'Flavor'}: {item.selectedFlavor}</span>}
                            {item.selectedWeight && <span className="ml-2">Weight: {item.selectedWeight}</span>}
                          </div>
                        )}
                        {item.customDetails && (
                          <button onClick={() => toggleItemExpand(idx)} className="text-xs text-secondary flex items-center gap-1 mt-2 font-bold">
                            {expandedItems[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Custom Details
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedItems[idx] && item.customDetails && (
                      <div className="mt-3 p-3 bg-card-soft border border-border/40 rounded-lg text-xs space-y-1">
                        {item.customDetails.flavour && <p><span className="font-bold text-heading">Color:</span> {item.customDetails.flavour}</p>}
                        {item.customDetails.shape && <p><span className="font-bold text-heading">Shape:</span> {item.customDetails.shape}</p>}
                        {item.customDetails.tiers && <p><span className="font-bold text-heading">Tiers:</span> {item.customDetails.tiers}</p>}
                        {item.customDetails.eggless && <p><span className="font-bold text-heading">Eggless:</span> Yes</p>}
                        {item.customDetails.lessSugar && <p><span className="font-bold text-heading">Less Sugar:</span> Yes</p>}
                        {item.customDetails.messageOnCake && <p><span className="font-bold text-heading">Message:</span> {item.customDetails.messageOnCake}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Payment Summary */}
          <div className="p-4 bg-card-soft border border-border/40 rounded-xl">
            <h4 className="font-bold text-sm mb-2 text-heading">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-semibold text-heading">{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-success-text"><span>Discount</span><span className="font-semibold">-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Delivery Charge</span><span className="font-semibold text-heading">{formatCurrency(order.deliveryCharge)}</span></div>
              <div className="flex justify-between"><span className="text-muted">GST</span><span className="font-semibold text-heading">{formatCurrency(order.gst)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-border/40"><span className="text-heading">Total</span><span className="text-primary">{formatCurrency(order.total)}</span></div>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40">
              <p className="text-xs text-muted">Payment: <span className="font-semibold text-heading">{order.paymentMethod}</span></p>
              <p className="text-xs text-muted">Status: <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}`}>{order.paymentStatus?.toUpperCase()}</span></p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const StaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ confirmedOrders: 0, outForDeliveryOrders: 0, deliveredOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return;
    let userId = '';
    try {
      const userObj = JSON.parse(userStr);
      userId = userObj.id || userObj._id;
    } catch (e) {
      console.error('Failed to parse user session in StaffDashboard', e);
    }

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true
    });
    socketRef.current.on('connect', () => {
      if (userId) {
        socketRef.current.emit('join_staff_room', userId);
      }
      socketRef.current.emit('join_admin_room');
    });
    socketRef.current.on('assigned_order_updated', () => fetchData());
    socketRef.current.on('dashboard_needs_refresh', () => fetchData());
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const getPageType = (path) => {
    if (path.includes('orders/new')) return 'new';
    if (path.includes('orders/active')) return 'active';
    if (path.includes('orders/history')) return 'history';
    return 'dashboard';
  };

  const pageType = getPageType(location.pathname);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await staffService.getDashboard();
      setStats(statsRes.data.data);
      if (pageType === 'new') {
        const res = await staffService.getNewOrders();
        setOrders(res.data.data);
      } else if (pageType === 'active') {
        const res = await staffService.getOutForDeliveryOrders();
        setOrders(res.data.data);
      } else if (pageType === 'history') {
        const res = await staffService.getDeliveredOrders();
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [location.pathname]);

  const handleViewOrderDetails = async (orderId) => {
    try {
      const res = await staffService.getOrderDetails(orderId);
      setSelectedOrderDetails(res.data.data);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  const handleDeliveryStatusUpdate = async (id, status) => {
    try {
      await staffService.updateKitchenStatus(id, status);
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };



  const handlePrintInvoice = async (orderId) => {
    try {
      toast.loading('Generating invoice...', { id: 'invoice' });
      const res = await orderService.downloadInvoice(orderId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('Invoice ready', { id: 'invoice' });
    } catch (err) {
      toast.error('Failed to generate invoice', { id: 'invoice' });
    }
  };

  const handlePrintKOT = async (orderId) => {
    try {
      toast.loading('Printing KOT...', { id: 'kot' });
      staffService.printKOT(orderId);
      toast.success('KOT generated successfully', { id: 'kot' });
    } catch (err) {
      toast.error('Failed to generate KOT', { id: 'kot' });
    }
  };

  // Dashboard summary view (theme‑aware)
  if (pageType === 'dashboard') {
    const summaryItems = [
      { id: 'confirmed', label: 'Confirmed', icon: ClipboardList, count: stats.confirmedOrders, color: 'text-secondary', bg: 'bg-secondary/10', path: '/staff/orders/new' },
      { id: 'active', label: 'Out For Delivery', icon: Flame, count: stats.outForDeliveryOrders, color: 'text-primary', bg: 'bg-primary/10', path: '/staff/orders/active' },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle, count: stats.deliveredOrders, color: 'text-success', bg: 'bg-success/10', path: '/staff/orders/history' },
      { id: 'history', label: 'History', icon: History, count: stats.deliveredOrders, color: 'text-heading', bg: 'bg-heading/10', path: '/staff/orders/history' },
    ];
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryItems.map((item) => (
            <Link key={item.id} to={item.path} className="group">
              <motion.div whileHover={{ y: -5 }} className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-sm font-black text-muted uppercase tracking-widest">{item.label}</h3>
                <p className="text-4xl font-black text-heading mt-2">{item.count || 0}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  VIEW ALL ORDERS →
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl flex items-center gap-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl shadow-sm flex items-center justify-center text-primary">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="font-black text-heading uppercase tracking-tight">Real-time Updates Active</h4>
            <p className="text-xs text-muted font-medium mt-1">Orders from the kitchen and online store will appear here automatically as they are confirmed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrderDetailsModal order={selectedOrderDetails} onClose={() => { setDetailsModalOpen(false); setSelectedOrderDetails(null); }} />
      <div className="flex justify-end">
        <Button variant="outline" icon={RefreshCw} onClick={fetchData} loading={loading}>Refresh</Button>
      </div>
      {loading ? <TableSkeleton rows={3} cols={1} /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" message="Relax! There's nothing to do in this section right now." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border-t-4 border-t-secondary rounded-2xl shadow-card border border-border/50 p-6 relative group flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px] tracking-widest">{order.deliverySlot}</Badge>
                    <h3 className="font-black text-xl text-heading">#{order.orderNumber}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Hash size={10} className="text-muted" />
                      <p className="text-[9px] text-muted font-mono">{order.trackingCode || '—'}</p>
                    </div>
                    <p className="text-[9px] text-muted font-mono mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                {/* Customer Info */}
                <div className="mb-3 p-3 bg-card-soft rounded-xl border border-border/30">
                  <p className="font-black text-xs uppercase tracking-widest text-secondary mb-1">Customer</p>
                  <p className="font-bold text-sm text-heading truncate">{order.address?.fullName}</p>
                  <p className="text-xs text-muted">{order.address?.phone}</p>
                  <div className="flex items-start gap-1.5 mt-2">
                    <MapPin size={12} className="text-muted mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted leading-tight">{order.address?.houseNo ? `${order.address.houseNo}, ` : ''}{order.address?.street}, {order.address?.city}</p>
                  </div>
                </div>
                {/* Delivery Info */}
                <div className="flex justify-between items-center mb-3 text-xs">
                  <div className="flex items-center gap-1 text-muted"><Calendar size={12} /><span>{new Date(order.deliveryDate).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-1 text-muted"><Clock size={12} /><span>{order.deliverySlot}</span></div>
                </div>
                {/* Order Items */}
                <div className="space-y-2 mb-4 max-h-36 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  {order.items?.map((item, idx) => {
                    const itemPrice = item.price || item.originalPrice;
                    const total = itemPrice * item.qty;
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-border/10 rounded-lg text-sm border border-transparent group-hover:border-border/50 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-sm text-heading">{item.name}</p>
                          <p className="text-[10px] text-muted">{item.qty}x · {item.selectedFlavor || (item.isCustomCake ? 'Custom' : 'Standard')}{item.selectedWeight && ` · ${item.selectedWeight}`}</p>
                        </div>
                        <p className="font-black text-xs ml-2 shrink-0 text-heading">{formatCurrency(total)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Payment & Total */}
                <div className="flex justify-between items-center mb-5 pt-2 border-t border-border">
                  <div className="flex flex-col"><span className="text-[9px] text-muted uppercase tracking-widest">Payment</span><span className="text-xs font-bold text-heading">{order.paymentMethod} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span></div>
                  <div className="text-right"><span className="text-[9px] text-muted uppercase tracking-widest">Total</span><p className="font-black text-primary text-xl leading-tight">{formatCurrency(order.total)}</p></div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleViewOrderDetails(order._id)} className="p-3 bg-border/20 rounded-2xl hover:bg-secondary/10 transition-colors text-heading shrink-0" title="View Details"><Eye size={18} /></button>
                  <OrderStatusDropdown order={order} onUpdate={handleDeliveryStatusUpdate} />
                  <button onClick={() => handlePrintKOT(order._id)} className="p-3 bg-border/20 rounded-2xl hover:bg-secondary/10 transition-colors text-heading shrink-0" title="Print KOT"><ChefHat size={18} /></button>
                  <button onClick={() => handlePrintInvoice(order._id)} className="p-3 bg-border/20 rounded-2xl hover:bg-secondary/10 transition-colors text-heading shrink-0" title="Print Invoice"><Printer size={18} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;