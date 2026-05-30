import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  X,
  Tag,
  Cake,
  MapPin,
  User,
  Phone,
  Home,
  Navigation,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Star,
  Package,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Edit,
  Trash2,
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { clearCart, setCoupon } from '../redux/slices/cartSlice';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import MapSelector from '../components/MapSelector';
import ScooterLoader from '../components/ScooterLoader';
import Button from '../components/ui/Button';

import { formatCurrency, getCouponUnitDiscount, normalizeCartCoupon } from '../utils/helpers';
import {
  loadCustomCakeRequest,
  formatCustomCakeNotes,
  clearCustomCakeRequest,
} from '../utils/customCake';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const paymentLogos = {
  cards: {
    visa:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Visa_Inc._logo.svg",

    mastercard:
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",

    rupay:
      "https://commons.wikimedia.org/wiki/Special:FilePath/RuPay.svg",
  },

  upi: {
    gpay:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Google%20Pay%20Logo.svg",

    phonepe:
      "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg",

    paytm:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Paytm_logo.png",
  },

  banking: {
    sbi:
      "https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg",

    hdfc:
      "https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg",

    icici:
      "https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg",
  },

  razorpay:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Razorpay%20logo.svg",
};

/* ─────────────────────────────────────────────
   PAYMENT METHOD CONFIG
   `rzpMethod` maps exactly to Razorpay's `method` param:
     'card' | 'upi' | 'netbanking' | 'wallet'
   Razorpay will pre-select the tab when this is passed in options.
───────────────────────────────────────────── */
const PAYMENT_METHODS = [
  {
    id: 'card',
    rzpMethod: 'card',
    label: 'Credit / Debit Card',
    sub: 'Visa · Mastercard · RuPay',
    icon: CreditCard,
    gradient: 'from-violet-600 to-indigo-600',
    bg: 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20',
    border: 'border-violet-200 dark:border-violet-500/30',
    ring: 'ring-violet-400',
    logos: [
      { name: 'Visa', url: paymentLogos.cards.visa },
      { name: 'Mastercard', url: paymentLogos.cards.mastercard },
      { name: 'RuPay', url: paymentLogos.cards.rupay },
    ],
  },
  {
    id: 'upi',
    rzpMethod: 'upi',
    label: 'UPI Payment',
    sub: 'GPay · PhonePe · Paytm · BHIM',
    icon: Smartphone,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    ring: 'ring-emerald-400',
    logos: [
      { name: 'GPay', url: paymentLogos.upi.gpay },
      { name: 'PhonePe', url: paymentLogos.upi.phonepe },
      { name: 'Paytm', url: paymentLogos.upi.paytm },
    ],
  },
  {
    id: 'netbanking',
    rzpMethod: 'netbanking',
    label: 'Net Banking',
    sub: 'SBI · HDFC · ICICI · Axis & more',
    icon: Landmark,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    border: 'border-amber-200 dark:border-amber-500/30',
    ring: 'ring-amber-400',
    logos: [
      { name: 'SBI', url: paymentLogos.banking.sbi },
      { name: 'HDFC', url: paymentLogos.banking.hdfc },
      { name: 'ICICI', url: paymentLogos.banking.icici },
    ],
  },
];

/* ─────────────────────────────────────────────
   SLOT CONFIG
───────────────────────────────────────────── */
const slots = [
  { value: '10am-1pm', label: '10 AM – 1 PM', emoji: '🌅', endHour: 13, endMinute: 0 },
  { value: '1pm-4pm', label: '1 PM – 4 PM', emoji: '☀️', endHour: 16, endMinute: 0 },
  { value: '4pm-7pm', label: '4 PM – 7 PM', emoji: '🌇', endHour: 19, endMinute: 0 },
  { value: '7pm-10pm', label: '7 PM – 10 PM', emoji: '🌙', endHour: 22, endMinute: 0 },
];

/* ─────────────────────────────────────────────
   STEP BADGE
───────────────────────────────────────────── */
const StepBadge = ({ n, label, isActive, isCompleted, onEdit, summary }) => (
  <div
    onClick={isCompleted && !isActive ? onEdit : undefined}
    className={`flex items-center gap-3 p-4 sm:p-5 border-b border-border/30 transition-all duration-300 ${isActive ? 'bg-primary/5' : 'bg-transparent'
      } ${isCompleted && !isActive ? 'cursor-pointer hover:bg-muted/5' : ''}`}
  >
    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm shrink-0 transition-all duration-300 ${isCompleted && !isActive ? 'bg-success text-white' : isActive ? 'bg-primary text-button-text' : 'bg-muted/20 text-muted'
      }`}>
      {isCompleted && !isActive ? <ShieldCheck size={14} /> : n}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className={`font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-primary text-sm sm:text-base' : 'text-muted text-xs sm:text-sm'
          }`}>
          {label}
        </h2>
        {isCompleted && !isActive && (
          <button
            className="text-xs font-black text-primary uppercase tracking-widest hover:underline px-3 py-1 bg-primary/5 rounded-lg border border-primary/20"
          >
            Change
          </button>
        )}
      </div>
      {isCompleted && !isActive && summary && (
        <p className="text-xs text-muted font-bold mt-1 truncate uppercase tracking-tight">{summary}</p>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const Checkout = () => {
  const dispatch = useDispatch();
  const cartItemsFromRedux = useSelector((state) => state.cart.items);
  const appliedCouponFromRedux = useSelector((state) => state.cart.appliedCoupon);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const directItem = location.state?.directItem;
  const [localCoupon, setLocalCoupon] = useState('');

  const appliedCouponDisplay = directItem
    ? normalizeCartCoupon(localCoupon)
    : normalizeCartCoupon(appliedCouponFromRedux);
  const hasAppliedCoupon = appliedCouponDisplay !== '';

  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Auto-scroll to active step
  useEffect(() => {
    const activeEl = document.querySelector(`[data-step="${activeStep}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);
  const [loaderText, setLoaderText] = useState('Preparing your order...');
  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState(null);

  const isProcessingPayment = useRef(false);

  const [deliveryInfo, setDeliveryInfo] = useState({ address: null, position: null });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(new Date());

  const [addressDetails, setAddressDetails] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    houseNo: '',
    street: '',
  });

  const SHOP_LAT = import.meta.env.VITE_SHOP_LAT || 11.004540031168712;
  const SHOP_LNG = import.meta.env.VITE_SHOP_LNG || 76.97510955713153;
  const DELIVERY_RADIUS = import.meta.env.VITE_DELIVERY_RADIUS_KM || 30;

  const [locationValid, setLocationValid] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [deliverySlot, setDeliverySlot] = useState(null);
  const [customCakeRequest, setCustomCakeRequest] = useState(null);
  const [orderNotesExtra, setOrderNotesExtra] = useState('');

  /* ── backend confirmed total (avoids client-side drift) ── */
  const [backendTotal, setBackendTotal] = useState(null);

  useEffect(() => {
    const saved = loadCustomCakeRequest();
    if (saved && typeof saved === 'object') setCustomCakeRequest(saved);
  }, []);

  const isSlotAvailableForDate = (slot, date) => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (selectedDate > currentDate) return true;
    const currentTimeDecimal = now.getHours() + now.getMinutes() / 60;
    return currentTimeDecimal < slot.endHour - 1;
  };

  const getSlotsWithAvailability = () => {
    const todaySlots = slots.map((slot) => ({
      ...slot,
      available: isSlotAvailableForDate(slot, deliveryDate),
    }));
    const hasAvailable = todaySlots.some((s) => s.available);
    if (!hasAvailable && deliveryDate.toDateString() === new Date().toDateString()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(tomorrow);
      return slots.map((slot) => ({ ...slot, available: true }));
    }
    return todaySlots;
  };

  const availableSlots = getSlotsWithAvailability();

  useEffect(() => {
    const first = availableSlots.find((s) => s.available);
    setDeliverySlot(first ? first.value : null);
  }, [deliveryDate]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const validate = async () => {
      if (!deliveryInfo.position || deliveryInfo.position.lat === undefined || deliveryInfo.position.lng === undefined) return;
      const dist = calculateDistance(
        SHOP_LAT,
        SHOP_LNG,
        deliveryInfo.position.lat,
        deliveryInfo.position.lng
      );
      setDistance(dist);
      setDeliveryFee(Math.max(30, Math.round(dist * 4)));
      if (dist > DELIVERY_RADIUS) {
        setLocationValid(false);
        setLocationError('Delivery available only inside Coimbatore service area (within 30km).');
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${deliveryInfo.position.lat}&lon=${deliveryInfo.position.lng}`
        );
        const data = await res.json();
        if (!(data.display_name || '').toLowerCase().includes('coimbatore')) {
          setLocationValid(false);
          setLocationError('Delivery available only inside Coimbatore service area.');
          return;
        }
        setLocationValid(true);
        setLocationError('');
      } catch {
        setLocationValid(true);
      }
    };
    validate();
  }, [deliveryInfo.position]);

  const cartItems = directItem ? [directItem] : cartItemsFromRedux;

  const getItemOriginalPrice = (item) => {
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    if (!Number.isNaN(vp) && vp > 0) return vp;
    return Number(item.price);
  };

  const getItemBasePrice = (item) => {
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    if (!Number.isNaN(vp) && vp > 0) return vp;

    const hasOffer =
      item.offerPrice != null &&
      Number(item.offerPrice) > 0 &&
      Number(item.offerPrice) < Number(item.price);
    return hasOffer ? Number(item.offerPrice) : Number(item.price);
  };

  const getItemCouponDiscount = (item) => {
    const code = directItem
      ? normalizeCartCoupon(localCoupon)
      : normalizeCartCoupon(appliedCouponFromRedux);
    if (!code || !item.coupon?.enabled) return 0;
    if (code !== normalizeCartCoupon(item.coupon.code)) return 0;
    return getCouponUnitDiscount(getItemBasePrice(item), item.coupon);
  };

  const getFinalItemPrice = (item) => getItemBasePrice(item) - getItemCouponDiscount(item);

  /* ── client-side estimates for display only ── */
  const subtotal = cartItems.reduce((s, i) => s + getFinalItemPrice(i) * i.qty, 0);
  const originalTotal = cartItems.reduce((s, i) => s + getItemOriginalPrice(i) * i.qty, 0);
  const offerDiscount = cartItems.reduce(
    (s, i) => s + (getItemOriginalPrice(i) - getItemBasePrice(i)) * i.qty,
    0
  );
  const couponDiscount = cartItems.reduce((s, i) => s + getItemCouponDiscount(i) * i.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const convenienceFee = Math.round(subtotal * 0.02);
  /* ── display total: prefer backend confirmed, fallback to client estimate ── */
  const clientTotal = subtotal + deliveryFee + gst + convenienceFee;
  const displayTotal = backendTotal !== null ? backendTotal : clientTotal;

  const isAddressSelected = !!deliveryInfo.position;

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        setSavedAddresses(res.data.data);
        const def = res.data.data.find((a) => a.isDefault);
        if (def) handleSelectAddress(def);
      } catch { }
    };
    if (user) fetchAddresses();
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setEditingAddressId(null); // Reset editing mode when selecting
    setDeliveryInfo({
      address: `${addr.houseNo}, ${addr.street}, ${addr.city}`,
      position: { lat: addr.lat, lng: addr.lng },
    });
    setAddressDetails({
      fullName: addr.fullName,
      phone: addr.phone,
      houseNo: addr.houseNo,
      street: addr.street,
    });
    setActiveStep(2); // Auto-advance to Slot selection
  };

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this address?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/users/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedAddresses(prev => prev.filter(a => a._id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    setEditingAddressId(addr._id);
    setSelectedAddressId(addr._id); // Highlight it
    setAddressDetails({
      fullName: addr.fullName,
      phone: addr.phone,
      houseNo: addr.houseNo,
      street: addr.street,
    });
    setDeliveryInfo({
      address: `${addr.houseNo}, ${addr.street}`,
      position: { lat: addr.lat, lng: addr.lng }
    });
    toast.success('Update the details in the form below');
  };

  const handleUpdateAddress = async () => {
    if (!addressDetails.fullName.trim()) return toast.error('Full name is required');
    if (!validatePhoneNumber(addressDetails.phone)) return toast.error('Valid 10-digit phone is required');
    if (!deliveryInfo.position) return toast.error('Please select location on map');

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await api.patch(`/users/addresses/${editingAddressId}`, {
        ...addressDetails,
        lat: deliveryInfo.position.lat,
        lng: deliveryInfo.position.lng,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSavedAddresses(prev => prev.map(a => a._id === editingAddressId ? data : a));
      setEditingAddressId(null);
      toast.success('Address updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverHere = () => {
    if (!addressDetails.fullName.trim()) return toast.error('Please enter recipient name');
    if (!validatePhoneNumber(addressDetails.phone)) return toast.error('Please enter a valid 10-digit phone number');
    if (!deliveryInfo.position) return toast.error('Please select delivery location on map');
    if (!locationValid) return toast.error(locationError || 'Location outside service area');
    setActiveStep(2);
  };

  const handleSlotConfirmed = () => {
    if (!deliverySlot) return toast.error('Please select a delivery slot');
    setActiveStep(3);
  };

  const validatePhoneNumber = (p) => /^[0-9]{10}$/.test(p);

  const validateForm = () => {
    if (!addressDetails.fullName.trim()) { toast.error('Please enter full name'); return false; }
    if (!validatePhoneNumber(addressDetails.phone.trim())) { toast.error('Please enter a valid 10-digit phone number'); return false; }
    if (!deliveryInfo.position) { toast.error('Please select delivery location on map'); return false; }
    if (!deliverySlot) { toast.error('Please select a delivery slot'); return false; }
    const sel = slots.find((s) => s.value === deliverySlot);
    if (sel && !isSlotAvailableForDate(sel, deliveryDate)) { toast.error('Selected slot is no longer available.'); return false; }
    if (!locationValid) { toast.error(locationError || 'Location outside service area'); return false; }
    return true;
  };

  const handleApplyCoupon = async (presetCode) => {
    const code = (presetCode != null ? String(presetCode) : couponInput).trim().toUpperCase();
    if (!code) return toast.error('Enter coupon code');
    if (directItem) {
      if (directItem.coupon?.enabled && directItem.coupon.code.toUpperCase() === code) {
        setLocalCoupon(code);
        toast.success(`Coupon ${code} applied`);
        setCouponInput('');
      } else {
        toast.error('Invalid coupon for this item');
      }
      return;
    }
    const isValid = cartItemsFromRedux.some(
      (i) => normalizeCartCoupon(i.coupon?.code) === code
    );
    if (isValid) {
      dispatch(setCoupon(code));
      toast.success(`Coupon ${code} applied`);
      setCouponInput('');
    } else {
      toast.error('Invalid coupon for items in bag');
    }
  };

  const handleRemoveCoupon = () => {
    if (directItem) setLocalCoupon('');
    else dispatch(setCoupon(null));
    toast.success('Coupon removed');
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePlaceOrder = async () => {
    if (isProcessingPayment.current) { toast.error('Payment already in progress.'); return; }
    if (!validateForm()) return;

    const token = sessionStorage.getItem('token');
    if (!token) { toast.error('Session expired. Please login again.'); navigate('/login'); return; }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) { toast.error('Payment configuration error.'); return; }

    try {
      isProcessingPayment.current = true;
      setLoading(true);
      setLoaderText('Preparing your order...');

      const interval = setInterval(() => {
        setLoaderText((p) => {
          const m = ['Confirming address...', 'Calculating total...', 'Almost there...'];
          const i = m.indexOf(p) + 1;
          return i < m.length ? m[i] : p;
        });
      }, 2000);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        clearInterval(interval);
        setLoading(false);
        isProcessingPayment.current = false;
        toast.error('Payment gateway unavailable.');
        return;
      }

      const cakeMessage = customCakeRequest?.messageOnCake?.trim() || '';
      const builderNotes = customCakeRequest ? formatCustomCakeNotes(customCakeRequest) : '';
      const notesMerged = [builderNotes, orderNotesExtra.trim()].filter(Boolean).join('\n\n');

      const res = await api.post(
        '/payment/create-order',
        {
          address: {
            fullName: addressDetails.fullName,
            phone: addressDetails.phone,
            houseNo: addressDetails.houseNo,
            street: addressDetails.street || deliveryInfo.address,
            city: 'Coimbatore',
            pincode: '641001',
            lat: deliveryInfo.position?.lat,
            lng: deliveryInfo.position?.lng,
          },
          deliveryDate,
          deliverySlot,
          directItem: directItem
            ? {
              productId: directItem.productId,
              qty: directItem.qty,
              selectedFlavor: directItem.selectedFlavor,
              selectedWeight: directItem.selectedWeight,
              appliedCoupon: localCoupon,
            }
            : undefined,
          items: cartItemsFromRedux,
          discount: couponDiscount,
          couponCode: directItem ? localCoupon : appliedCouponFromRedux,
          notes: notesMerged || undefined,
          cakeMessage: cakeMessage || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpayOrder, orderId } = res.data.data;
      if (!razorpayOrder?.id) throw new Error('Invalid order response');

      /* ── Store backend-confirmed amount to show user exactly what Razorpay will charge ── */
      const confirmedAmount = razorpayOrder.amount / 100; // paise → rupees
      setBackendTotal(confirmedAmount);

      clearInterval(interval);
      setLoading(false);

      const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayMethod);

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "The Chocolate Mine",
        description: "Secure Order Payment",
        image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            setLoading(true);
            setLoaderText("Verifying payment...");
            await api.post(
              "/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (!directItem) {
              dispatch(clearCart());
            }
            clearCustomCakeRequest();
            setLoading(false);
            isProcessingPayment.current = false;
            toast.success("Payment successful! 🎉");
            navigate("/order-success", {
              state: { orderId },
            });
          } catch (e) {
            setLoading(false);
            isProcessingPayment.current = false;
            toast.error(
              e?.response?.data?.message ||
              "Verification failed. Contact support."
            );
          }
        },
        modal: {
          ondismiss: async () => {
            setLoading(false);
            isProcessingPayment.current = false;
            try {
              await api.post("/payment/log-failure", {
                orderId,
                reason: "User closed payment window",
              });
            } catch {}
            toast.error("Payment cancelled.");
          },
        },
        prefill: {
          name: addressDetails.fullName || user?.name || "",
          email: user?.email || "",
          contact: addressDetails.phone || user?.phone || "",
        },
        notes: {
          payment_for: "Cake Order",
        },
        theme: {
          color: "#4A2C2A",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
        },
        config: {
          display: {
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (r) => {
        setLoading(false);
        isProcessingPayment.current = false;
        try {
          await api.post('/payment/log-failure', {
            orderId,
            reason: r.error?.description || 'Payment failed',
          });
        } catch { }
        toast.error(`Payment failed: ${r.error?.description || 'Please try again'}`);
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      isProcessingPayment.current = false;
      if (err?.response?.status === 401) {
        toast.error('Session expired.');
        navigate('/login');
        return;
      }
      toast.error(err?.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setTimeout(() => {
        if (isProcessingPayment.current) {
          isProcessingPayment.current = false;
          setLoading(false);
          toast.error('Payment timed out. Try again.');
        }
      }, 60000);
    }
  };

  const availableCoupons = useMemo(() => {
    const s = new Set();
    cartItems.forEach((i) => { if (i.coupon?.enabled) s.add(i.coupon.code); });
    return Array.from(s);
  }, [cartItems]);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    // Automatically strip leading zero for Indian numbers if present
    if (val.length > 10 && val.startsWith('0')) {
      val = val.substring(1);
    }
    setAddressDetails({ ...addressDetails, phone: val.slice(0, 10) });
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isToday = deliveryDate.toDateString() === new Date().toDateString();

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-background">
      <ScooterLoader isVisible={loading} text={loaderText} />

      {/* ── TOP NAV ── */}
      <div className="bg-navbar text-navbar-text border-b border-border sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              onClick={() => navigate('/cart')}
              className="hover:text-primary transition-colors flex items-center gap-1 font-bold"
            >
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Cart</span><span className="sm:hidden">Cart</span>
            </button>
            <ChevronRight size={14} />
            <span className="font-black text-foreground">Checkout</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 w-full min-w-0">

          {/* ═══════════════════════════════════
              LEFT COLUMN
          ═══════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0">

            {/* ── STEP 1: DELIVERY ADDRESS ── */}
            <div data-step="1" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
              <StepBadge
                n="1"
                label="Delivery Address"
                isActive={activeStep === 1}
                isCompleted={!!deliveryInfo.position}
                onEdit={() => setActiveStep(1)}
                summary={deliveryInfo.position ? `${addressDetails.fullName} • ${addressDetails.phone}` : null}
              />
              <AnimatePresence>
                {activeStep === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">

                      {/* Saved addresses */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-heading font-black uppercase tracking-widest opacity-80">Saved Addresses</p>
                          <div className="grid gap-3 w-full min-w-0">
                            {savedAddresses.map((addr) => (
                              <div
                                key={addr._id}
                                onClick={() => handleSelectAddress(addr)}
                                className={`w-full min-w-0 text-left p-3 sm:p-4 border-2 rounded-2xl transition-all relative overflow-hidden group cursor-pointer ${selectedAddressId === addr._id
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border/30 hover:border-primary/30 bg-surface/20'
                                  }`}
                              >
                                <div className="flex justify-between items-start gap-2 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-black text-heading text-sm break-words">{addr.fullName}</span>
                                    <p className="text-xs text-muted font-bold mt-0.5">{addr.phone}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={(e) => handleEditAddress(e, addr)}
                                      className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                      title="Edit"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteAddress(e, addr._id)}
                                      className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted hover:text-error hover:border-error/30 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    {selectedAddressId === addr._id && (
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-button-text shadow shrink-0 border border-primary/20">
                                        <CheckCircle2 size={13} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs sm:text-sm text-muted font-medium mt-2 break-all leading-relaxed pr-8">
                                  {addr.houseNo}, {addr.street}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border/20" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-3 text-heading font-black uppercase tracking-widest">OR</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Map picker */}
                      <button
                        onClick={() => setShowMap(true)}
                        className="w-full p-3 sm:p-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-primary font-black text-sm uppercase tracking-widest hover:bg-primary/5 hover:border-primary/40 transition-all"
                      >
                        <MapPin size={15} /> Add / Update Location on Map
                      </button>

                      {deliveryInfo.position && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`w-full min-w-0 p-3 sm:p-4 rounded-2xl border flex items-start gap-3 ${locationValid
                            ? 'bg-success-light border-success/20'
                            : 'bg-error-light border-error/20'
                            }`}
                        >
                          <Navigation
                            size={15}
                            className={`mt-0.5 shrink-0 ${locationValid ? 'text-success-text' : 'text-error-text'}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-black uppercase tracking-widest ${locationValid ? 'text-success-text' : 'text-error-text'
                                }`}
                            >
                              {locationValid ? 'Delivery Location Set' : 'Outside Service Area'}
                            </p>
                            <p
                              className={`text-xs sm:text-sm font-medium mt-0.5 leading-relaxed break-all ${locationValid ? 'text-success-text' : 'text-error-text'
                                }`}
                            >
                              {locationValid ? deliveryInfo.address : locationError}
                            </p>
                            {locationValid && (
                              <p className="text-xs text-success-text font-bold mt-1">
                                {distance.toFixed(1)} km · Est. fee {formatCurrency(deliveryFee)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Name / Phone / Address fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-border/30">
                        {[
                          { label: 'Full Name *', icon: User, placeholder: 'Recipient name', key: 'fullName', onChange: (v) => setAddressDetails({ ...addressDetails, fullName: v }) },
                          { label: 'Phone Number *', icon: Phone, placeholder: '10-digit mobile', key: 'phone', onChange: null },
                          { label: 'House / Flat No. *', icon: Home, placeholder: 'Apartment, studio…', key: 'houseNo', onChange: (v) => setAddressDetails({ ...addressDetails, houseNo: v }) },
                          { label: 'Street / Landmark *', icon: MapPin, placeholder: 'Nearby building or area', key: 'street', onChange: (v) => setAddressDetails({ ...addressDetails, street: v }) },
                        ].map(({ label, icon: Icon, placeholder, key, onChange }) => (
                          <div key={key} className="space-y-1.5 sm:space-y-2">
                            <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                              <Icon size={12} /> {label}
                            </label>
                            <input
                              className="input-field text-sm sm:text-base min-w-0"
                              placeholder={placeholder}
                              value={addressDetails[key]}
                              onChange={key === 'phone' ? handlePhoneChange : (e) => onChange(e.target.value)}
                              type={key === 'phone' ? 'tel' : 'text'}
                              maxLength={key === 'phone' ? 10 : undefined}
                              inputMode={key === 'phone' ? 'numeric' : 'text'}
                            />
                            {key === 'phone' && addressDetails.phone && !validatePhoneNumber(addressDetails.phone) && (
                              <p className="text-[10px] sm:text-xs text-red-500 font-bold ml-1">Enter valid 10-digit number</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {locationValid && deliveryInfo.position && (
                        <div className="pt-4 flex justify-end gap-3">
                          {editingAddressId && (
                            <Button
                              onClick={handleUpdateAddress}
                              className="btn-secondary px-6 border-primary/20 text-primary"
                            >
                              Update Address
                            </Button>
                          )}
                          <Button onClick={handleDeliverHere} className="btn-primary px-8">
                            Deliver Here
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── STEP 2: DELIVERY SLOT ── */}
            <div data-step="2" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
              <StepBadge
                n="2"
                label="Delivery Date & Slot"
                isActive={activeStep === 2}
                isCompleted={!!deliverySlot}
                onEdit={() => setActiveStep(2)}
                summary={deliverySlot ? `${formatDate(deliveryDate)} • ${deliverySlot}` : null}
              />
              <AnimatePresence>
                {activeStep === 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">

                      {/* Date Selector */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const d = new Date(deliveryDate);
                            d.setDate(d.getDate() - 1);
                            if (d >= new Date(new Date().setHours(0, 0, 0, 0))) setDeliveryDate(d);
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-muted/10 transition text-muted shrink-0"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <div className="flex-1 text-center">
                          <p className="font-black text-heading text-sm uppercase tracking-widest">{formatDate(deliveryDate)}</p>
                          {isToday && (
                            <p className="text-[10px] text-primary font-bold mt-0.5 uppercase tracking-widest">Today</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const d = new Date(deliveryDate);
                            d.setDate(d.getDate() + 1);
                            setDeliveryDate(d);
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-muted/10 transition text-muted shrink-0"
                        >
                          <ChevronUp size={16} />
                        </button>
                      </div>

                      {/* Slot Grid — 2 cols on mobile, 4 on md+ */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => slot.available && setDeliverySlot(slot.value)}
                            disabled={!slot.available}
                            className={`relative p-3 sm:p-4 rounded-2xl border-2 transition-all text-center ${!slot.available
                              ? 'opacity-30 cursor-not-allowed border-border/10 bg-muted/5'
                              : deliverySlot === slot.value
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border/40 hover:border-primary/40 bg-surface/30'
                              }`}
                          >
                            <span className="text-lg sm:text-xl block mb-1">{slot.emoji}</span>
                            <p className="text-[9px] sm:text-[10px] font-black text-heading uppercase tracking-wide leading-tight">
                              {slot.label}
                            </p>
                            {!slot.available && (
                              <span className="text-[8px] text-muted font-bold uppercase tracking-widest mt-1 block">
                                Unavailable
                              </span>
                            )}
                            {deliverySlot === slot.value && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-primary/20">
                                <CheckCircle2 size={10} className="text-button-text" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="pt-4 flex justify-between gap-3">
                        <Button onClick={() => setActiveStep(1)} className="btn-secondary px-6">Back</Button>
                        <Button
                          onClick={handleSlotConfirmed}
                          disabled={!deliverySlot}
                          className="btn-primary px-8"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── STEP 3: ORDER SUMMARY (ITEMS) ── */}
            <div data-step="3" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
              <StepBadge
                n="3"
                label="Order Summary"
                isActive={activeStep === 3}
                isCompleted={activeStep > 3}
                onEdit={() => setActiveStep(3)}
                summary={`${cartItems.length} ${cartItems.length === 1 ? 'Item' : 'Items'}`}
              />
              <AnimatePresence>
                {activeStep === 3 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="divide-y divide-border/20">
                      {cartItems.map((item) => (
                        <div key={`${item.productId}-${item.selectedFlavor}-${item.selectedWeight}`} className="flex gap-4 p-4 sm:p-5">
                          <img src={item.image} className="w-16 h-16 rounded-2xl object-cover border border-border/10 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-heading uppercase tracking-tight truncate">{item.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.selectedFlavor && <span className="text-[11px] bg-card-soft text-muted font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Flavor: {item.selectedFlavor}</span>}
                              {item.selectedWeight && <span className="text-[11px] bg-card-soft text-muted font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Weight: {item.selectedWeight}</span>}
                            </div>
                            <p className="text-xs text-muted/60 font-black mt-2 uppercase tracking-widest">QTY {item.qty} × {formatCurrency(getFinalItemPrice(item))}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-heading text-sm">{formatCurrency(getFinalItemPrice(item) * item.qty)}</p>
                          </div>
                        </div>
                      ))}
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Custom Cake & Notes inside Summary */}
                        {customCakeRequest ? (
                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-black uppercase tracking-widest text-primary">From custom cake builder</p>
                              <Link to="/custom-cake" className="text-xs font-black uppercase tracking-widest text-accent hover:underline">Edit</Link>
                            </div>
                            <pre className="text-xs text-muted font-medium whitespace-pre-wrap leading-relaxed font-sans">{formatCustomCakeNotes(customCakeRequest)}</pre>
                          </div>
                        ) : (
                          <p className="text-xs text-muted font-bold uppercase tracking-widest text-center opacity-40">No custom notes added</p>
                        )}

                        <div className="pt-4 flex justify-between items-center border-t border-border/20 pt-5">
                          <p className="text-xs text-muted font-bold uppercase tracking-widest">Review items before payment</p>
                          <div className="flex gap-3">
                            <Button onClick={() => setActiveStep(2)} className="btn-secondary px-6">Back</Button>
                            <Button onClick={() => setActiveStep(4)} className="btn-primary px-8">Confirm Order</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* ── STEP 4: PAYMENT METHOD ── */}
            <div data-step="4" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
              <StepBadge
                n="4"
                label="Payment Method"
                isActive={activeStep === 4}
                isCompleted={!!selectedPayMethod}
                onEdit={() => setActiveStep(4)}
                summary={selectedPayMethod ? PAYMENT_METHODS.find(m => m.id === selectedPayMethod)?.label : null}
              />
              <AnimatePresence>
                {activeStep === 4 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 sm:p-5 space-y-4">

                      {/* Razorpay banner */}
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card-soft/80 border border-border/20 backdrop-blur-sm">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                          <img src={paymentLogos.razorpay} alt="Razorpay" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-heading uppercase tracking-widest leading-none mb-1">Secure Payment via Razorpay</p>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60 leading-none">
                            PCI DSS Compliant · 256-bit SSL Encryption
                          </p>
                        </div>
                        <Lock size={13} className="text-muted/40 shrink-0" />
                      </div>

                      {/* Method Cards — 1 col on mobile, 2 on sm+ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                        {PAYMENT_METHODS.map((method) => {
                          const Icon = method.icon;
                          const selected = selectedPayMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPayMethod(selected ? null : method.id)}
                              className={`w-full min-w-0 text-left p-3 sm:p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${selected
                                ? `border-transparent ring-2 ${method.ring} ${method.bg} shadow-md`
                                : `border-border/30 bg-surface/20 hover:bg-surface/40`
                                }`}
                            >
                              {/* top row */}
                              <div className="flex items-start justify-between mb-2 sm:mb-3">
                                <div
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center shadow-sm`}
                                >
                                  <Icon size={17} className="text-white" />
                                </div>
                                {selected && (
                                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                                    <CheckCircle2 size={12} className="text-button-text" />
                                  </div>
                                )}
                              </div>

                              {/* label */}
                              <p className="font-black text-heading text-xs sm:text-sm uppercase tracking-wide truncate">{method.label}</p>
                              <p className="text-[10px] text-muted font-bold mt-0.5 uppercase tracking-widest truncate">{method.sub}</p>

                              <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
                                {method.logos.map((logo) => (
                                  <div
                                    key={logo.name}
                                    className="flex items-center justify-center rounded-lg shadow-sm overflow-hidden h-8 sm:h-9 px-1.5 bg-white/10 dark:bg-white backdrop-blur-sm border border-white/5 dark:border-transparent"
                                  >
                                    <img
                                      src={logo.url}
                                      alt={logo.name}
                                      className="h-4 sm:h-5 object-contain"
                                      onError={(e) => (e.target.style.display = 'none')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[9px] text-muted/50 text-center font-bold uppercase tracking-widest italic">
                        Selecting a method pre-fills its tab in Razorpay checkout
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>{/* end LEFT COLUMN */}

          {/* ═══════════════════════════════════
              RIGHT COLUMN — ORDER SUMMARY
              On mobile: shown BELOW left column (default flow)
              On lg: sticky sidebar
          ═══════════════════════════════════ */}
          <div className="lg:col-span-1 w-full min-w-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden w-full min-w-0"
              >

                {/* Summary header */}
                <div className="p-4 sm:p-5 border-b border-border/30 bg-gradient-to-r from-card-soft to-card">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-primary" />
                    <h3 className="font-black text-heading text-xs sm:text-sm uppercase tracking-widest truncate">Order Summary</h3>
                    <span className="ml-auto text-xs bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                      {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="max-h-48 sm:max-h-56 overflow-y-auto divide-y divide-border/20 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedFlavor || ''}-${item.selectedWeight || ''}`}
                      className="flex gap-3 p-3 sm:p-4 w-full min-w-0"
                    >
                      <img
                        src={item.image}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-border/10 shrink-0"
                        alt={item.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-heading truncate uppercase tracking-tight">{item.name}</p>
                        {item.selectedFlavor && (
                          <p className="text-[11px] text-muted font-bold mt-0.5">Flavor: {item.selectedFlavor}</p>
                        )}
                        {item.selectedWeight && (
                          <p className="text-[11px] text-muted font-bold">Weight: {item.selectedWeight}</p>
                        )}
                        <p className="text-xs text-muted/60 font-black mt-1">QTY {item.qty}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-heading text-sm">
                          {formatCurrency(getFinalItemPrice(item) * item.qty)}
                        </p>
                        {Number(item.price) > getFinalItemPrice(item) && (
                          <p className="text-[9px] line-through text-muted/40 font-bold">
                            {formatCurrency(Number(item.price) * item.qty)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3 border-t border-border/30 text-sm">
                  <div className="flex justify-between font-bold text-xs sm:text-sm uppercase tracking-widest">
                    <span className="text-muted">Total MRP</span>
                    <span className="text-heading">{formatCurrency(originalTotal)}</span>
                  </div>
                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-success-text font-black text-xs sm:text-sm uppercase tracking-widest">
                      <span>Offer Discount</span>
                      <span>− {formatCurrency(offerDiscount)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-success-text font-black text-xs sm:text-sm uppercase tracking-widest">
                      <span>Coupon ({appliedCouponDisplay})</span>
                      <span>− {formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border/30 pt-2 flex justify-between font-black text-xs sm:text-sm uppercase tracking-widest">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-heading">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted font-medium">Delivery Fee</span>
                    <span className="font-black text-heading">
                      {isAddressSelected ? formatCurrency(deliveryFee) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted font-medium">GST (18%)</span>
                    <span className="font-black text-heading">
                      {isAddressSelected ? formatCurrency(gst) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted font-medium">Convenience Fee</span>
                    <span className="font-black text-heading">
                      {isAddressSelected ? formatCurrency(convenienceFee) : '—'}
                    </span>
                  </div>

                  {(offerDiscount + couponDiscount) > 0 && (
                    <div className="flex items-center justify-between bg-success-light border border-success/20 rounded-xl px-3 py-2 text-success-text font-black text-xs uppercase tracking-widest w-full min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Star size={11} /> You Save
                      </div>
                      <span>− {formatCurrency(offerDiscount + couponDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-border/30 pt-3">
                    <div className="flex justify-between items-baseline font-black w-full min-w-0">
                      <span className="text-sm sm:text-base text-heading uppercase tracking-widest">Total</span>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl text-primary tracking-tight">
                          {isAddressSelected ? formatCurrency(displayTotal) : '—'}
                        </span>
                        {/* Show "confirmed by server" label once backend total is available */}
                        {backendTotal !== null && (
                          <p className="text-[9px] text-success-text font-black uppercase tracking-widest mt-0.5">
                            ✓ Confirmed by server
                          </p>
                        )}
                      </div>
                    </div>
                    {!isAddressSelected && (
                      <p className="text-[10px] text-warning-text mt-2 text-center font-bold">
                        Select delivery address to see total
                      </p>
                    )}
                  </div>
                </div>

                {/* Coupon */}
                {!hasAppliedCoupon && cartItems.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest pt-4">
                      <Tag size={13} /> Apply Coupon
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="input-field font-black uppercase tracking-widest h-10 sm:h-11 flex-1 min-w-0 text-sm"
                        placeholder="COUPON CODE"
                        value={couponInput}
                        disabled={couponBusy || hasAppliedCoupon}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponBusy || hasAppliedCoupon}
                        className="bg-primary text-button-text hover:brightness-110 px-4 sm:px-5 h-10 sm:h-11 shrink-0 text-[10px] uppercase tracking-widest"
                      >
                        {couponBusy ? '…' : 'Apply'}
                      </Button>
                    </div>
                    {availableCoupons.length > 0 && (
                      <>
                        <p className="text-[10px] text-heading font-black uppercase tracking-widest opacity-80">
                          Available on this order
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableCoupons.map((code) => (
                            <button
                              key={code}
                              type="button"
                              disabled={couponBusy}
                              onClick={() => handleApplyCoupon(code)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black text-heading font-mono hover:bg-primary/10 transition-colors border border-border/30 bg-card-soft/60 uppercase tracking-widest"
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {hasAppliedCoupon && (
                  <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-3 sm:p-3.5 bg-success-light rounded-2xl flex justify-between items-center border border-success/20">
                    <div>
                      <span className="text-[9px] font-black text-success-text uppercase tracking-widest opacity-70">
                        Coupon Applied
                      </span>
                      <p className="text-sm font-mono font-black text-success-text tracking-widest">
                        {appliedCouponDisplay}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-2 hover:bg-error-light rounded-xl text-error-text transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* CTA */}
                <div className="p-4 sm:p-5 pt-0">
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full h-12 sm:h-14 text-xs sm:text-sm font-black uppercase tracking-widest rounded-2xl"
                    disabled={
                      !addressDetails.fullName.trim() ||
                      !addressDetails.phone.trim() ||
                      !deliveryInfo.position
                    }
                  >
                    <Lock size={12} className="mr-1 inline shrink-0" />
                    <span className="truncate">{`Pay Securely ${isAddressSelected ? formatCurrency(displayTotal) : ''}`}</span>
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                    {[
                      { icon: ShieldCheck, label: 'Secure Pay' },
                      { icon: Truck, label: 'Fresh Delivery' },
                      { icon: Sparkles, label: 'Handcrafted' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface/30 border border-border/20"
                      >
                        <Icon size={13} className="text-primary/60 shrink-0" />
                        <span className="text-[10px] font-black text-muted/60 uppercase tracking-widest text-center leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAP MODAL ── */}
      <AnimatePresence>
        {showMap && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 40 }}
              className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl h-[85vh] sm:h-[80vh] relative overflow-hidden shadow-premium border border-border"
            >
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-4 right-4 z-10 bg-surface p-2 sm:p-2.5 rounded-full shadow text-foreground hover:bg-muted/10 transition-colors"
              >
                <X size={18} />
              </button>
              <MapSelector onSelect={(data) => { setDeliveryInfo(data); setShowMap(false); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;