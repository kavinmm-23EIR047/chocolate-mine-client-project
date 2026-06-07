import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter, ShoppingBag, ArrowRight, 
  ChevronRight, ExternalLink, RefreshCcw, Star,
  Clock, MapPin, Calendar, CreditCard, ChevronDown, Truck, CheckCircle, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { OrderStatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/helpers';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import reviewService from '../services/reviewService';

// Status mapping for correct display
const STATUS_MAP = {
  'confirmed': { label: 'Confirmed', value: 'confirmed', icon: Package },
  'out_for_delivery': { label: 'Out for Delivery', value: 'out-for-delivery', icon: Truck },
  'delivered': { label: 'Delivered', value: 'delivered', icon: CheckCircle },
  'cancelled': { label: 'Payment Cancelled', value: 'cancelled', icon: X }
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [reviewableOrders, setReviewableOrders] = useState({}); // Track which orders can be reviewed

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('Orders socket connected');
      socketRef.current.emit('join_user_room', user._id);
    });

    socketRef.current.on('my_order_updated', (data) => {
      console.log('Order update received:', data);
      fetchOrders();
    });

    socketRef.current.on('orders_needs_refresh', () => {
      fetchOrders();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my');
      console.log('Fetched orders response:', response.data);
      // Sort orders by date (newest first)
      const sortedOrders = response.data.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
      
      // Check review status for delivered orders
      const reviewStatus = {};
      for (const order of sortedOrders) {
        if (order.orderStatus === 'delivered') {
          try {
            const checkRes = await reviewService.checkOrderReviewable(order._id);
            reviewStatus[order._id] = checkRes.data.data.canReview;
          } catch (err) {
            reviewStatus[order._id] = false;
          }
        }
      }
      setReviewableOrders(reviewStatus);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to fetch your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeFilter === 'ALL') return matchesSearch;
    return matchesSearch && order.orderStatus === activeFilter;
  });

  const filters = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Out for Delivery', value: 'out_for_delivery' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Section */}
      <div className="bg-card border-b border-border/50 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
              >
                <ShoppingBag size={12} />
                Order History
              </motion.div>
              <h1 className="text-4xl lg:text-6xl font-black text-heading uppercase tracking-tighter leading-none">
                Your <span className="text-primary italic">Dessert</span> Journey
              </h1>
              <p className="text-muted font-black mt-4 uppercase tracking-widest text-xs">
                You've completed {orders.filter(o => o.orderStatus === 'delivered').length} delicious orders with us
              </p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="text"
                  placeholder="Search by Order ID or Item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border-2 border-border/40 focus:border-primary h-14 pl-14 pr-6 rounded-2xl text-sm font-black text-heading placeholder:text-muted/40 transition-all outline-none shadow-sm"
                />
              </div>
              
              <div className="relative group">
                <select 
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="appearance-none bg-primary text-button-text h-14 pl-8 pr-12 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none hover:brightness-110 transition-all"
                >
                  {filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-button-text/70 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 lg:-mt-14 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card rounded-[2.5rem] py-20 border border-border/50 shadow-premium">
            <EmptyState
              icon={Package}
              title="No orders found"
              message={searchTerm ? "Try searching for something else" : "Your history is empty, but your future can be sweet!"}
              action={<Link to="/"><Button icon={ArrowRight} className="bg-primary text-button-text px-10">START SHOPPING</Button></Link>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  index={idx} 
                  canReview={reviewableOrders[order._id]}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order, index, canReview = false }) => {
  const navigate = useNavigate();
  
  const getProgressPercent = () => {
    switch(order.orderStatus) {
      case 'confirmed': return 33;
      case 'out_for_delivery': return 66;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const progressPercent = getProgressPercent();
  
  // Only show review button if order is delivered AND can review
  const showReviewButton = order.orderStatus === 'delivered' && canReview;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-3xl group hover:border-primary/30 border border-border shadow-card transition-all duration-500 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/account/orders/${order._id}`)}
    >
      <div className="p-0">
        <div className="h-1.5 w-full bg-border/20 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${
              order.orderStatus === 'delivered' ? 'bg-success' : 
              order.orderStatus === 'out_for_delivery' ? 'bg-secondary' : 'bg-primary'
            }`}
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-primary border border-border/50 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <ShoppingBag size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="text-xl font-black text-heading uppercase tracking-tighter">
                    #{order.orderNumber}
                  </h3>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-[0.1em]">
                  <Calendar size={12} />
                  {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className="text-border">•</span>
                  <Clock size={12} />
                  {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Amount</p>
              <p className="text-2xl font-black text-heading leading-none">{formatCurrency(order.total || 0)}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border/30 rounded-3xl p-5 mb-6 shadow-sm">
            <div className="space-y-4">
              {order.items?.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface rounded-xl overflow-hidden border border-border/30 shrink-0 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-heading truncate uppercase tracking-tighter">{item.name}</p>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-0.5">
                      {item.qty} Unit{item.qty > 1 ? 's' : ''} • {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))}
              {order.items?.length > 3 && (
                <p className="text-[10px] font-black text-primary uppercase tracking-widest pl-16">
                  + {order.items.length - 3} More Items
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 border-t border-border/50 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-muted border border-border/30 shadow-sm">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">Method</p>
                <p className="text-[10px] font-black text-heading leading-none uppercase tracking-widest">{order.paymentMethod}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-muted border border-border/30 shadow-sm">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">Delivery</p>
                <p className="text-[10px] font-black text-heading leading-none uppercase tracking-widest">
                  {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : ''}
                </p>
                <p className="text-[9px] font-black text-primary leading-none uppercase tracking-widest mt-1">
                  {order.deliverySlot || 'TBD'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link to={`/track/${order.trackingCode || order._id}`} className="flex-1">
              <button 
                className="w-full h-12 bg-surface text-heading border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-button-text transition-all flex items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin size={14} />
                Track Status
              </button>
            </Link>
            
            {showReviewButton ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/review/${order._id}`);
                }}
                className="flex-1 h-12 bg-primary text-button-text rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-premium"
              >
                <Star size={14} />
                Write Review
              </button>
            ) : order.orderStatus === 'delivered' && !canReview ? (
              <button 
                className="flex-1 h-12 bg-muted/10 text-muted/40 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center gap-2"
                disabled
              >
                <Star size={14} />
                Reviewed
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/review/${order._id}`);
                }}
                className="flex-1 h-12 bg-surface text-heading border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-button-text transition-all flex items-center justify-center gap-2"
              >
                <Star size={14} />
                Rate Order
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Orders;