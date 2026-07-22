import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter, ShoppingBag, ArrowRight, 
  ChevronRight, ExternalLink, RefreshCcw, Star,
  Clock, MapPin, Calendar, CreditCard, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../utils/helpers';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import reviewService from '../../services/reviewService';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [reviewableOrders, setReviewableOrders] = useState({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders for user:', user?._id);
      const response = await api.get('/orders/my');
      console.log('Orders response:', response.data);
      const ordersData = response.data.data;
      setOrders(ordersData);
      

    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to fetch your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeFilter === 'ALL') return matchesSearch;
    return matchesSearch && order.orderStatus === activeFilter;
  });

  // Updated filters to match actual order statuses
  const filters = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Out for Delivery', value: 'out_for_delivery' },
    { label: 'Delivered', value: 'delivered' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-heading tracking-tight">Order History</h1>
          <p className="text-sm text-muted font-bold mt-1">Track, review, or buy items again</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card-soft border-2 border-transparent focus:border-secondary/20 h-12 pl-12 pr-4 rounded-xl text-sm font-bold text-heading placeholder:text-muted/50 transition-all outline-none"

            />
          </div>
          
          <div className="relative group">
            <select 
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="appearance-none bg-card-soft border-2 border-transparent hover:border-secondary/20 text-heading h-12 pl-4 pr-10 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer outline-none transition-all"

            >
              {filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={Package}
              title="No orders found"
              message={searchTerm ? "Try searching for something else" : "Your history is empty, but your future can be sweet!"}
              action={<Link to="/"><Button icon={ArrowRight}>START SHOPPING</Button></Link>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
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
  
  const showReviewButton = order.orderStatus === 'delivered' && canReview;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-premium group hover:border-secondary/30 transition-all duration-300 overflow-hidden bg-card cursor-pointer rounded-[2.5rem]"

      onClick={() => navigate(`/account/orders/${order._id}`)}
    >
      <div className="p-0">
        {/* Status Strip */}
        <div className="h-1 w-full bg-border/20 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: order.orderStatus === 'delivered' ? '100%' : order.orderStatus === 'out_for_delivery' ? '66%' : '33%' }}
            className={`h-full ${
              order.orderStatus === 'delivered' ? 'bg-success' : 
              order.orderStatus === 'out_for_delivery' ? 'bg-secondary' : 'bg-primary'
            }`}
          />
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6">
            <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4 sm:gap-6 w-full">
               <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card-soft rounded-2xl flex items-center justify-center p-1.5 sm:p-2 border border-border/50 shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {order.items[0]?.image ? (
                    <img src={order.items[0].image} alt="product" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ShoppingBag size={24} className="text-muted" />
                  )}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-3 mb-2 items-start">
                    <h3 className="text-sm sm:text-lg font-black text-heading uppercase tracking-tighter truncate w-full">
                      #{order.orderNumber || order.trackingCode || 'Order'}
                    </h3>
                    <div className="shrink-0"><OrderStatusBadge status={order.orderStatus} /></div>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-heading line-clamp-2 mb-1 sm:mb-1.5 leading-tight">
                    {order.items?.map(i => i.name).join(', ')}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-[0.1em] flex-wrap">
                    <span>{new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-border">•</span>
                    <span>{order.items?.length} Item{order.items?.length > 1 ? 's' : ''}</span>
                  </div>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 shrink-0">
              <div className="text-left md:text-right">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-2xl font-black text-primary leading-none">{formatCurrency(order.total || 0)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/account/orders/${order._id}`);
                }} className="bg-card-soft">

                  DETAILS
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderHistory;