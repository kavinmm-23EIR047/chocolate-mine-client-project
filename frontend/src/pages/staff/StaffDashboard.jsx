import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ShoppingBag, Clock, CheckCircle, Printer, RefreshCw, Eye, Flame, Truck, Package, X, KeyRound, Phone, ChevronDown, ChevronUp, LayoutDashboard, History, ClipboardList, MapPin, CreditCard, Calendar, Hash, Search, Plus, Minus, Trash2, Store, ShoppingCart, User } from 'lucide-react';
import staffService from '../../services/staffService';
import productService from '../../services/productService';
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

const BENTO_FLAVOR_PRICES = {
  'White Forest': 380,
  'Butterscotch': 390,
  'Rose Milk': 410,
  'Honey & Almond': 410,
  'Black Forest': 380,
  'Choco Fudge': 390,
  'Choco Truffle': 410,
  'Choco Oreo': 410,
  'Choco Caramel': 420,
  'Death by Chocolate': 450,
  'Red Velvet': 470,
  'Lotus Biscoff': 480,
  'Choco Pistachio': 480,
};

const getFlavorPrice = (flavor) => {
  if (flavor?.price) return Number(flavor.price);
  if (flavor?.name && BENTO_FLAVOR_PRICES[flavor.name]) return BENTO_FLAVOR_PRICES[flavor.name];
  return 0;
};

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

const getDisplayFlavor = (item) => {
  if (item.isCustomCake) return item.selectedFlavor || 'Custom';
  const flavor = item.selectedFlavor;
  if (!flavor || flavor.toLowerCase() === 'standard') {
    const cat = Array.isArray(item.category) ? item.category.join(' ').toLowerCase() : String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (cat.includes('chocolate') || name.includes('chocolate') || name.includes('forest') || name.includes('fudge') || name.includes('truffle') || name.includes('oreo') || name.includes('caramel')) return 'Chocolate';
    if (cat.includes('vanilla') || name.includes('vanilla') || name.includes('pineapple') || name.includes('butterscotch') || name.includes('strawberry') || name.includes('blueberry') || name.includes('biscoff') || name.includes('jamun') || name.includes('gulkand') || name.includes('rasmalai') || name.includes('honey') || name.includes('almond') || name.includes('lychee') || name.includes('rose')) return 'Vanilla';
    if (cat.includes('red-velvet') || cat.includes('red velvet') || name.includes('red-velvet') || name.includes('red velvet')) return 'Red Velvet';
    if (cat.includes('bento') || name.includes('bento')) return 'Bento';
    return 'Standard';
  }
  return flavor;
};

// Order Details Modal – High Contrast, Readable Typography, Full Product & Location Details
const OrderDetailsModal = ({ order, onClose }) => {
  const [expandedItems, setExpandedItems] = useState({});
  if (!order) return null;

  const toggleItemExpand = (index) => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));

  // Build Google Maps directions link
  const mapsUrl = (order.address?.lat && order.address?.lng)
    ? `https://www.google.com/maps/search/?api=1&query=${order.address.lat},${order.address.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.address?.houseNo, order.address?.street, order.address?.city, order.address?.pincode].filter(Boolean).join(', '))}`;

  const formattedOrderTime = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md overflow-y-auto p-3 sm:p-4 cursor-pointer" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card text-foreground border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden max-h-[92vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-border/60 sticky top-0 bg-card/95 backdrop-blur-md z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-heading text-xl sm:text-2xl tracking-tight">Order Details</h3>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs font-bold text-muted mt-1 flex items-center gap-2">
              <span>#{order.orderNumber || order._id}</span>
              {order.trackingCode && <span className="px-2 py-0.5 rounded-full bg-border/40 text-heading text-[11px] font-mono font-bold">Track: {order.trackingCode}</span>}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-border/20 hover:bg-border/40 text-heading flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          
          {/* SECTION 1: CUSTOMER & DELIVERY ADDRESS */}
          <div className="p-4 sm:p-5 bg-card-soft border border-border/60 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/40">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <User size={16} /> Customer & Delivery Details
              </h4>
              
              {/* Call Customer Button */}
              {order.address?.phone && (
                <a
                  href={`tel:${order.address.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <Phone size={13} /> Call Customer
                </a>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-base font-extrabold text-heading">{order.address?.fullName || 'N/A'}</p>
              <p className="text-sm font-semibold text-muted font-mono">{order.address?.phone || 'No phone provided'}</p>
            </div>

            {/* Address & Google Maps Link */}
            <div className="pt-2 border-t border-border/30 space-y-2.5">
              <div className="flex items-start gap-2 text-xs font-medium text-heading/90 leading-relaxed">
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <span>
                  {[order.address?.houseNo, order.address?.street, order.address?.landmark && `Landmark: ${order.address.landmark}`, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Google Maps Location Button */}
              <div className="pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <MapPin size={14} className="animate-bounce" /> Open Location in Google Maps 🗺️
                </a>
              </div>
            </div>

            {/* Delivery Schedule & Order Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/40 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/40">
                <Calendar size={15} className="text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted block">Delivery Date</span>
                  <span className="font-extrabold text-heading">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/40">
                <Clock size={15} className="text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted block">Time Slot</span>
                  <span className="font-extrabold text-heading">{order.deliverySlot || 'Standard'}</span>
                </div>
              </div>

              {formattedOrderTime && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/40">
                  <Hash size={15} className="text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted block">Order Placed</span>
                    <span className="font-extrabold text-heading text-[11px]">{formattedOrderTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: ORDERED ITEMS */}
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <ShoppingBag size={16} /> Order Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-3">
              {order.items?.map((item, idx) => {
                const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
                const origUnitPrice = Number(item.price || 0);
                const total = finalUnitPrice * item.qty;
                const resolvedFlavor = getDisplayFlavor(item);
                const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';

                return (
                  <div key={idx} className="border border-border/60 rounded-2xl p-4 bg-card-soft/40 shadow-xs space-y-3">
                    <div className="flex gap-3 sm:gap-4 items-start">
                      {item.image && item.image !== 'none' ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border/40 shrink-0 bg-surface" />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface border border-border/40 shrink-0 flex items-center justify-center">
                          <Cake size={24} className="text-muted" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-heading text-base break-words">{item.name}</h5>
                            {item.sku && <span className="inline-block px-2 py-0.5 rounded bg-border/40 text-[10px] font-mono font-bold text-muted mt-1">{item.sku}</span>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-heading text-base">{formatCurrency(total)}</p>
                            <p className="text-xs text-muted font-medium">{formatCurrency(finalUnitPrice)} each</p>
                          </div>
                        </div>

                        {/* Variant Badges (Qty, Flavor, Weight) */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2.5 py-1 rounded-lg bg-card border border-border/50 text-xs font-extrabold text-heading">
                            Qty: {item.qty}
                          </span>

                          {showFlavor && (
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-extrabold text-primary">
                              Flavor: {item.isCustomCake ? (item.customDetails?.flavour || resolvedFlavor) : resolvedFlavor}
                            </span>
                          )}

                          {item.selectedWeight && (
                            <span className="px-2.5 py-1 rounded-lg bg-card border border-border/50 text-xs font-extrabold text-heading">
                              Weight: {item.selectedWeight}
                            </span>
                          )}
                        </div>

                        {/* Add-ons List */}
                        {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                          <div className="mt-3 p-2.5 bg-card border border-border/50 rounded-xl space-y-1 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Included Add-ons:</span>
                            {item.addons.map((addon, aIdx) => (
                              <div key={aIdx} className="flex justify-between items-center text-heading font-medium">
                                <span>+ {addon.name} (x{addon.qty || 1})</span>
                                <span className="font-bold">{formatCurrency(Number(addon.price || 0) * (addon.qty || 1))}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Custom Details Toggle */}
                        {item.customDetails && (
                          <button 
                            onClick={() => toggleItemExpand(idx)} 
                            className="text-xs text-primary flex items-center gap-1.5 mt-3 font-extrabold hover:underline cursor-pointer"
                          >
                            {expandedItems[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expandedItems[idx] ? 'Hide Custom Cake Details' : 'View Custom Cake Details ✨'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Custom Details Box */}
                    {expandedItems[idx] && item.customDetails && (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-2 text-heading">
                        <div className="grid grid-cols-2 gap-2">
                          {item.customDetails.designTheme && <p><span className="font-bold text-muted">Theme:</span> <span className="font-extrabold">{item.customDetails.designTheme}</span></p>}
                          {item.customDetails.flavour && <p><span className="font-bold text-muted">Flavor:</span> <span className="font-extrabold">{item.customDetails.flavour}</span></p>}
                          {item.customDetails.weight && <p><span className="font-bold text-muted">Weight:</span> <span className="font-extrabold">{item.customDetails.weight}</span></p>}
                          {item.customDetails.tiers && <p><span className="font-bold text-muted">Tiers:</span> <span className="font-extrabold">{item.customDetails.tiers}</span></p>}
                          {item.customDetails.eggless && <p><span className="font-bold text-muted">Eggless:</span> <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Yes 🌿</span></p>}
                          {item.customDetails.lessSugar && <p><span className="font-bold text-muted">Less Sugar:</span> <span className="font-extrabold">Yes</span></p>}
                        </div>

                        {item.customDetails.messageOnCake && (
                          <div className="pt-2 border-t border-primary/15">
                            <span className="font-bold text-muted block mb-0.5">🎂 Message on Cake:</span>
                            <span className="font-black text-sm text-primary bg-card px-3 py-1.5 rounded-lg border border-primary/20 inline-block">
                              "{item.customDetails.messageOnCake}"
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PAYMENT SUMMARY */}
          <div className="p-4 sm:p-5 bg-card-soft border border-border/60 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
              <CreditCard size={16} /> Payment & Billing Summary
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-medium">
                <span className="text-muted">Subtotal</span>
                <span className="font-extrabold text-heading">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="font-extrabold">-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium">
                <span className="text-muted">Delivery Charge</span>
                <span className="font-extrabold text-heading">{formatCurrency(order.deliveryCharge)}</span>
              </div>

              {order.convenienceFee > 0 && (
                <div className="flex justify-between font-medium">
                  <span className="text-muted">Convenience Fee (2.5%)</span>
                  <span className="font-extrabold text-heading">{formatCurrency(order.convenienceFee)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium text-xs text-muted">
                <span>GST (18%)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Inclusive</span>
              </div>

              <div className="flex justify-between font-black text-lg pt-3 border-t border-border/50">
                <span className="text-heading">Grand Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Method & Status Badges */}
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Payment Method:</span>
                <span className="px-2.5 py-1 rounded-lg bg-card border border-border/50 font-black uppercase text-heading">
                  {order.paymentMethod || 'ONLINE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Payment Status:</span>
                <span className={`px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

// ===================== CREATE IN-SHOP ORDER VIEW =====================
const CreateInShopOrderView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setSearchLoading(true);
        const res = await productService.getAll({ limit: 1000 });
        const data = res.data?.data?.products || res.data?.data || res.data?.products || [];
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load products:', err);
        toast.error('Failed to load products');
      } finally {
        setSearchLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const displayedProducts = searchQuery.trim()
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProducts;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleProductClick = (product) => {
    const isCake = Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('cake')) : (product?.category || '').toLowerCase().includes('cake');
    const isBento = (Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('bento')) : (product?.category || '').toLowerCase().includes('bento')) || product?.cakeType?.toLowerCase().includes('bento');

    if (product.hasVariants && product.variants?.length > 0) {
      setSelectedProductForVariant({ type: 'variants', product });
    } else if (isCake && product.flavors?.length > 0) {
      setSelectedProductForVariant({ type: 'flavors', product, isBento });
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product, flavor = null, weight = null, exactPrice = null) => {
    const productId = product._id?.$oid || product._id;
    const existingIdx = cart.findIndex(
      (item) => item.productId === productId && item.selectedFlavor === flavor && item.selectedWeight === weight
    );

    if (existingIdx !== -1) {
      const newCart = [...cart];
      newCart[existingIdx].qty += 1;
      setCart(newCart);
    } else {
      const safePrice = product.price || 0;
      let price = product.offerPrice && product.offerPrice < safePrice ? product.offerPrice : safePrice;
      
      if (exactPrice !== null) {
        price = exactPrice;
      } else if (product.hasVariants && product.variants && flavor && weight) {
        const variant = product.variants.find(v => v.flavor === flavor && v.weight === weight);
        if (variant) price = variant.price;
      }

      setCart([...cart, {
        productId: productId,
        name: product.name,
        price: price,
        qty: 1,
        image: product.image || '',
        selectedFlavor: flavor,
        selectedWeight: weight,
        category: Array.isArray(product.category) ? product.category.join(', ') : (product.category || 'General')
      }]);
    }
    setSearchQuery('');
    toast.success(`${product.name} added to order`);
  };

  const updateCartQty = (index, delta) => {
    const updated = [...cart];
    updated[index].qty = Math.max(1, updated[index].qty + delta);
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) return toast.error('Please enter customer name');
    if (!customerPhone.trim()) return toast.error('Please enter customer phone');
    if (cart.length === 0) return toast.error('Please add at least one item');
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) return toast.error('Phone must be 10 digits');

    try {
      setPlacing(true);
      const res = await staffService.createInShopOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart,
        notes: notes.trim()
      });
      toast.success(`In-shop order #${res.data.data.orderNumber} created!`);
      navigate('/staff/orders/in-shop-history');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-heading">New In-Shop Order</h2>
          <p className="text-sm text-muted mt-1">Create an order for walk-in customers. Payment collected at counter.</p>
        </div>
        <Link to="/staff/orders/in-shop-history">
          <Button variant="outline" icon={Store} size="sm">View History</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Product Search & Cart */}
        <div className="lg:col-span-3 space-y-5">
          {/* Product Search */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-sm text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
              <Search size={16} className="text-secondary" /> Search Products
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full px-4 py-3 bg-input border border-input-border rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all text-sm"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            {/* Product List Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 mt-4">
              {displayedProducts.map(product => {
                const price = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
                return (
                  <motion.button
                    whileHover={{ y: -2 }}
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className="flex flex-col items-center p-3 bg-card-soft border border-border/30 rounded-xl hover:border-secondary/50 hover:bg-secondary/5 transition-all text-center group relative"
                  >
                    {product.hasVariants || (product.flavors && product.flavors.length > 0) ? (
                      <span className="absolute top-2 right-2 bg-secondary text-background text-[9px] font-black px-1.5 py-0.5 rounded-md">VARIANTS</span>
                    ) : null}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover mb-2 border border-border/20 group-hover:shadow-md transition-shadow" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-border/20 flex items-center justify-center mb-2">
                        <Package size={24} className="text-muted" />
                      </div>
                    )}
                    <p className="font-bold text-xs text-heading line-clamp-2 min-h-[32px]">{product.name}</p>
                    <p className="font-black text-sm text-primary mt-1">{formatCurrency(price)}</p>
                  </motion.button>
                )
              })}
              {displayedProducts.length === 0 && !searchLoading && (
                <div className="col-span-full py-10 text-center text-muted">
                  <Package size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-sm text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShoppingCart size={16} className="text-secondary" /> Order Items ({cart.length})
            </h3>
            {cart.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No items added yet</p>
                <p className="text-xs mt-1">Search for products above to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <motion.div
                    key={`${item.productId}-${item.selectedFlavor}-${item.selectedWeight}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-card-soft border border-border/30 rounded-xl"
                  >
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-border/20" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-heading truncate">{item.name}</p>
                      {(item.selectedFlavor || item.selectedWeight) && (
                        <p className="text-[10px] text-primary font-bold">
                          {item.selectedFlavor} {item.selectedFlavor && item.selectedWeight ? '·' : ''} {item.selectedWeight}
                        </p>
                      )}
                      <p className="text-xs text-muted">{formatCurrency(item.price)} each</p>
                    </div>
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateCartQty(idx, -1)} className="w-7 h-7 rounded-lg bg-border/40 hover:bg-border flex items-center justify-center transition-colors text-heading">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-black text-sm text-heading">{item.qty}</span>
                      <button onClick={() => updateCartQty(idx, 1)} className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-secondary">
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-black text-sm text-heading w-20 text-right">{formatCurrency(item.price * item.qty)}</p>
                    <button onClick={() => removeFromCart(idx)} className="p-1.5 hover:bg-error/10 rounded-lg transition-colors text-error">
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Info & Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-sm text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} className="text-secondary" /> Customer Info
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full px-4 py-2.5 bg-input border border-input-border rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">Phone *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-input border border-input-border rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-input border border-input-border rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-black text-sm text-heading uppercase tracking-widest mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-heading">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">GST (18%)</span>
                <span className="font-semibold text-heading">{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-semibold text-success">FREE</span>
              </div>
              <div className="flex justify-between font-black pt-3 border-t border-border text-lg">
                <span className="text-heading">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-xl">
              <p className="text-xs text-warning font-bold flex items-center gap-1.5">
                <CreditCard size={14} /> Payment collected at counter
              </p>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            variant="primary"
            className="w-full py-4 text-base rounded-2xl"
            onClick={handlePlaceOrder}
            loading={placing}
            disabled={cart.length === 0 || placing}
            icon={CheckCircle}
          >
            Place In-Shop Order
          </Button>
        </div>
      </div>

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {selectedProductForVariant && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-black text-heading mb-1">{selectedProductForVariant.product.name}</h3>
              <p className="text-xs text-muted mb-4">Select a flavor {selectedProductForVariant.type === 'variants' ? 'and weight' : ''} variant</p>
              
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {selectedProductForVariant.type === 'variants' && selectedProductForVariant.product.variants.map((v, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      addToCart(selectedProductForVariant.product, v.flavor, v.weight, v.price);
                      setSelectedProductForVariant(null);
                    }} 
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-input/50 border border-input-border hover:bg-secondary/10 hover:border-secondary/40 transition-all text-left group"
                  >
                    <div>
                      <p className="font-bold text-sm text-heading group-hover:text-secondary transition-colors">{v.flavor}</p>
                      <p className="text-[10px] text-muted font-medium">{v.weight}</p>
                    </div>
                    <p className="font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{formatCurrency(v.price)}</p>
                  </button>
                ))}

                {selectedProductForVariant.type === 'flavors' && selectedProductForVariant.product.flavors.map((f, idx) => {
                  const safePrice = selectedProductForVariant.product.price || 0;
                  const basePrice = selectedProductForVariant.product.offerPrice && selectedProductForVariant.product.offerPrice < safePrice ? selectedProductForVariant.product.offerPrice : safePrice;
                  const finalPrice = basePrice + getFlavorPrice(f);
                  const weight = selectedProductForVariant.isBento ? '250g' : '500g';
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        addToCart(selectedProductForVariant.product, f.name, weight, finalPrice);
                        setSelectedProductForVariant(null);
                      }} 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-input/50 border border-input-border hover:bg-secondary/10 hover:border-secondary/40 transition-all text-left group"
                    >
                      <div>
                        <p className="font-bold text-sm text-heading group-hover:text-secondary transition-colors">{f.name}</p>
                        <p className="text-[10px] text-muted font-medium">{weight}</p>
                      </div>
                      <p className="font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{formatCurrency(finalPrice)}</p>
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setSelectedProductForVariant(null)} 
                className="w-full mt-4 p-3 rounded-xl bg-error/10 text-error hover:bg-error/20 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ confirmedOrders: 0, outForDeliveryOrders: 0, deliveredOrders: 0, inShopOrdersCount: 0 });
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

    socketRef.current = io(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'), {
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
    if (path.includes('orders/create-inshop')) return 'create-inshop';
    if (path.includes('orders/in-shop-history')) return 'in-shop-history';
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
      } else if (pageType === 'in-shop-history') {
        const res = await staffService.getInShopOrders();
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
      { id: 'inshop', label: 'In-Shop Orders', icon: Store, count: stats.inShopOrdersCount, color: 'text-warning', bg: 'bg-warning/10', path: '/staff/orders/in-shop-history' },
    ];
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {summaryItems.map((item) => (
            <Link key={item.id} to={item.path} className="group">
              <motion.div whileHover={{ y: -5 }} className="bg-card border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} ${item.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-[10px] sm:text-xs font-black text-muted uppercase tracking-widest truncate">{item.label}</h3>
                <p className="text-2xl sm:text-3xl font-black text-heading mt-1">{item.count || 0}</p>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  VIEW ALL →
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        {/* Quick Action: Create In-Shop Order */}
        <Link to="/staff/orders/create-inshop">
          <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 p-6 rounded-3xl flex items-center gap-6 cursor-pointer hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl shadow-sm flex items-center justify-center text-secondary">
              <ShoppingCart size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-heading uppercase tracking-tight">Create In-Shop Order</h4>
              <p className="text-xs text-muted font-medium mt-1">Record a walk-in customer order. Payment collected at counter — no online payment needed.</p>
            </div>
            <ChevronDown size={20} className="text-muted -rotate-90" />
          </motion.div>
        </Link>
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

  // ===================== CREATE IN-SHOP ORDER VIEW =====================
  if (pageType === 'create-inshop') {
    return <CreateInShopOrderView />;
  }

  // ===================== IN-SHOP HISTORY VIEW =====================
  if (pageType === 'in-shop-history') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-heading">In-Shop Order History</h2>
          <div className="flex gap-2">
            <Link to="/staff/orders/create-inshop">
              <Button variant="primary" icon={ShoppingCart}>New Order</Button>
            </Link>
            <Button variant="outline" icon={RefreshCw} onClick={fetchData} loading={loading}>Refresh</Button>
          </div>
        </div>
        {loading ? <TableSkeleton rows={3} cols={1} /> : orders.length === 0 ? (
          <EmptyState icon={Store} title="No in-shop orders yet" message="Create your first in-shop order using the button above." />
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
                  className="bg-card border-t-4 border-t-warning rounded-2xl shadow-card border border-border/50 p-6 relative group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Badge variant="secondary" className="mb-2 text-[10px] tracking-widest bg-warning/10 text-warning border-warning/30">IN-SHOP</Badge>
                      <h3 className="font-black text-xl text-heading">#{order.orderNumber}</h3>
                      <p className="text-[9px] text-muted font-mono mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted uppercase tracking-widest">Total</span>
                      <p className="font-black text-primary text-xl leading-tight">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <div className="mb-3 p-3 bg-card-soft rounded-xl border border-border/30">
                    <p className="font-black text-xs uppercase tracking-widest text-secondary mb-1">Customer</p>
                    <p className="font-bold text-sm text-heading truncate">{order.address?.fullName}</p>
                    <p className="text-xs text-muted">{order.address?.phone}</p>
                  </div>
                  <div className="space-y-2 mb-4 max-h-36 overflow-y-auto custom-scrollbar pr-1 flex-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-border/10 rounded-lg text-sm border border-transparent">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-sm text-heading">{item.name}</p>
                          <p className="text-[10px] text-muted">{item.qty}x · {formatCurrency(item.price)} each</p>
                        </div>
                        <p className="font-black text-xs ml-2 shrink-0 text-heading">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted uppercase tracking-widest">Payment</span>
                      <span className="text-xs font-bold text-heading">In-Shop · <span className="text-success">Paid</span></span>
                    </div>
                    {order.createdByStaff && (
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-muted uppercase tracking-widest">Staff</span>
                        <span className="text-xs font-bold text-heading">{order.createdByStaff?.name || 'Staff'}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
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
                          <p className="text-[10px] text-muted">{item.qty}x · {getDisplayFlavor(item)}{item.selectedWeight && ` · ${item.selectedWeight}`}</p>
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
                  <a 
                    href={`${import.meta.env.VITE_API_URL}/staff/orders/${order._id}/kot/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-border/20 rounded-2xl hover:bg-secondary/10 transition-colors text-heading shrink-0 flex items-center justify-center" 
                    title="Print KOT"
                  >
                    <ChefHat size={18} />
                  </a>
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