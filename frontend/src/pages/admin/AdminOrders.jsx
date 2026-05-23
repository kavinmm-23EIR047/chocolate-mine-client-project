import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Filter, Download, RefreshCw, Info, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  const [expandedItems, setExpandedItems] = useState({});
  
  if (!order) return null;

  const toggleItemExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 cursor-pointer"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card text-foreground border border-border rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col cursor-default"
      >
        <div className="p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-heading text-xl">Order Details</h3>
              <p className="text-xs text-muted">#{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-border/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-card-soft border border-border/40 rounded-xl">
            <h4 className="font-bold text-sm mb-2 text-heading">Customer Details</h4>
            <p className="text-sm">{order.address?.fullName}</p>
            <p className="text-sm text-muted">{order.address?.phone}</p>
            <p className="text-sm text-muted mt-1">{order.address?.houseNo}, {order.address?.street}</p>
            <p className="text-sm text-muted">{order.address?.city}, {order.address?.pincode}</p>
            {order.deliverySlot && (
              <p className="text-sm text-muted mt-2">Delivery Slot: {order.deliverySlot}</p>
            )}
          </div>
          
          {/* Items List */}
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3 text-heading">Order Items</h4>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="border border-border/50 rounded-xl p-3 bg-card-soft/30">
                  <div className="flex gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-border/20" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-heading">{item.name}</p>
                          <p className="text-xs text-muted font-mono">SKU: {item.sku || 'N/A'}</p>
                        </div>
                        <p className="font-bold text-heading">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted">Qty: {item.qty}</span>
                        <span className="text-muted">{formatCurrency(item.price)} each</span>
                      </div>
                      {(item.selectedFlavor || item.selectedWeight) && (
                        <div className="text-xs text-muted mt-1">
                          {item.selectedFlavor && <span>Flavor: {item.selectedFlavor}</span>}
                          {item.selectedWeight && <span className="ml-2">Weight: {item.selectedWeight}</span>}
                        </div>
                      )}
                      {item.customDetails && Object.keys(item.customDetails).length > 0 && (
                        <button 
                          onClick={() => toggleItemExpand(idx)}
                          className="text-xs text-secondary flex items-center gap-1 mt-2 font-bold"
                        >
                          {expandedItems[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Custom Details
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedItems[idx] && item.customDetails && (
                    <div className="mt-3 p-3 bg-card-soft border border-border/40 rounded-lg text-xs space-y-1">
                      {item.customDetails.flavour && <p><span className="font-bold text-heading">Flavor:</span> {item.customDetails.flavour}</p>}
                      {item.customDetails.shape && <p><span className="font-bold text-heading">Shape:</span> {item.customDetails.shape}</p>}
                      {item.customDetails.tiers && <p><span className="font-bold text-heading">Tiers:</span> {item.customDetails.tiers}</p>}
                      {item.customDetails.weight && <p><span className="font-bold text-heading">Weight:</span> {item.customDetails.weight}</p>}
                      {item.customDetails.eggless && <p><span className="font-bold text-heading">Eggless:</span> Yes</p>}
                      {item.customDetails.lessSugar && <p><span className="font-bold text-heading">Less Sugar:</span> Yes</p>}
                      {item.customDetails.messageOnCake && <p><span className="font-bold text-heading">Message:</span> {item.customDetails.messageOnCake}</p>}
                      {item.customDetails.notes && <p><span className="font-bold text-heading">Notes:</span> {item.customDetails.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Payment Summary */}
          <div className="p-4 bg-card-soft border border-border/40 rounded-xl">
            <h4 className="font-bold text-sm mb-2 text-heading">Payment Summary</h4>
            <div className="space-y-1 text-sm">
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
                <span className="text-muted">Convenience Fee</span>
                <span className="font-semibold text-heading">{formatCurrency(order.convenienceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">GST</span>
                <span className="font-semibold text-heading">{formatCurrency(order.gst)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border/40">
                <span className="text-heading">Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40">
              <p className="text-xs text-muted">Payment Method: <span className="font-semibold text-heading">{order.paymentMethod}</span></p>
              <p className="text-xs text-muted">Payment Status: <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}`}>{order.paymentStatus?.toUpperCase()}</span></p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('Admin socket connected');
      socketRef.current.emit('join_admin_room');
    });

    socketRef.current.on('order_status_updated', (data) => {
      console.log('Order status update received:', data);
      fetchOrders();
    });

    socketRef.current.on('dashboard_needs_refresh', () => {
      fetchOrders();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.orderStatus = statusFilter;
      const res = await adminService.getOrders(params);
      setOrders(res.data.data);
      setTotalPages(Math.ceil((res.data.total || 0) / 10));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { 
    fetchOrders(); 
  }, [fetchOrders]);

  const handleViewOrderDetails = async (orderId) => {
    try {
      const res = await adminService.getOrder(orderId);
      setSelectedOrderDetails(res.data.data);
      setDetailsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      toast.error('Failed to load order details');
    }
  };

  // Admin can only view orders - NO status update functionality
  const statusOptions = ['confirmed', 'out_for_delivery', 'delivered'];

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // Format order display ID (prefer orderNumber, then trackingCode, then fallback)
  const getOrderDisplayId = (order) => {
    if (order.orderNumber) return order.orderNumber;
    if (order.trackingCode) return order.trackingCode;
    return order._id.slice(-8).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Order Details Modal */}
      {detailsModalOpen && (
        <OrderDetailsModal 
          order={selectedOrderDetails}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedOrderDetails(null);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading">Orders</h2>
          <p className="text-sm text-muted">View and monitor customer orders (View Only)</p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={fetchOrders}>Refresh</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl">
           <Filter size={16} className="text-muted" />
           <select 
             value={statusFilter} 
             onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
             className="bg-transparent border-none focus:ring-0 text-sm font-bold text-heading outline-none"
           >
             <option value="">All Statuses</option>
             {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
           </select>
        </div>
        
        {/* Info Badge - Admin cannot edit */}
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-medium">
          <Info size={14} />
          <span>Admin View Only - Status updates disabled</span>
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} cols={7} /> : orders.length === 0 ? (
        <EmptyState 
          icon={ShoppingBag} 
          title="No orders found" 
          message="When customers place orders, they'll appear here." 
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-border/20">
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Order ID</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Customer</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Date & Time</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Items</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Amount</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Payment</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Status</th>
                  <th className="text-right px-4 py-4 text-xs font-black text-muted uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order, i) => (
                  <motion.tr 
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-border/10 transition-colors cursor-pointer"
                    onClick={() => handleViewOrder(order._id)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-black text-heading text-sm uppercase block">
                          #{getOrderDisplayId(order)}
                        </span>
                        {order.trackingCode && order.orderNumber !== order.trackingCode && (
                          <span className="text-[9px] text-muted font-mono">
                            T: {order.trackingCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-heading text-sm">{order.address?.fullName || order.user?.name || 'Guest'}</p>
                        <p className="text-[10px] text-muted font-bold">{order.address?.phone || order.user?.email}</p>
                        {order.deliverySlot && (
                          <p className="text-[9px] text-muted mt-0.5">Slot: {order.deliverySlot}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-muted">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Package size={14} className="text-muted" />
                        <span className="text-sm font-bold text-heading">{order.items?.length || 0}</span>
                        <span className="text-[10px] text-muted">items</span>
                      </div>
                      {/* Preview first item with SKU */}
                      {order.items?.[0] && (
                        <div className="mt-1">
                          <p className="text-[9px] text-muted truncate max-w-[150px]">
                            {order.items[0].name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                          </p>
                          {order.items[0].sku && (
                            <p className="text-[8px] text-muted font-mono">SKU: {order.items[0].sku}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-black text-primary">{formatCurrency(order.total || 0)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {order.paymentStatus?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-4 py-4 text-right">
                       <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* View Order Details Button - Shows full modal */}
                          <button 
                            onClick={() => handleViewOrderDetails(order._id)}
                            className="p-2 hover:bg-secondary/10 text-muted hover:text-secondary rounded-xl transition-colors"
                            title="View Order Details"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Download Invoice - Only for delivered orders */}
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
                              className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors"
                              title="Download Invoice"
                            >
                              <Download size={18} />
                            </button>
                          )}
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AdminOrders;