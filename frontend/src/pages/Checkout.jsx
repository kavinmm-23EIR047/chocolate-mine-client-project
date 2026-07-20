import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
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
  Send,
  Trash2,
  Plus,
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { clearCart, setCoupon, removeFromCart, updateCartItemAddons } from '../redux/slices/cartSlice';
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

/* ─────────────────────────────────────────────
   PAYMENT LOGOS — Fixed Direct URLs
───────────────────────────────────────────── */
export const paymentLogos = {
  cards: {
    visa: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
    mastercard: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
    rupay: "https://upload.wikimedia.org/wikipedia/en/c/c6/RuPay_Card_logo.svg",
  },
  upi: {
    gpay: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",
    phonepe: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg",
    paytm: "https://upload.wikimedia.org/wikipedia/commons/2/23/Paytm_Logo.svg",
  },
  banking: {
    sbi: "https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg",
    hdfc: "https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg",
    icici: "https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg",
  },
  razorpay: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg",
};

/* ─────────────────────────────────────────────
   PAYMENT METHOD CONFIG
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
  { value: '10:00 AM – 12:00 PM', label: '10:00 AM – 12:00 PM', emoji: '🌅', startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { value: '12:00 PM – 2:00 PM', label: '12:00 PM – 2:00 PM', emoji: '☀️', startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 },
  { value: '2:00 PM – 4:00 PM', label: '2:00 PM – 4:00 PM', emoji: '🌤️', startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  { value: '4:00 PM – 6:00 PM', label: '4:00 PM – 6:00 PM', emoji: '🌇', startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { value: '6:00 PM – 8:00 PM', label: '6:00 PM – 8:00 PM', emoji: '🌆', startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  { value: '8:00 PM – 10:00 PM', label: '8:00 PM – 10:00 PM', emoji: '🌙', startHour: 20, startMinute: 0, endHour: 22, endMinute: 0 },
];

/* ─────────────────────────────────────────────
   HELPER: Safe string formatting for notes
───────────────────────────────────────────── */
const safeFormatNotes = (notes) => {
  if (!notes) return '';
  if (typeof notes === 'string') return notes;
  try {
    return JSON.stringify(notes, null, 2);
  } catch {
    return String(notes);
  }
};

/* ─────────────────────────────────────────────
   HELPER: Safely extract coupon code string
───────────────────────────────────────────── */
const getCouponCodeString = (coupon) => {
  if (!coupon) return '';
  if (typeof coupon === 'string') return coupon;
  if (typeof coupon === 'object') {
    return coupon.code || coupon.couponCode || coupon.name || '';
  }
  return '';
};

/* ─────────────────────────────────────────────
   HELPER: Safely get coupon code for API
───────────────────────────────────────────── */
const getCouponCodeForApi = (coupon) => {
  if (!coupon) return null;
  if (typeof coupon === 'string') return coupon;
  if (typeof coupon === 'object') {
    return coupon.code || coupon.couponCode || coupon.name || null;
  }
  return null;
};

/* ─────────────────────────────────────────────
   PERSISTENCE KEYS
───────────────────────────────────────────── */
const STORAGE_KEYS = {
  CHECKOUT_STATE: 'checkout_state',
  CHECKOUT_STEP: 'checkout_step',
  DELIVERY_INFO: 'delivery_info',
  ADDRESS_DETAILS: 'address_details',
  DELIVERY_DATE: 'delivery_date',
  DELIVERY_SLOT: 'delivery_slot',
  SELECTED_PAY_METHOD: 'selected_pay_method',
  LOCAL_COUPON: 'local_coupon',
};

/* ─────────────────────────────────────────────
   STEP BADGE (with improved UX)
───────────────────────────────────────────── */
const StepBadge = ({ n, label, isActive, isCompleted, onEdit, summary }) => (
  <div
    onClick={isCompleted && !isActive ? onEdit : undefined}
    className={`flex items-center gap-3 p-4 sm:p-5 border-b transition-all duration-300 ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-border/30'
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
          <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline px-3 py-1 bg-primary/5 rounded-lg border border-primary/20">
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

  const [localDirectItem, setLocalDirectItem] = useState(location.state?.directItem || null);
  const directItem = localDirectItem;

  // Load saved state from sessionStorage on mount
  const loadSavedState = () => {
    try {
      const savedStep = sessionStorage.getItem(STORAGE_KEYS.CHECKOUT_STEP);
      const savedDeliveryInfo = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_INFO);
      const savedAddressDetails = sessionStorage.getItem(STORAGE_KEYS.ADDRESS_DETAILS);
      const savedDeliveryDate = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_DATE);
      const savedDeliverySlot = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_SLOT);
      const savedPayMethod = sessionStorage.getItem(STORAGE_KEYS.SELECTED_PAY_METHOD);
      const savedLocalCoupon = sessionStorage.getItem(STORAGE_KEYS.LOCAL_COUPON);

      return {
        step: savedStep ? parseInt(savedStep) : 1,
        deliveryInfo: savedDeliveryInfo ? JSON.parse(savedDeliveryInfo) : null,
        addressDetails: savedAddressDetails ? JSON.parse(savedAddressDetails) : null,
        deliveryDate: savedDeliveryDate ? new Date(savedDeliveryDate) : null,
        deliverySlot: savedDeliverySlot || null,
        selectedPayMethod: savedPayMethod || null,
        localCoupon: (() => {
          if (!savedLocalCoupon) return '';
          try {
            return JSON.parse(savedLocalCoupon);
          } catch {
            return savedLocalCoupon;
          }
        })(),
      };
    } catch (error) {
      console.error('Error loading saved state:', error);
      return {};
    }
  };

  const savedState = loadSavedState();

  const [localCoupon, setLocalCoupon] = useState(
    savedState.localCoupon || (directItem?.coupon?.code ? directItem.coupon : '')
  );

  // FIXED: Safely extract coupon code string
  const appliedCouponDisplay = useMemo(() => {
    const rawCoupon = directItem ? localCoupon : appliedCouponFromRedux;
    return getCouponCodeString(rawCoupon);
  }, [directItem, localCoupon, appliedCouponFromRedux]);

  const hasAppliedCoupon = appliedCouponDisplay !== '';

  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(savedState.step || 1);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Save active step to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, activeStep.toString());
  }, [activeStep]);

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
  const [selectedPayMethod, setSelectedPayMethod] = useState(savedState.selectedPayMethod || null);

  // Save selected payment method
  useEffect(() => {
    if (selectedPayMethod) {
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_PAY_METHOD, selectedPayMethod);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_PAY_METHOD);
    }
  }, [selectedPayMethod]);

  const isProcessingPayment = useRef(false);

  const [availableAddons, setAvailableAddons] = useState([]);

  useEffect(() => {
    api.get('/addons/active')
      .then(res => {
        setAvailableAddons(res.data?.data || []);
      })
      .catch(err => console.error('Failed to fetch active addons:', err));
  }, []);

  const handleCheckoutAddonIncrement = (item, addon) => {
    if (directItem) {
      const exists = directItem.addons?.find(a => a._id === addon._id || a.addonId === addon._id);
      let updatedAddons;
      if (exists) {
        updatedAddons = directItem.addons.map(a =>
          a._id === addon._id || a.addonId === addon._id
            ? { ...a, qty: (a.qty || 1) + 1 }
            : a
        );
      } else {
        updatedAddons = [...(directItem.addons || []), { ...addon, qty: 1 }];
      }
      setLocalDirectItem(prev => ({ ...prev, addons: updatedAddons }));
    } else {
      const exists = item.addons?.find(a => a._id === addon._id || a.addonId === addon._id);
      let updatedAddons;
      if (exists) {
        updatedAddons = item.addons.map(a =>
          a._id === addon._id || a.addonId === addon._id
            ? { ...a, qty: (a.qty || 1) + 1 }
            : a
        );
      } else {
        updatedAddons = [...(item.addons || []), { ...addon, qty: 1 }];
      }
      dispatch(updateCartItemAddons({
        productId: item.productId,
        addons: updatedAddons,
        options: item.options
      }));
    }
    setBackendTotal(null); // Reset backend total to force recalculation
  };

  const handleCheckoutAddonDecrement = (item, addon) => {
    if (directItem) {
      const target = directItem.addons?.find(a => a._id === addon._id || a.addonId === addon._id);
      let updatedAddons;
      if (target && (target.qty || 1) <= 1) {
        updatedAddons = directItem.addons.filter(a => a._id !== addon._id && a.addonId !== addon._id);
      } else if (target) {
        updatedAddons = directItem.addons.map(a =>
          a._id === addon._id || a.addonId === addon._id
            ? { ...a, qty: (a.qty || 1) - 1 }
            : a
        );
      } else {
        updatedAddons = directItem.addons || [];
      }
      setLocalDirectItem(prev => ({ ...prev, addons: updatedAddons }));
    } else {
      const target = item.addons?.find(a => a._id === addon._id || a.addonId === addon._id);
      let updatedAddons;
      if (target && (target.qty || 1) <= 1) {
        updatedAddons = item.addons.filter(a => a._id !== addon._id && a.addonId !== addon._id);
      } else if (target) {
        updatedAddons = item.addons.map(a =>
          a._id === addon._id || a.addonId === addon._id
            ? { ...a, qty: (a.qty || 1) - 1 }
            : a
        );
      } else {
        updatedAddons = item.addons || [];
      }
      dispatch(updateCartItemAddons({
        productId: item.productId,
        addons: updatedAddons,
        options: item.options
      }));
    }
    setBackendTotal(null); // Reset backend total to force recalculation
  };

  const [deliveryInfo, setDeliveryInfo] = useState(savedState.deliveryInfo || { address: null, position: null });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Save delivery info to sessionStorage
  useEffect(() => {
    if (deliveryInfo && deliveryInfo.position) {
      sessionStorage.setItem(STORAGE_KEYS.DELIVERY_INFO, JSON.stringify(deliveryInfo));
    }
  }, [deliveryInfo]);

  // Delivery date with future support (up to 30 days)
  const [deliveryDate, setDeliveryDate] = useState(() => {
    if (savedState.deliveryDate) {
      return new Date(savedState.deliveryDate);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Save delivery date to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.DELIVERY_DATE, deliveryDate.toISOString());
  }, [deliveryDate]);

  const minDate = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  })();

  const maxDate = (() => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    max.setHours(0, 0, 0, 0);
    return max;
  })();

  const changeDate = (days) => {
    const newDate = new Date(deliveryDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate >= minDate && newDate <= maxDate) {
      setDeliveryDate(newDate);
    } else {
      toast.error(days > 0 ? 'Cannot order more than 30 days ahead' : 'Cannot select past dates');
    }
  };

  // Helper: format phone with +91 prefix for display, but store only digits
  const formatPhoneForDisplay = (digits) => digits ? `+91 ${digits}` : '';

  const [addressDetails, setAddressDetails] = useState(
    savedState.addressDetails || {
      fullName: user?.name || '',
      phone: '',  // store only 10 digits
      houseNo: '',
      street: '',
      landmark: '',
    }
  );

  // Save address details to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.ADDRESS_DETAILS, JSON.stringify(addressDetails));
  }, [addressDetails]);

  // Initialize phone from user if available (strip non-digits, take last 10)
  useEffect(() => {
    if (user?.phone && !addressDetails.phone) {
      const digits = user.phone.replace(/\D/g, '').slice(-10);
      setAddressDetails(prev => ({ ...prev, phone: digits }));
    }
  }, [user?.phone]);

  const SHOP_LAT = import.meta.env.VITE_SHOP_LAT || 11.004540031168712;
  const SHOP_LNG = import.meta.env.VITE_SHOP_LNG || 76.97510955713153;
  const DELIVERY_RADIUS = import.meta.env.VITE_DELIVERY_RADIUS_KM || 30;


  const [locationValid, setLocationValid] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [deliverySlot, setDeliverySlot] = useState(savedState.deliverySlot || null);
  const [customCakeRequest, setCustomCakeRequest] = useState(null);
  const [orderNotesExtra, setOrderNotesExtra] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [backendTotal, setBackendTotal] = useState(null);

  // Save delivery slot to sessionStorage
  useEffect(() => {
    if (deliverySlot) {
      sessionStorage.setItem(STORAGE_KEYS.DELIVERY_SLOT, deliverySlot);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_SLOT);
    }
  }, [deliverySlot]);

  // Save local coupon to sessionStorage
  useEffect(() => {
    if (localCoupon) {
      sessionStorage.setItem(STORAGE_KEYS.LOCAL_COUPON, typeof localCoupon === 'object' ? JSON.stringify(localCoupon) : localCoupon);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.LOCAL_COUPON);
    }
  }, [localCoupon]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isSlotAvailableForDate = (slot, date, now) => {
    const current = now || new Date();
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    // Future dates: all slots available (business hours assumed, can be customized)
    if (selectedDate > todayDate) return true;

    // Today: apply 2-hour advance and exclude slots that have already ended
    const slotStartMinutes = slot.startHour * 60 + slot.startMinute;
    const slotEndMinutes = slot.endHour * 60 + slot.endMinute;
    const currentMinutes = current.getHours() * 60 + current.getMinutes();

    // Must start at least 2 hours from now and not have ended yet
    return (slotStartMinutes - currentMinutes >= 120) && (currentMinutes < slotEndMinutes);
  };

  const getSlotsWithAvailability = () => {
    return slots.map((slot) => ({
      ...slot,
      available: isSlotAvailableForDate(slot, deliveryDate, currentTime),
    }));
  };

  const availableSlots = getSlotsWithAvailability();
  const noSlotsAvailable = availableSlots.every((slot) => !slot.available);

  useEffect(() => {
    const selectedSlot = availableSlots.find((s) => s.value === deliverySlot && s.available);
    if (!selectedSlot) {
      const first = availableSlots.find((s) => s.available);
      setDeliverySlot(first ? first.value : null);
    }
  }, [deliveryDate, currentTime]);

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
      setDeliveryFee(Math.round(dist * 10));
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

  const cartItems = useMemo(
    () => (directItem ? [directItem] : cartItemsFromRedux),
    [directItem, cartItemsFromRedux]
  );

  const normalizeCustomValue = (value) => String(value || '').trim().toLowerCase();

  const extractCustomCakeMessage = (request) => {
    const rawMessage = request?.message || request?.messageOnCake || '';
    const match = String(rawMessage).match(/message:\s*(.*)$/i);
    return normalizeCustomValue(match ? match[1] : rawMessage);
  };

  const isCustomCakeItem = (item) => (
    item?.productId?.startsWith?.('custom-') || (Array.isArray(item?.category) ? item.category.includes('Custom Cakes') : item?.category === 'Custom Cakes')
  );

  const doesCustomCakeRequestMatchItem = (request, item) => {
    if (!request || !item || !isCustomCakeItem(item)) return false;

    const itemOptions = item.options || {};
    const itemFlavor = itemOptions.flavor || item.selectedFlavor;
    const itemWeight = itemOptions.weight || item.selectedWeight;
    const itemColor = itemOptions.color || item.themeColor;
    const itemMessage = itemOptions.message || item.message;

    return (
      normalizeCustomValue(request.flavour || request.flavor) === normalizeCustomValue(itemFlavor) &&
      normalizeCustomValue(request.servingWeight || request.weight) === normalizeCustomValue(itemWeight) &&
      normalizeCustomValue(request.themeColor || request.color) === normalizeCustomValue(itemColor) &&
      extractCustomCakeMessage(request) === normalizeCustomValue(itemMessage)
    );
  };

  const matchedCustomCakeItem = useMemo(() => {
    if (!customCakeRequest) return null;
    return cartItems.find((item) => doesCustomCakeRequestMatchItem(customCakeRequest, item)) || null;
  }, [customCakeRequest, cartItems]);

  const shouldShowCustomCakeRequest = !!customCakeRequest && !!matchedCustomCakeItem;

  useEffect(() => {
    const saved = loadCustomCakeRequest();
    if (!saved || typeof saved !== 'object') {
      setCustomCakeRequest(null);
      return;
    }

    const hasMatchingCustomCakeItem = cartItems.some((item) =>
      doesCustomCakeRequestMatchItem(saved, item)
    );

    if (hasMatchingCustomCakeItem) {
      setCustomCakeRequest(saved);
    } else {
      clearCustomCakeRequest();
      setCustomCakeRequest(null);
    }
  }, [cartItems]);

  const [productDescriptions, setProductDescriptions] = useState({});

  useEffect(() => {
    const missingIds = cartItems
      .filter((item) => !item.description && item.productId && !item.productId?.startsWith?.('custom-'))
      .map((item) => item.productId);

    const uniqueMissingIds = [...new Set(missingIds)].filter(
      (id) => !Object.prototype.hasOwnProperty.call(productDescriptions, id)
    );

    if (uniqueMissingIds.length === 0) return;

    let cancelled = false;
    const fetchDescriptions = async () => {
      const entries = await Promise.all(
        uniqueMissingIds.map(async (id) => {
          try {
            const res = await api.get(`/products/${id}`);
            return [id, res.data?.data?.description || ''];
          } catch {
            return [id, ''];
          }
        })
      );

      if (!cancelled) {
        setProductDescriptions((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }
    };

    fetchDescriptions();
    return () => {
      cancelled = true;
    };
  }, [cartItems, productDescriptions]);

  const getItemDescription = (item) => (
    item.description ||
    item.productDescription ||
    productDescriptions[item.productId] ||
    ''
  );

  const getItemOriginalPrice = (item) => {
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    const base = !Number.isNaN(vp) && vp > 0 ? vp : Number(item.price);
    let addonSum = 0;
    if (item.addons && Array.isArray(item.addons)) {
      addonSum = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
    }
    return base + addonSum;
  };

  const getItemBasePrice = (item) => {
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    let base = !Number.isNaN(vp) && vp > 0 ? vp : Number(item.price);

    const hasOffer =
      item.offerPrice != null &&
      Number(item.offerPrice) > 0 &&
      Number(item.offerPrice) < Number(item.price);
    if (hasOffer && Number.isNaN(vp)) {
      base = Number(item.offerPrice);
    }

    let addonSum = 0;
    if (item.addons && Array.isArray(item.addons)) {
      addonSum = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
    }
    return base + addonSum;
  };

  const getItemCouponDiscount = (item) => {
    const code = directItem
      ? getCouponCodeString(localCoupon)
      : getCouponCodeString(appliedCouponFromRedux);
    if (!code || !item.coupon?.enabled) return 0;
    if (code !== getCouponCodeString(item.coupon.code)) return 0;

    // Coupon discount applies to the product base price (excluding addons)
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    let prodPrice = !Number.isNaN(vp) && vp > 0 ? vp : Number(item.price);
    const hasOffer =
      item.offerPrice != null &&
      Number(item.offerPrice) > 0 &&
      Number(item.offerPrice) < Number(item.price);
    if (hasOffer && Number.isNaN(vp)) {
      prodPrice = Number(item.offerPrice);
    }

    return getCouponUnitDiscount(prodPrice, item.coupon);
  };

  const getFinalItemPrice = (item) => getItemBasePrice(item) - getItemCouponDiscount(item);

  const subtotal = cartItems.reduce((s, i) => s + getFinalItemPrice(i) * i.qty, 0);
  const originalTotal = cartItems.reduce((s, i) => s + getItemOriginalPrice(i) * i.qty, 0);
  const offerDiscount = cartItems.reduce(
    (s, i) => s + (getItemOriginalPrice(i) - getItemBasePrice(i)) * i.qty,
    0
  );
  const couponDiscount = cartItems.reduce((s, i) => s + getItemCouponDiscount(i) * i.qty, 0);

  // Separate product-only and addon-only totals for clear display
  const productOnlyTotal = cartItems.reduce((s, i) => {
    const vp = i.variantPrice != null ? Number(i.variantPrice) : NaN;
    const base = !Number.isNaN(vp) && vp > 0 ? vp : Number(i.price);
    return s + base * i.qty;
  }, 0);
  const addonOnlyTotal = cartItems.reduce((s, i) => {
    if (!i.addons || !Array.isArray(i.addons)) return s;
    return s + i.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0) * i.qty;
  }, 0);

  const isAddressSelected = !!deliveryInfo.position;
  const gst = Math.round(subtotal * 0.18);
  const convenienceFee = Math.round(subtotal * 0.02);
  const clientTotal = subtotal + (isAddressSelected ? deliveryFee : 0) + gst + convenienceFee;
  const displayTotal = backendTotal !== null ? backendTotal : clientTotal;

  const availableUnappliedCoupons = useMemo(() => {
    if (hasAppliedCoupon) return [];
    const coupons = [];
    cartItems.forEach(item => {
      const p = item.product || item;
      const couponObj = item.coupon || p.coupon;
      if (couponObj?.enabled && couponObj?.code) {
        const code = String(couponObj.code).trim().toUpperCase();
        if (code && !coupons.some(c => c.code === code)) {
          const basePrice = getItemBasePrice(item);
          const savings = getCouponUnitDiscount(basePrice, couponObj) * item.qty;
          if (savings > 0) {
            coupons.push({
              code,
              savings,
              itemName: item.name || p.name
            });
          }
        }
      }
    });
    return coupons;
  }, [cartItems, hasAppliedCoupon]);

  // Auto-set shop pickup details if order total is under ₹100
  useEffect(() => {
    if (subtotal < 100) {
      setDeliveryInfo({
        address: 'Shop Pickup',
        position: { lat: Number(SHOP_LAT), lng: Number(SHOP_LNG) }
      });
      setLocationValid(true);
      setDistance(0);
      setDeliveryFee(0);
    }
  }, [subtotal, navigate]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        setSavedAddresses(res.data.data);
        const def = res.data.data.find((a) => a.isDefault);
        if (def && !deliveryInfo.position) handleSelectAddress(def);
      } catch { }
    };
    if (user) fetchAddresses();
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setEditingAddressId(null);
    setDeliveryInfo({
      address: `${addr.houseNo}, ${addr.street}, ${addr.city}`,
      position: { lat: addr.lat, lng: addr.lng },
    });
    setAddressDetails({
      fullName: addr.fullName,
      phone: addr.phone.replace(/\D/g, '').slice(-10),
      houseNo: addr.houseNo,
      street: addr.street,
      landmark: addr.landmark || '',
    });
    setActiveStep(2);
  };

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
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
    setSelectedAddressId(addr._id);
    setAddressDetails({
      fullName: addr.fullName,
      phone: addr.phone.replace(/\D/g, '').slice(-10),
      houseNo: addr.houseNo,
      street: addr.street,
      landmark: addr.landmark || '',
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
      const { data } = await api.patch(`/users/addresses/${editingAddressId}`, {
        ...addressDetails,
        lat: deliveryInfo.position.lat,
        lng: deliveryInfo.position.lng,
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
    if (subtotal >= 300) {
      if (!addressDetails.houseNo?.trim()) return toast.error('Please enter house/flat number');
      if (!addressDetails.street?.trim()) return toast.error('Please enter street address');
      if (!addressDetails.landmark?.trim()) return toast.error('Please enter a landmark');
      if (!deliveryInfo.position) return toast.error('Please select delivery location on map');
      if (!locationValid) return toast.error(locationError || 'Location outside service area');
    }
    setActiveStep(2);
  };

  const handleSlotConfirmed = () => {
    if (!deliverySlot) return toast.error('Please select a delivery slot');
    const sel = slots.find((s) => s.value === deliverySlot);
    if (sel && !isSlotAvailableForDate(sel, deliveryDate, currentTime)) {
      return toast.error('Selected slot is no longer available. Please choose another slot.');
    }
    setActiveStep(3);
  };

  const validatePhoneNumber = (p) => /^[0-9]{10}$/.test(p);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    setAddressDetails({ ...addressDetails, phone: val });
  };

  const validateForm = () => {
    if (!addressDetails.fullName.trim()) { toast.error('Please enter full name'); return false; }
    if (!validatePhoneNumber(addressDetails.phone.trim())) { toast.error('Please enter a valid 10-digit phone number'); return false; }
    if (subtotal >= 300) {
      if (!addressDetails.houseNo?.trim()) { toast.error('Please enter house/flat number'); return false; }
      if (!addressDetails.street?.trim()) { toast.error('Please enter street address'); return false; }
      if (!addressDetails.landmark?.trim()) { toast.error('Please enter a landmark'); return false; }
      if (!deliveryInfo.position) { toast.error('Please select delivery location on map'); return false; }
      if (!locationValid) { toast.error(locationError || 'Location outside service area'); return false; }
    }
    if (!deliverySlot) { toast.error('Please select a delivery slot'); return false; }
    const sel = slots.find((s) => s.value === deliverySlot);
    if (sel && !isSlotAvailableForDate(sel, deliveryDate, currentTime)) { toast.error('Selected slot is no longer available.'); return false; }
    return true;
  };

  const handleApplyCoupon = async (presetCode) => {
    const code = (presetCode != null ? String(presetCode) : couponInput).trim().toUpperCase();
    if (!code) return toast.error('Enter coupon code');
    if (directItem) {
      if (directItem.coupon?.enabled && getCouponCodeString(directItem.coupon.code).toUpperCase() === code) {
        setLocalCoupon(directItem.coupon);
        toast.success(`Coupon ${code} applied`);
        setCouponInput('');
      } else {
        toast.error('Invalid coupon for this item');
      }
      return;
    }
    const isValid = cartItemsFromRedux.some(
      (i) => getCouponCodeString(i.coupon?.code).toUpperCase() === code
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

  // Clear all saved checkout data on successful order
  const clearSavedCheckoutData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  };

  const handlePlaceOrder = async () => {
    if (isProcessingPayment.current) { toast.error('Payment already in progress.'); return; }
    if (!validateForm()) return;

    if (!user) { toast.error('Session expired. Please login again.'); navigate('/login'); return; }

    const isWhatsAppOrder = subtotal < 300;

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!isWhatsAppOrder && !razorpayKey) { toast.error('Payment configuration error.'); return; }

    try {
      isProcessingPayment.current = true;
      setLoading(true);
      setLoaderText(isWhatsAppOrder ? 'Placing WhatsApp Order...' : 'Preparing checkout...');

      const interval = setInterval(() => {
        setLoaderText((p) => {
          const m = isWhatsAppOrder
            ? ['Saving order details...', 'Generating message...', 'Almost there...']
            : ['Confirming address...', 'Calculating total...', 'Almost there...'];
          const i = m.indexOf(p) + 1;
          return i < m.length ? m[i] : p;
        });
      }, 2000);

      let loaded = false;
      if (!isWhatsAppOrder) {
        loaded = await loadRazorpayScript();
        if (!loaded) {
          clearInterval(interval);
          setLoading(false);
          isProcessingPayment.current = false;
          toast.error('Payment gateway unavailable.');
          return;
        }
      }

      const cakeMessage = shouldShowCustomCakeRequest ? customCakeRequest?.messageOnCake?.trim() || '' : '';
      const builderNotes = shouldShowCustomCakeRequest ? safeFormatNotes(formatCustomCakeNotes(customCakeRequest)) : '';
      const notesMerged = [builderNotes, orderNotesExtra.trim()].filter(Boolean).join('\n\n');

      // FIXED: Safely extract coupon code for API
      const couponCodeForApi = directItem
        ? getCouponCodeForApi(localCoupon)
        : getCouponCodeForApi(appliedCouponFromRedux);

      const res = await api.post(
        '/payment/create-order',
        {
          paymentMethod: isWhatsAppOrder ? 'WHATSAPP' : 'ONLINE',
          address: {
            fullName: addressDetails.fullName,
            phone: addressDetails.phone,
            houseNo: isWhatsAppOrder ? 'Shop Pickup' : addressDetails.houseNo,
            street: isWhatsAppOrder ? 'Shop Pickup' : (addressDetails.street || deliveryInfo.address),
            landmark: isWhatsAppOrder ? 'Shop Pickup' : addressDetails.landmark,
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
              appliedCoupon: couponCodeForApi,
              options: directItem.options,
              addons: directItem.addons,
            }
            : undefined,
          items: cartItemsFromRedux,
          discount: couponDiscount,
          couponCode: couponCodeForApi,
          notes: notesMerged || undefined,
          cakeMessage: cakeMessage || undefined,
        }
      );

      const { razorpayOrder, orderId, orderNumber } = res.data.data;

      if (isWhatsAppOrder) {
        clearInterval(interval);

        if (!directItem) {
          dispatch(clearCart());
        }
        clearCustomCakeRequest();
        setCustomCakeRequest(null);
        clearSavedCheckoutData();
        setLoading(false);
        isProcessingPayment.current = false;

        const adminPhone = import.meta.env.VITE_ADMIN_PHONE || '9363265477';
        const orderNum = orderNumber || `ORD-${orderId.slice(-6).toUpperCase()}`;

        // Build items text list
        const itemsList = cartItems.map(item => {
          const optStr = item.selectedFlavor || item.selectedWeight ? ` (${[item.selectedFlavor, item.selectedWeight].filter(Boolean).join(', ')})` : '';
          const origPrice = getItemOriginalPrice(item);
          const basePrice = getItemBasePrice(item);
          const finalItemPrice = getFinalItemPrice(item);

          let priceDetails = ``;
          if (origPrice > basePrice) {
            priceDetails = ` (Original: ₹${origPrice}, Offer: ₹${basePrice})`;
          }

          let addonStr = '';
          if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
            const addonList = item.addons.map(a => `${a.name} (x${a.qty || 1}) - ₹${a.price * (a.qty || 1)}`).join(', ');
            addonStr = `\n   └ Addons: ${addonList}`;
          }

          return `• ${item.name} x ${item.qty}${optStr} - ₹${finalItemPrice * item.qty}${priceDetails}${addonStr}`;
        }).join('\n');

        const isDelivery = subtotal >= 300;
        let addressText = ``;
        if (isDelivery) {
          const addrParts = [];
          if (addressDetails.houseNo) addrParts.push(addressDetails.houseNo);
          if (addressDetails.street) addrParts.push(addressDetails.street);
          if (addressDetails.landmark) addrParts.push(`Landmark: ${addressDetails.landmark}`);
          addrParts.push(`Coimbatore`);
          addressText = `📍 *Delivery Address:* ${addrParts.join(', ')}`;
          if (deliveryInfo.position) {
            addressText += `\n🗺️ *Directions:* https://www.google.com/maps/search/?api=1&query=${deliveryInfo.position.lat},${deliveryInfo.position.lng}`;
          }
        } else {
          addressText = `📍 *Pickup Address:* The Chocolate Mine Shop, Coimbatore.`;
        }

        const messageText = `🍫 *New ${isDelivery ? 'Delivery' : 'Shop Pickup'} Order*\n\n` +
          `🆔 *Order Number:* #${orderNum}\n` +
          `👤 *Customer Name:* ${addressDetails.fullName}\n` +
          `📞 *Customer Phone:* ${addressDetails.phone}\n` +
          `${addressText}\n\n` +
          `🍰 *Items:*\n${itemsList}\n\n` +
          `💰 *Pricing Breakdown:*\n` +
          `   Subtotal: ₹${subtotal}\n` +
          (couponDiscount > 0 ? `   Coupon Discount: -₹${couponDiscount}\n` : '') +
          (isDelivery ? `   Delivery Fee: ₹${deliveryFee}\n` : '') +
          `   GST (18%): ₹${gst}\n` +
          `   Convenience Fee (2%): ₹${convenienceFee}\n` +
          `   *Total Amount:* ₹${clientTotal}\n\n` +
          `📅 *${isDelivery ? 'Delivery' : 'Pickup'} Date:* ${new Date(deliveryDate).toLocaleDateString()}\n` +
          `⏰ *${isDelivery ? 'Delivery' : 'Pickup'} Slot:* ${deliverySlot || 'N/A'}\n\n` +
          `Please confirm my order. Thank you!`;

        const waLink = `https://wa.me/91${adminPhone}?text=${encodeURIComponent(messageText)}`;

        toast.success("Order registered! Redirecting to WhatsApp...");
        window.open(waLink, '_blank');
        navigate("/order-success", {
          state: { orderId },
        });
        return;
      }

      if (!razorpayOrder?.id) throw new Error('Invalid order response');

      const confirmedAmount = razorpayOrder.amount / 100;
      setBackendTotal(confirmedAmount);

      clearInterval(interval);
      setLoading(false);

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
              }
            );
            if (!directItem) {
              dispatch(clearCart());
            }
            clearCustomCakeRequest();
            setCustomCakeRequest(null);
            // Clear saved checkout data on successful payment
            clearSavedCheckoutData();
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
            } catch { }
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

      // Add method preference if selected
      if (selectedPayMethod) {
        const method = PAYMENT_METHODS.find(m => m.id === selectedPayMethod);
        if (method) {
          options.method = {
            [method.rzpMethod]: true
          };
        }
      }

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
    cartItems.forEach((i) => {
      if (i.coupon?.enabled) {
        const code = getCouponCodeString(i.coupon.code);
        if (code) s.add(code);
      }
    });
    return Array.from(s);
  }, [cartItems]);

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isToday = deliveryDate.toDateString() === new Date().toDateString();

  // Get formatted custom cake notes safely
  const getFormattedCustomNotes = () => {
    if (!customCakeRequest) return '';
    const notes = formatCustomCakeNotes(customCakeRequest);
    return safeFormatNotes(notes);
  };

  return (
    <div className="min-h-screen bg-background">
      <ScooterLoader isVisible={loading} text={loaderText} />

      <div className="bg-navbar text-navbar-text border-b border-border sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <div className="w-full max-w-none mx-auto px-4 lg:px-8 xl:px-16 py-3 sm:py-4 min-w-0">
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

      <div className="w-full max-w-none mx-auto px-4 lg:px-8 xl:px-16 py-4 sm:py-8 overflow-x-hidden">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 w-full min-w-0">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0">

            {subtotal < 300 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm">
                <span className="text-xl shrink-0">⚠️</span>
                <div className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  <p className="font-black uppercase tracking-widest text-xs mb-1">Notice: Minimum Order for Delivery</p>
                  Orders below <span className="font-black text-primary">₹300</span> are not eligible for home delivery. Please increase your cart value for delivery, or proceed as a <span className="font-bold text-primary">Shop Pickup Order</span> to buy directly at our shop.
                </div>
              </div>
            )}

            {/* STEP 1: DELIVERY ADDRESS */}
            <div data-step="1" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border-2 border-border-card overflow-hidden">
              <StepBadge
                n="1"
                label={subtotal >= 300 ? "Delivery Address" : "Customer Details"}
                isActive={activeStep === 1}
                isCompleted={subtotal < 300 ? (!!addressDetails.fullName.trim() && validatePhoneNumber(addressDetails.phone)) : !!deliveryInfo.position}
                onEdit={() => setActiveStep(1)}
                summary={deliveryInfo.position ? `${addressDetails.fullName} • ${formatPhoneForDisplay(addressDetails.phone)}` : null}
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

                      {subtotal >= 300 && savedAddresses.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-heading font-black uppercase tracking-widest opacity-80">Saved Addresses</p>
                          <div className="grid gap-3 w-full min-w-0">
                            {savedAddresses.map((addr) => (
                              <div
                                key={addr._id}
                                onClick={() => handleSelectAddress(addr)}
                                className={`w-full min-w-0 text-left p-3 sm:p-4 border-2 rounded-2xl transition-all relative overflow-hidden group cursor-pointer ${selectedAddressId === addr._id
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border-muted hover:border-primary/40 bg-surface/20'
                                  }`}
                              >
                                <div className="flex justify-between items-start gap-2 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-black text-heading text-sm break-words">{addr.fullName}</span>
                                    <p className="text-xs text-muted font-bold mt-0.5">{formatPhoneForDisplay(addr.phone)}</p>
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

                      {subtotal >= 300 && (
                        <button
                          onClick={() => setShowMap(true)}
                          className="w-full p-2.5 sm:p-4 border-2 border-dashed border-primary/30 dark:border-border-card rounded-2xl flex items-center justify-center gap-2 text-primary font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-primary/5 hover:border-primary/50 transition-all"
                        >
                          <MapPin size={15} className="shrink-0" />
                          <span className="truncate">Add / Update Location on Map</span>
                        </button>
                      )}

                      {subtotal >= 300 && deliveryInfo.position && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`w-full min-w-0 p-3 sm:p-4 rounded-2xl border-2 flex items-start gap-3 ${locationValid
                            ? 'bg-success-light border-success/40'
                            : 'bg-error-light border-error/40'
                            }`}
                        >
                          <Navigation size={15} className={`mt-0.5 shrink-0 ${locationValid ? 'text-success-text' : 'text-error-text'}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-black uppercase tracking-widest ${locationValid ? 'text-success-text' : 'text-error-text'}`}>
                              {locationValid ? 'Delivery Location Set' : 'Outside Service Area'}
                            </p>
                            <p className={`text-xs sm:text-sm font-medium mt-0.5 leading-relaxed break-all ${locationValid ? 'text-success-text' : 'text-error-text'}`}>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-border/30">
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                            <User size={12} /> Full Name *
                          </label>
                          <input
                            className="input-field text-sm sm:text-base min-w-0"
                            placeholder="Recipient name"
                            value={addressDetails.fullName}
                            onChange={(e) => setAddressDetails({ ...addressDetails, fullName: e.target.value })}
                            type="text"
                          />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                            <Phone size={12} /> Phone Number *
                          </label>
                          <div className="flex items-stretch gap-1">
                            <span className="inline-flex items-center px-3 rounded-xl border border-input-border bg-muted/10 text-heading font-black text-sm">+91</span>
                            <input
                              className="input-field text-sm sm:text-base min-w-0 flex-1"
                              placeholder="9876543210"
                              value={addressDetails.phone}
                              onChange={handlePhoneChange}
                              type="tel"
                              maxLength={10}
                              inputMode="numeric"
                            />
                          </div>
                          {addressDetails.phone && !validatePhoneNumber(addressDetails.phone) && (
                            <p className="text-[10px] sm:text-xs text-red-500 font-bold ml-1">Enter valid 10-digit number</p>
                          )}
                        </div>

                        {subtotal >= 300 && (
                          <>
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                                <Home size={12} /> House / Flat No. *
                              </label>
                              <input
                                className="input-field text-sm sm:text-base min-w-0"
                                placeholder="Apartment, studio…"
                                value={addressDetails.houseNo}
                                onChange={(e) => setAddressDetails({ ...addressDetails, houseNo: e.target.value })}
                                type="text"
                              />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                                <MapPin size={12} /> Street Address *
                              </label>
                              <input
                                className="input-field text-sm sm:text-base min-w-0"
                                placeholder="Street name, area"
                                value={addressDetails.street}
                                onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                                type="text"
                              />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                              <label className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest ml-1">
                                <Tag size={12} className="text-muted" /> Landmark *
                              </label>
                              <input
                                className="input-field text-sm sm:text-base min-w-0"
                                placeholder="e.g. Opp. Central Mall"
                                value={addressDetails.landmark || ''}
                                onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                                type="text"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {locationValid && deliveryInfo.position && (
                        <div className="pt-4 flex justify-end gap-3">
                          {subtotal >= 300 && editingAddressId && (
                            <Button onClick={handleUpdateAddress} className="btn-secondary px-6 border-primary/20 text-primary">
                              Update Address
                            </Button>
                          )}
                          <Button onClick={handleDeliverHere} className="btn-primary px-8">
                            {subtotal >= 300 ? 'Deliver Here' : 'Confirm Details'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 2: DELIVERY SLOT */}
            <div data-step="2" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border-2 border-border-card overflow-hidden">
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => changeDate(-1)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-border-card bg-surface hover:bg-primary/10 transition text-foreground shrink-0"
                          aria-label="Previous day"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div className="flex-1 text-center">
                          <p className="font-black text-heading text-sm uppercase tracking-widest">
                            {formatDate(deliveryDate)}
                          </p>
                          {deliveryDate.toDateString() === new Date().toDateString() && (
                            <p className="text-[10px] text-primary font-bold mt-0.5 uppercase tracking-widest">Today</p>
                          )}
                        </div>
                        <button
                          onClick={() => changeDate(1)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-border-card bg-surface hover:bg-primary/10 transition text-foreground shrink-0"
                          aria-label="Next day"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => slot.available && setDeliverySlot(slot.value)}
                            disabled={!slot.available}
                            className={`relative p-3 sm:p-4 rounded-2xl border-2 transition-all text-center ${!slot.available
                              ? 'opacity-40 cursor-not-allowed border-border-muted bg-muted/5'
                              : deliverySlot === slot.value
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border-muted hover:border-primary/40 bg-surface/30'
                              }`}
                          >
                            <span className="text-lg sm:text-xl block mb-1">{slot.emoji}</span>
                            <p className="text-[9px] sm:text-[10px] font-black text-heading uppercase tracking-wide leading-tight">
                              {slot.label}
                            </p>
                            {!slot.available && (
                              <span className="text-[8px] text-muted font-bold uppercase tracking-widest mt-1 block">Unavailable</span>
                            )}
                            {deliverySlot === slot.value && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-primary/20">
                                <CheckCircle2 size={10} className="text-button-text" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      {noSlotsAvailable && (
                        <p className="text-sm text-red-500 font-bold mt-3">
                          No delivery slots are available for the selected date. Please choose another day.
                        </p>
                      )}
                      <div className="pt-4 flex justify-between gap-2 sm:gap-3">
                        <Button onClick={() => setActiveStep(1)} className="btn-secondary flex-1 sm:flex-none px-4 sm:px-6 whitespace-nowrap">Back</Button>
                        <Button
                          onClick={handleSlotConfirmed}
                          disabled={!deliverySlot || !availableSlots.some((s) => s.value === deliverySlot && s.available)}
                          className="btn-primary flex-[2] sm:flex-none px-4 sm:px-8 whitespace-nowrap text-sm"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 3: ORDER SUMMARY (ITEMS) */}
            <div data-step="3" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border-2 border-border-card overflow-hidden">
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
                    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                      {cartItems.map((item) => (
                        <div key={`${item.productId}-${item.options?.color || item.selectedFlavor}-${item.options?.weight || item.selectedWeight}`} className="flex gap-4 p-4 sm:p-5 rounded-2xl border-2 border-border/20 relative group bg-card-soft/50">
                          <img src={item.image} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover border border-border/10 shrink-0" alt={item.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-black text-heading uppercase tracking-tight truncate">{item.name}</p>
                            {getItemDescription(item) && (
                              <p className="text-xs text-muted font-medium mt-1 leading-relaxed line-clamp-2">
                                {getItemDescription(item)}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(Array.isArray(item?.category) ? item.category.includes('Custom Cakes') : item?.category === 'Custom Cakes') || item.productId?.startsWith?.('custom-') ? (
                                <>
                                  {(item.options?.color || item.selectedFlavor) && <span className="text-[10px] sm:text-[11px] bg-card text-muted font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-border/30">Color: {item.options?.color || item.selectedFlavor}</span>}
                                  {(item.options?.flavor || item.selectedFlavor) && <span className="text-[10px] sm:text-[11px] bg-card text-muted font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-border/30">Flavor: {item.options?.flavor || item.selectedFlavor}</span>}
                                  {(item.options?.weight || item.selectedWeight) && <span className="text-[10px] sm:text-[11px] bg-card text-muted font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-border/30">Weight: {item.options?.weight || item.selectedWeight}</span>}
                                </>
                              ) : (
                                <>
                                  {item.selectedFlavor && <span className="text-[10px] sm:text-[11px] bg-card text-muted font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-border/30">Flavor: {item.selectedFlavor}</span>}
                                  {item.selectedWeight && <span className="text-[10px] sm:text-[11px] bg-card text-muted font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-border/30">Weight: {item.selectedWeight}</span>}
                                </>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-primary font-black mt-3 uppercase tracking-widest">QTY {item.qty} × {formatCurrency(getFinalItemPrice(item))}</p>
                          </div>
                          <div className="text-right flex flex-col items-end justify-between shrink-0">
                            <p className="font-black text-heading text-sm sm:text-base">{formatCurrency(getFinalItemPrice(item) * item.qty)}</p>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (directItem) {
                                  toast.success('Item removed');
                                  setTimeout(() => navigate('/cart'), 500);
                                } else {
                                  dispatch(removeFromCart(item.productId));
                                  toast.success('Item removed');
                                }
                              }}
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20 hover:border-red-500"
                              title="Remove Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-4 pt-2">
                        {shouldShowCustomCakeRequest ? (
                          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary">From custom cake builder</p>
                              <Link to="/custom-cake" className="text-xs font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"><Edit size={12} /> Edit</Link>
                            </div>
                            <pre className="text-[11px] sm:text-xs text-muted font-medium whitespace-pre-wrap leading-relaxed font-sans bg-card-soft p-3 rounded-xl border border-border/30">
                              {getFormattedCustomNotes()}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-xs text-muted font-bold uppercase tracking-widest text-center opacity-40">No custom notes added</p>
                        )}

                        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-3 border-t-2 border-border/20 border-dashed">
                          <p className="text-[10px] sm:text-xs text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-success" /> Review items before payment
                          </p>
                          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                            <Button onClick={() => setActiveStep(2)} className="btn-secondary flex-1 sm:flex-none px-4 sm:px-6 whitespace-nowrap">Back</Button>
                            <Button onClick={() => setActiveStep(4)} disabled={cartItems.length === 0} className="btn-primary flex-[2] sm:flex-none px-4 sm:px-8 whitespace-nowrap text-sm">Confirm Order</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 4: PAYMENT METHOD */}
            <div data-step="4" className="bg-card rounded-2xl sm:rounded-3xl shadow-card border-2 border-border-card overflow-hidden">
              <StepBadge
                n="4"
                label="Payment Method"
                isActive={activeStep === 4}
                isCompleted={subtotal < 300 ? true : !!selectedPayMethod}
                onEdit={() => setActiveStep(4)}
                summary={subtotal < 300 ? "WhatsApp Shop Pickup" : (selectedPayMethod ? PAYMENT_METHODS.find(m => m.id === selectedPayMethod)?.label : null)}
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
                      {subtotal < 300 ? (
                        <div className="p-4 sm:p-5 rounded-2xl bg-success/5 border-2 border-success/20 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success shrink-0">
                              <Smartphone size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-heading uppercase tracking-widest leading-none mb-1.5">WhatsApp Pickup Order</p>
                              <p className="text-[10px] text-success-text font-black uppercase tracking-widest leading-none">Self-Pickup from Shop</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted leading-relaxed font-bold">
                            No online payment required now. Your order details will be sent directly to our shop WhatsApp chat. You can pick up the order and pay directly at the shop.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card-soft/80 border-2 border-border-muted backdrop-blur-sm">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                              <img src={paymentLogos.razorpay} alt="Razorpay" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-heading uppercase tracking-widest leading-none mb-1">Secure Payment via Razorpay</p>
                              <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60 leading-none">PCI DSS Compliant · 256-bit SSL Encryption</p>
                            </div>
                            <Lock size={13} className="text-muted/40 shrink-0" />
                          </div>

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
                                    : `border-border-muted bg-surface/20 hover:bg-surface/40 hover:border-primary/30`
                                    }`}
                                >
                                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center shadow-sm`}>
                                      <Icon size={17} className="text-white" />
                                    </div>
                                    {selected && (
                                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                                        <CheckCircle2 size={12} className="text-button-text" />
                                      </div>
                                    )}
                                  </div>
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
                                          className="h-4 sm:h-5 w-auto max-w-[40px] object-contain"
                                          onError={(e) => (e.target.style.display = 'none')}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-[9px] text-muted/50 text-center font-bold uppercase tracking-widest italic pt-2">
                            Selecting a method pre-fills its tab in Razorpay checkout
                          </p>
                        </>
                      )}

                      <div className="pt-4 flex justify-between gap-2 sm:gap-3">
                        <Button onClick={() => setActiveStep(3)} className="btn-secondary flex-1 sm:flex-none px-4 sm:px-6 whitespace-nowrap">Back</Button>
                        <Button
                          onClick={() => {
                            document.getElementById('order-summary-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="btn-primary flex-[2] sm:flex-none px-4 sm:px-8 whitespace-nowrap text-sm"
                          disabled={subtotal < 300 ? false : !selectedPayMethod}
                        >
                          Order Summary
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN — ORDER SUMMARY (same as before, keeping it short) */}
          <div className="lg:col-span-1 w-full min-w-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                id="order-summary-section"
                className="bg-card rounded-2xl sm:rounded-3xl shadow-card border-2 border-border-card overflow-hidden w-full min-w-0"
              >
                {/* ... Order summary content remains the same ... */}
                <div className="p-5 sm:p-6 border-b border-border/30 bg-gradient-to-r from-card-soft to-card">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-primary" />
                    <h3 className="font-black text-heading text-sm sm:text-lg uppercase tracking-widest truncate">Order Summary</h3>
                    <span className="ml-auto text-xs sm:text-sm bg-primary/10 text-primary font-black px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
                      {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/20 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.options?.color || item.selectedFlavor || ''}-${item.options?.weight || item.selectedWeight || ''}`}
                      className="flex gap-4 p-4 sm:p-5 w-full min-w-0"
                    >
                      <img src={item.image} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border/10 shrink-0" alt={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-black text-heading truncate uppercase tracking-tight">{item.name}</p>
                        {getItemDescription(item) && (
                          <p className="text-xs sm:text-sm text-muted/80 font-medium mt-1 leading-snug line-clamp-2">
                            {getItemDescription(item)}
                          </p>
                        )}
                        {(() => {
                          const displayFlavor = item.selectedFlavor || item.options?.flavor || item.options?.color;
                          const displayWeight = item.selectedWeight || item.options?.weight;
                          return (
                            <>
                              {displayFlavor && <p className="text-xs sm:text-sm text-muted font-bold mt-1">Flavor: {displayFlavor}</p>}
                              {displayWeight && <p className="text-xs sm:text-sm text-muted font-bold">Weight: {displayWeight}</p>}
                            </>
                          );
                        })()}

                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-2 p-3 bg-card-soft border border-border/40 rounded-xl">
                            <p className="text-xs sm:text-sm text-muted font-black uppercase tracking-widest mb-2">Add-ons included:</p>
                            <div className="flex flex-col gap-2">
                              {item.addons.map((addon, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs sm:text-sm text-heading font-medium">
                                  <span className="flex items-center gap-2">
                                    <Plus size={14} className="text-primary" /> {addon.name}
                                    <span className="text-xs text-muted/60 font-bold ml-1">x{addon.qty || 1}</span>
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span className="mr-1 text-muted/80 font-bold">{formatCurrency(addon.price * (addon.qty || 1))}</span>
                                    <div className="flex items-center gap-1 bg-muted/10 rounded-full px-3 py-1 select-none">
                                      <button
                                        onClick={() => handleCheckoutAddonDecrement(item, addon)}
                                        className="hover:scale-110 font-black text-sm sm:text-base px-1.5 text-heading"
                                      >
                                        −
                                      </button>
                                      <span className="text-xs sm:text-sm font-black w-5 text-center">{addon.qty || 1}</span>
                                      <button
                                        onClick={() => handleCheckoutAddonIncrement(item, addon)}
                                        className="hover:scale-110 font-black text-sm sm:text-base px-1.5 text-heading"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableAddons.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                            <span className="text-xs text-muted/60 font-black uppercase tracking-widest mr-1">Add:</span>
                            {availableAddons
                              .filter(addon => !item.addons?.some(a => a._id === addon._id || a.addonId === addon._id))
                              .map(addon => (
                                <button
                                  key={addon._id}
                                  onClick={() => handleCheckoutAddonIncrement(item, addon)}
                                  className="text-xs font-black text-muted hover:text-primary bg-muted/5 hover:bg-primary/10 border border-border/40 rounded-full px-3 py-1 transition-all uppercase tracking-wider"
                                >
                                  + {addon.name} (₹{addon.price})
                                </button>
                              ))}
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-muted/60 font-black mt-2">QTY {item.qty}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-heading text-base sm:text-lg">
                          {formatCurrency((getFinalItemPrice(item) - (item.addons?.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0) || 0)) * item.qty)}
                        </p>
                        {Number(item.price) > (getFinalItemPrice(item) - (item.addons?.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0) || 0)) && (
                          <p className="text-xs line-through text-muted/40 font-bold">{formatCurrency(Number(item.price) * item.qty)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 sm:p-6 space-y-3 sm:space-y-4 border-t border-border/30 text-sm sm:text-base">
                  <div className="flex justify-between font-bold text-sm sm:text-base uppercase tracking-widest">
                    <span className="text-muted">Product Price</span>
                    <span className="text-heading">{formatCurrency(productOnlyTotal)}</span>
                  </div>
                  {addonOnlyTotal > 0 && (
                    <div className="flex justify-between font-bold text-sm sm:text-base uppercase tracking-widest text-primary">
                      <span>Add-ons Total</span>
                      <span>+ {formatCurrency(addonOnlyTotal)}</span>
                    </div>
                  )}
                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-success-text font-black text-sm sm:text-base uppercase tracking-widest">
                      <span>Offer Discount</span>
                      <span>− {formatCurrency(offerDiscount)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-success-text font-black text-sm sm:text-base uppercase tracking-widest">
                      <span>Coupon ({appliedCouponDisplay})</span>
                      <span>− {formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border/30 pt-3 flex justify-between font-black text-sm sm:text-base uppercase tracking-widest">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-heading">{formatCurrency(subtotal)}</span>
                  </div>
                  {subtotal >= 300 ? (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted font-medium">Delivery Fee</span>
                      <span className="font-black text-heading">{isAddressSelected ? formatCurrency(deliveryFee) : '—'}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted font-medium">Shop Pickup</span>
                      <span className="font-black text-success-text">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted font-medium">GST (18%)</span>
                    <span className="font-black text-heading">{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted font-medium">Convenience Fee (2%)</span>
                    <span className="font-black text-heading">{formatCurrency(convenienceFee)}</span>
                  </div>

                  {(offerDiscount + couponDiscount) > 0 && (
                    <div className="flex items-center justify-between bg-success-light border-2 border-success/30 rounded-xl px-4 py-3 text-success-text font-black text-sm sm:text-base uppercase tracking-widest w-full min-w-0">
                      <div className="flex items-center gap-2">
                        <Star size={14} /> You Save
                      </div>
                      <span>− {formatCurrency(offerDiscount + couponDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-between items-baseline font-black w-full min-w-0">
                      <span className="text-base sm:text-lg text-heading uppercase tracking-widest">Total</span>
                      <div className="text-right">
                        <span className="text-2xl sm:text-3xl text-primary tracking-tight">{formatCurrency(displayTotal)}</span>
                        {backendTotal !== null && (
                          <p className="text-xs text-success-text font-black uppercase tracking-widest mt-1">✓ Confirmed by server</p>
                        )}
                      </div>
                    </div>
                    {subtotal >= 300 && !isAddressSelected && <p className="text-xs sm:text-sm text-warning-text mt-2 text-center font-bold">Select delivery address to calculate delivery fee</p>}
                  </div>
                </div>



                {hasAppliedCoupon && (
                  <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-3 sm:p-3.5 bg-success-light rounded-2xl flex justify-between items-center border-2 border-success/30">
                    <div>
                      <span className="text-[9px] font-black text-success-text uppercase tracking-widest opacity-70">Coupon Applied</span>
                      <p className="text-sm font-mono font-black text-success-text tracking-widest">{appliedCouponDisplay}</p>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="p-2 hover:bg-error-light rounded-xl text-error-text transition-colors">Remove</button>
                  </div>
                )}

                <div className="p-4 sm:p-5 pt-0">
                  {availableUnappliedCoupons.length > 0 && (
                    <div className="mb-4 p-3.5 bg-warning-light rounded-2xl border-2 border-warning/20 text-warning-text flex gap-3 items-center justify-between">
                      <div className="flex gap-3 items-center min-w-0 flex-1">
                        <div className="bg-card p-2 rounded-xl border border-warning/10 shrink-0">
                          <Sparkles size={16} className="text-warning-text animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-wider">Forgot to apply coupon?</p>
                          <p className="text-xs font-bold mt-0.5 leading-snug">
                            Apply <span className="font-mono font-black">{availableUnappliedCoupons[0].code}</span> to save {formatCurrency(availableUnappliedCoupons[0].savings)}!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(availableUnappliedCoupons[0].code)}
                        className="bg-primary text-button-text font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0 border border-primary/20"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full h-12 sm:h-14 text-xs sm:text-sm font-black uppercase tracking-widest rounded-2xl"
                    disabled={
                      !addressDetails.fullName.trim() ||
                      !validatePhoneNumber(addressDetails.phone) ||
                      (subtotal >= 300 && (!deliveryInfo.position || !selectedPayMethod))
                    }
                  >
                    {subtotal < 300 ? (
                      <>
                        <Send size={12} className="mr-1 inline shrink-0" />
                        <span className="truncate">Order via WhatsApp • {formatCurrency(displayTotal)}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} className="mr-1 inline shrink-0" />
                        <span className="truncate">{`Pay Securely ${isAddressSelected ? formatCurrency(displayTotal) : ''}`}</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                    {[
                      { icon: ShieldCheck, label: 'Secure Pay' },
                      { icon: Truck, label: 'Fresh Delivery' },
                      { icon: Sparkles, label: 'Handcrafted' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface/30 border-2 border-border-muted">
                        <Icon size={13} className="text-primary shrink-0" />
                        <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest text-center leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMap && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 40 }}
              className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl h-[85vh] sm:h-[80vh] relative overflow-hidden shadow-premium border-2 border-border-card"
            >
              <button onClick={() => setShowMap(false)} className="absolute top-4 right-4 z-10 bg-surface p-2 sm:p-2.5 rounded-full shadow text-foreground hover:bg-muted/10 transition-colors">
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