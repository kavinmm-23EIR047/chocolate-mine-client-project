import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinary';
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
  Building2,
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
  Minus,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  MoonStar,
  Leaf,
  Check,
  BadgePercent,
  HelpCircle,
  PhoneCall,
  Search
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { clearCart, setCoupon, removeFromCart, updateCartItemAddons } from '../redux/slices/cartSlice';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import MapSelector from '../components/MapSelector';
import ScooterLoader from '../components/ScooterLoader';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

import { formatCurrency, getCouponUnitDiscount, normalizeCartCoupon } from '../utils/helpers';
import {
  lookupPincode,
  geocodePincodeOrAddress,
  searchCoimbatoreLocal,
  POPULAR_COIMBATORE_AREAS,
  isNearShop,
  calculateDistanceKm,
  calculateDrivingDistanceKm,
  calculateDeliveryFee,
  SHOP_LAT,
  SHOP_LNG,
  DELIVERY_RADIUS_KM
} from '../utils/geoUtils';
import {
  loadCustomCakeRequest,
  formatCustomCakeNotes,
  clearCustomCakeRequest,
} from '../utils/customCake';
import api from '../utils/api';
import paymentService from '../services/paymentService';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   PAYMENT LOGOS — Direct High Quality SVG URLs
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
   TIME SLOT CONFIGURATION
───────────────────────────────────────────── */
const slots = [
  { value: '10:00 AM – 12:00 PM', label: '10:00 AM – 12:00 PM', Icon: Sunrise, startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { value: '12:00 PM – 2:00 PM', label: '12:00 PM – 2:00 PM', Icon: Sun, startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 },
  { value: '2:00 PM – 4:00 PM', label: '2:00 PM – 4:00 PM', Icon: CloudSun, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  { value: '4:00 PM – 6:00 PM', label: '4:00 PM – 6:00 PM', Icon: Sunset, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { value: '6:00 PM – 8:00 PM', label: '6:00 PM – 8:00 PM', Icon: Moon, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  { value: '8:00 PM – 10:00 PM', label: '8:00 PM – 10:00 PM', Icon: MoonStar, startHour: 20, startMinute: 0, endHour: 22, endMinute: 0 },
];

/* ─────────────────────────────────────────────
   HELPERS
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

const getCouponCodeString = (coupon) => {
  if (!coupon) return '';
  if (typeof coupon === 'string') return coupon;
  if (typeof coupon === 'object') {
    return coupon.code || coupon.couponCode || coupon.name || '';
  }
  return '';
};

const getCouponCodeForApi = (coupon) => {
  if (!coupon) return null;
  if (typeof coupon === 'string') return coupon;
  if (typeof coupon === 'object') {
    return coupon.code || coupon.couponCode || coupon.name || null;
  }
  return null;
};

const STORAGE_KEYS = {
  DELIVERY_INFO: 'cm_delivery_info',
  ADDRESS_DETAILS: 'cm_address_details',
  DELIVERY_DATE: 'cm_delivery_date',
  DELIVERY_SLOT: 'cm_delivery_slot',
  SELECTED_PAY_METHOD: 'cm_selected_pay_method',
  LOCAL_COUPON: 'cm_local_coupon',
};

/* ─────────────────────────────────────────────
   MAIN CHECKOUT COMPONENT
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

  // Load initial state from sessionStorage
  const loadSavedState = () => {
    try {
      const savedDeliveryInfo = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_INFO);
      const savedAddressDetails = sessionStorage.getItem(STORAGE_KEYS.ADDRESS_DETAILS);
      const savedDeliveryDate = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_DATE);
      const savedDeliverySlot = sessionStorage.getItem(STORAGE_KEYS.DELIVERY_SLOT);
      const savedPayMethod = sessionStorage.getItem(STORAGE_KEYS.SELECTED_PAY_METHOD);
      const savedLocalCoupon = sessionStorage.getItem(STORAGE_KEYS.LOCAL_COUPON);

      return {
        deliveryInfo: savedDeliveryInfo ? JSON.parse(savedDeliveryInfo) : null,
        addressDetails: savedAddressDetails ? JSON.parse(savedAddressDetails) : null,
        deliveryDate: savedDeliveryDate ? new Date(savedDeliveryDate) : null,
        deliverySlot: savedDeliverySlot || null,
        selectedPayMethod: savedPayMethod || 'online',
        localCoupon: (() => {
          if (!savedLocalCoupon) return '';
          try {
            return JSON.parse(savedLocalCoupon);
          } catch {
            return savedLocalCoupon;
          }
        })(),
      };
    } catch {
      return {};
    }
  };

  const savedState = loadSavedState();

  const [localCoupon, setLocalCoupon] = useState(
    savedState.localCoupon || (directItem?.coupon?.code ? directItem.coupon : '')
  );

  const appliedCouponDisplay = useMemo(() => {
    const rawCoupon = directItem ? localCoupon : appliedCouponFromRedux;
    return getCouponCodeString(rawCoupon);
  }, [directItem, localCoupon, appliedCouponFromRedux]);

  const hasAppliedCoupon = appliedCouponDisplay !== '';

  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('Preparing your order...');
  const [couponInput, setCouponInput] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState('online');
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(false);

  const isProcessingPayment = useRef(false);
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const streetInputRef = useRef(null);
  const suggestionsDropdownRef = useRef(null);

  // Address Details State (Direct entry, no saved-address list)
  const [addressDetails, setAddressDetails] = useState(() => {
    return savedState.addressDetails || {
      fullName: user?.name || '',
      phone: user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '',
      houseNo: '',
      street: '',
      landmark: '',
      pincode: '',
    };
  });

  useEffect(() => {
    if (user?.name && !addressDetails.fullName) {
      setAddressDetails(prev => ({ ...prev, fullName: user.name }));
    }
    if (user?.phone && !addressDetails.phone) {
      const digits = user.phone.replace(/\D/g, '').slice(-10);
      setAddressDetails(prev => ({ ...prev, phone: digits }));
    }
  }, [user]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.ADDRESS_DETAILS, JSON.stringify(addressDetails));
  }, [addressDetails]);

  // Delivery Coordinates & Distance State
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const savedPin = String(savedState.addressDetails?.pincode || '').trim();
    const savedStreet = String(savedState.addressDetails?.street || '').trim();
    if (savedPin.length === 6 && savedStreet && savedState.deliveryInfo?.position) {
      return savedState.deliveryInfo;
    }
    return { address: null, position: null };
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [isExactMapPin, setIsExactMapPin] = useState(() => Boolean(savedState.deliveryInfo?.isExactMapPin));
  const [locationValid, setLocationValid] = useState(() => {
    const savedPin = String(savedState.addressDetails?.pincode || '').trim();
    const savedStreet = String(savedState.addressDetails?.street || '').trim();
    return savedPin.length === 6 && Boolean(savedStreet) && Boolean(savedState.deliveryInfo?.position);
  });
  const [locationError, setLocationError] = useState('');
  const [pincodeAreaInfo, setPincodeAreaInfo] = useState(null);
  const [isResolvingPincode, setIsResolvingPincode] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [customCakeRequest, setCustomCakeRequest] = useState(null);
  const [orderNotesExtra, setOrderNotesExtra] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [backendTotal, setBackendTotal] = useState(null);
  const [productDescriptions, setProductDescriptions] = useState({});

  useEffect(() => {
    if (deliveryInfo && deliveryInfo.position) {
      sessionStorage.setItem(STORAGE_KEYS.DELIVERY_INFO, JSON.stringify(deliveryInfo));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_INFO);
    }
  }, [deliveryInfo]);

  // Handle click outside to close street suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsDropdownRef.current &&
        !suggestionsDropdownRef.current.contains(e.target) &&
        streetInputRef.current &&
        !streetInputRef.current.contains(e.target)
      ) {
        setShowStreetSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Delivery Date & Slot State
  const [deliveryDate, setDeliveryDate] = useState(() => {
    if (savedState.deliveryDate) {
      const d = new Date(savedState.deliveryDate);
      if (!isNaN(d.getTime())) return d;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [deliverySlot, setDeliverySlot] = useState(savedState.deliverySlot || null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.DELIVERY_DATE, deliveryDate.toISOString());
  }, [deliveryDate]);

  useEffect(() => {
    if (deliverySlot) {
      sessionStorage.setItem(STORAGE_KEYS.DELIVERY_SLOT, deliverySlot);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_SLOT);
    }
  }, [deliverySlot]);

  // Keep clock updated every minute for accurate slot cutoff
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Horizontal Date List (Next 14 Days)
  const availableDates = useMemo(() => {
    const dates = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const dateCarouselRef = useRef(null);
  const scrollDateCarousel = (direction) => {
    if (dateCarouselRef.current) {
      dateCarouselRef.current.scrollBy({ left: direction * 220, behavior: 'smooth' });
    }
  };

  // Slot availability calculation
  const isSlotAvailableForDate = (slot, date, now) => {
    const current = now || new Date();
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    if (selectedDate > todayDate) return true;
    if (selectedDate < todayDate) return false;

    const slotStartMinutes = slot.startHour * 60 + slot.startMinute;
    const slotEndMinutes = slot.endHour * 60 + slot.endMinute;
    const currentMinutes = current.getHours() * 60 + current.getMinutes();

    return (slotStartMinutes - currentMinutes >= 120) && (currentMinutes < slotEndMinutes);
  };

  const availableSlots = useMemo(() => {
    return slots.map((slot) => ({
      ...slot,
      available: isSlotAvailableForDate(slot, deliveryDate, currentTime),
    }));
  }, [deliveryDate, currentTime]);

  useEffect(() => {
    const currentSelected = availableSlots.find((s) => s.value === deliverySlot);
    if (!currentSelected || !currentSelected.available) {
      const firstAvailable = availableSlots.find((s) => s.available);
      setDeliverySlot(firstAvailable ? firstAvailable.value : null);
    }
  }, [deliveryDate, currentTime, availableSlots]);

  // Active items
  const cartItems = useMemo(
    () => (directItem ? [directItem] : cartItemsFromRedux),
    [directItem, cartItemsFromRedux]
  );

  const getItemOriginalPrice = (item) => {
    const p = item.product || item;
    return Number(p.originalPrice || p.price || 0);
  };

  const getItemBasePrice = (item) => {
    const p = item.product || item;
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    if (!Number.isNaN(vp) && vp > 0) return vp;
    return Number(p.offerPrice != null && p.offerPrice < p.price ? p.offerPrice : p.price || 0);
  };

  const getFinalItemPrice = (item) => {
    const base = getItemBasePrice(item);
    const unitDiscount = getCouponUnitDiscount(base, item.coupon);
    return Math.max(0, base - unitDiscount);
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      let itemPrice = getFinalItemPrice(item);
      let addonSum = 0;
      if (item.addons && Array.isArray(item.addons)) {
        addonSum = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
      }
      return acc + (itemPrice + addonSum) * item.qty;
    }, 0);
  }, [cartItems]);

  const productOnlyTotal = cartItems.reduce((s, i) => {
    const vp = i.variantPrice != null ? Number(i.variantPrice) : NaN;
    const base = !Number.isNaN(vp) && vp > 0 ? vp : Number(i.price);
    return s + base * i.qty;
  }, 0);

  const addonOnlyTotal = cartItems.reduce((s, i) => {
    if (!i.addons || !Array.isArray(i.addons)) return s;
    return s + i.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0) * i.qty;
  }, 0);

  const couponDiscount = useMemo(() => {
    if (directItem) {
      if (localCoupon?.enabled && localCoupon?.discount) {
        const base = getItemBasePrice(directItem);
        return getCouponUnitDiscount(base, localCoupon) * directItem.qty;
      }
      return 0;
    }
    return cartItemsFromRedux.reduce((acc, item) => {
      const base = getItemBasePrice(item);
      const discount = getCouponUnitDiscount(base, appliedCouponFromRedux);
      return acc + discount * item.qty;
    }, 0);
  }, [directItem, localCoupon, cartItemsFromRedux, appliedCouponFromRedux]);

  const isAddressSelected = subtotal < 300 || (
    Boolean(addressDetails.pincode?.trim()?.length === 6) &&
    Boolean(addressDetails.street?.trim()) &&
    Boolean(deliveryInfo?.position) &&
    isExactMapPin &&
    !isNearShop(deliveryInfo.position?.lat, deliveryInfo.position?.lng) &&
    locationValid
  );
  const isMapLocationPicked = isAddressSelected;
  const convenienceFee = Math.round(subtotal * 0.025);
  const clientTotal = subtotal + (isAddressSelected ? deliveryFee : 0) + convenienceFee - couponDiscount;
  const displayTotal = backendTotal !== null ? backendTotal : clientTotal;

  // Address validity helper
  const isAddressValid = useMemo(() => {
    const hasName = Boolean(addressDetails.fullName?.trim());
    const hasPhone = Boolean(addressDetails.phone?.trim() && /^[0-9]{10}$/.test(addressDetails.phone.trim()));
    if (!hasName || !hasPhone) return false;

    if (subtotal >= 300) {
      const hasHouse = Boolean(addressDetails.houseNo?.trim());
      const hasStreet = Boolean(addressDetails.street?.trim());
      const pin = String(addressDetails.pincode || '').trim();
      const hasPin = Boolean(pin.length === 6 && /^[0-9]{6}$/.test(pin));
      const hasMap = Boolean(deliveryInfo?.position && !isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng));
      return hasHouse && hasStreet && hasPin && hasMap && locationValid;
    }
    return true;
  }, [addressDetails, subtotal, deliveryInfo, locationValid]);

  // Form completion reactive check — controls Proceed to Pay button enabled state
  const isFormComplete = useMemo(() => {
    if (!isAddressConfirmed) return false;
    const hasName = Boolean(addressDetails.fullName?.trim());
    const hasPhone = Boolean(addressDetails.phone?.trim() && /^[0-9]{10}$/.test(addressDetails.phone.trim()));
    const hasSlot = Boolean(deliverySlot);
    const sel = slots.find((s) => s.value === deliverySlot);
    const isSlotValid = Boolean(sel && isSlotAvailableForDate(sel, deliveryDate, currentTime));
    if (!hasName || !hasPhone || !hasSlot || !isSlotValid) return false;

    if (subtotal >= 300) {
      const hasHouse = Boolean(addressDetails.houseNo?.trim());
      const hasStreet = Boolean(addressDetails.street?.trim());
      const pin = String(addressDetails.pincode || '').trim();
      const hasPin = Boolean(pin.length === 6 && /^[0-9]{6}$/.test(pin));
      const hasMap = Boolean(deliveryInfo?.position && !isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng));
      return hasHouse && hasStreet && hasPin && hasMap && locationValid;
    }
    return true;
  }, [isAddressConfirmed, addressDetails, deliverySlot, deliveryDate, currentTime, subtotal, deliveryInfo, locationValid]);

  // Specific missing field helper for button label and user feedback
  const missingFieldHint = useMemo(() => {
    if (!isAddressConfirmed) {
      if (!addressDetails.fullName?.trim()) return 'Enter Name';
      if (!addressDetails.phone?.trim() || !/^[0-9]{10}$/.test(addressDetails.phone.trim())) return 'Enter 10-Digit Phone';
      if (subtotal >= 300) {
        if (!addressDetails.houseNo?.trim()) return 'Enter House / Door No';
        if (!addressDetails.street?.trim()) return 'Enter Street / Area';
        const pin = String(addressDetails.pincode || '').trim();
        if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) return 'Enter 6-Digit Pincode';
        if (!deliveryInfo?.position || isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng)) return 'Pin Location on Map';
        if (!locationValid) return locationError || 'Outside Service Area';
      }
      return 'Confirm Address';
    }
    if (!deliverySlot) return 'Pick Delivery Slot';
    const sel = slots.find((s) => s.value === deliverySlot);
    if (!sel || !isSlotAvailableForDate(sel, deliveryDate, currentTime)) return 'Select Available Slot';
    return null;
  }, [isAddressConfirmed, addressDetails, subtotal, deliveryInfo, locationValid, locationError, deliverySlot, deliveryDate, currentTime]);

  const lastMapSelectedPin = useRef(
    savedState.deliveryInfo?.position && savedState.addressDetails?.pincode ? savedState.addressDetails.pincode : null
  );

  // Auto-resolve distance & fee from Pincode and Street
  useEffect(() => {
    const pin = String(addressDetails.pincode || '').trim().replace(/\D/g, '').slice(0, 6);
    const street = String(addressDetails.street || '').trim();

    // BOTH 6-digit pincode AND street are required to auto-verify!
    if (pin.length === 6 && street.length > 0) {
      // If this pin was explicitly chosen from MapSelector and already has coordinates, keep exact pin!
      if (lastMapSelectedPin.current && lastMapSelectedPin.current === pin && deliveryInfo?.position) {
        return;
      }

      let cancelled = false;
      const resolvePin = async () => {
        setIsResolvingPincode(true);
        const match = await geocodePincodeOrAddress(pin, street);
        if (cancelled) return;
        setIsResolvingPincode(false);
        if (match) {
          setPincodeAreaInfo(match);
          setDeliveryInfo({
            position: { lat: match.lat, lng: match.lng },
            address: `${street}, Coimbatore - ${match.pincode}`,
            pincode: match.pincode
          });
          setDistance(match.distanceKm);
          setDeliveryFee(match.deliveryFee);
          setLocationValid(match.isWithinRadius);
          if (!match.isWithinRadius) {
            setLocationError('This pincode is outside our 30km delivery radius in Coimbatore.');
          } else {
            setLocationError('');
          }
        } else {
          setPincodeAreaInfo(null);
          setDeliveryInfo({ address: null, position: null });
          sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_INFO);
          setDistance(0);
          setDeliveryFee(0);
          setLocationValid(false);
          setLocationError('Address not found in Coimbatore delivery area.');
        }
      };
      resolvePin();
      return () => { cancelled = true; };
    } else {
      setPincodeAreaInfo(null);
      if (subtotal >= 300) {
        setDeliveryInfo({ address: null, position: null });
        sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_INFO);
        setDistance(0);
        setDeliveryFee(0);
        setLocationValid(false);
        setLocationError('');
      }
    }
  }, [addressDetails.pincode, addressDetails.street, subtotal]);

  // Recalculate distance when map coordinates change
  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!deliveryInfo.position || deliveryInfo.position.lat === undefined || deliveryInfo.position.lng === undefined) {
        setIsCalculatingDelivery(false);
        return;
      }
      const isShop = isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng);
      setIsCalculatingDelivery(true);
      setLocationValid(false);
      setDistance(0);
      setDeliveryFee(0);
      let dist;
      try {
        dist = await calculateDrivingDistanceKm(deliveryInfo.position.lat, deliveryInfo.position.lng);
      } catch {
        if (cancelled) return;
        setLocationError('Unable to calculate the driving route. Please try again.');
        setIsCalculatingDelivery(false);
        return;
      }
      if (cancelled) return;
      setDistance(dist);
      setDeliveryFee(calculateDeliveryFee(dist));

      if (subtotal >= 300 && isShop) {
        setLocationValid(false);
        setLocationError('Bakery shop address cannot be used for Home Delivery. Please enter your pincode or select your delivery address on the map.');
        setIsCalculatingDelivery(false);
        return;
      }

      if (dist > DELIVERY_RADIUS_KM) {
        setLocationValid(false);
        setLocationError('Delivery is available only inside Coimbatore (within 30km).');
        setIsCalculatingDelivery(false);
        return;
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${deliveryInfo.position.lat}&lon=${deliveryInfo.position.lng}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!(data.display_name || '').toLowerCase().includes('coimbatore')) {
          setLocationValid(false);
          setLocationError('Delivery available only inside Coimbatore service area.');
          setIsCalculatingDelivery(false);
          return;
        }
        setLocationValid(true);
        setLocationError('');
      } catch {
        if (cancelled) return;
        setLocationValid(false);
        setLocationError('Unable to verify that this address is inside Coimbatore. Please try again.');
      } finally {
        if (!cancelled) setIsCalculatingDelivery(false);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, [deliveryInfo.position, subtotal]);

  // Subtotal < 100 auto pickup guard
  useEffect(() => {
    if (subtotal < 100 && subtotal > 0) {
      setDeliveryInfo({
        address: 'Shop Pickup',
        position: { lat: Number(SHOP_LAT), lng: Number(SHOP_LNG) }
      });
      setLocationValid(true);
      setDistance(0);
      setDeliveryFee(0);
    }
  }, [subtotal]);

  const validatePhoneNumber = (p) => /^[0-9]{10}$/.test(String(p || '').trim());

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    setAddressDetails({ ...addressDetails, phone: val });
  };

  // Default search suggestions list (popular Coimbatore areas)
  const getDefaultStreetSuggestions = () => {
    return POPULAR_COIMBATORE_AREAS.slice(0, 8).map(area => {
      const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, area.lat, area.lng);
      return {
        id: `pop_${area.name}`,
        title: area.name,
        subtitle: `${area.locality}, Coimbatore - ${area.pincode}`,
        pincode: area.pincode,
        lat: area.lat,
        lng: area.lng,
        distanceKm: dist,
        deliveryFee: calculateDeliveryFee(dist),
        isLocal: true
      };
    });
  };

  // Helper: Clear both street and pincode, reset verified badge & delivery fee, and show default search options
  const handleClearAddressFields = () => {
    setAddressDetails(prev => ({ ...prev, pincode: '', street: '' }));
    setIsAddressConfirmed(false);
    lastMapSelectedPin.current = null;
    setDeliveryInfo({ address: null, position: null });
    setIsExactMapPin(false);
    sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_INFO);
    setDistance(0);
    setDeliveryFee(0);
    setLocationValid(false);
    setLocationError('');
    setPincodeAreaInfo(null);
    const defaults = getDefaultStreetSuggestions();
    setStreetSuggestions(defaults);
    setShowStreetSuggestions(true);
    if (streetInputRef.current) {
      const inputEl = streetInputRef.current.querySelector('input');
      if (inputEl) inputEl.focus();
    }
  };

  const handleConfirmAddress = () => {
    if (!addressDetails.fullName?.trim()) {
      toast.error('Please enter recipient full name');
      return;
    }
    if (!addressDetails.phone?.trim() || !/^[0-9]{10}$/.test(addressDetails.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (subtotal >= 300) {
      if (isCalculatingDelivery) {
        toast.error('Please wait while we verify the driving distance.');
        return;
      }
      if (!isExactMapPin) {
        toast.error('Please pin your exact delivery address on the map to calculate the route accurately.');
        return;
      }
      if (!addressDetails.houseNo?.trim()) {
        toast.error('Please enter house / door number');
        return;
      }
      if (!addressDetails.street?.trim()) {
        toast.error('Please search or enter street / area');
        return;
      }
      const pin = String(addressDetails.pincode || '').trim();
      if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
        toast.error('Please enter a valid 6-digit Coimbatore pincode');
        return;
      }
      if (!deliveryInfo?.position || isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng)) {
        toast.error('Please verify delivery pin on map or select an area');
        return;
      }
      if (!locationValid) {
        toast.error(locationError || 'Delivery address is outside Coimbatore 30km radius');
        return;
      }
    }

    setIsAddressConfirmed(true);
    toast.success('Address confirmed! Please pick your delivery slot.');

    // Smoothly scroll to Section 2: Delivery Date & Time (Slot)
    setTimeout(() => {
      const slotSection = document.getElementById('section-delivery-slot');
      if (slotSection) {
        slotSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setIsAddressConfirmed(false);
    setIsExactMapPin(false);

    // If pincode is cleared by user -> both pincode & street are removed automatically & verified removed
    if (!val) {
      handleClearAddressFields();
      return;
    }

    setAddressDetails(prev => ({ ...prev, pincode: val }));
    lastMapSelectedPin.current = null;

    if (val.length !== 6) {
      // Incomplete pincode: reset delivery coordinates, fee, and verification
      setDeliveryInfo({ address: null, position: null });
      sessionStorage.removeItem(STORAGE_KEYS.DELIVERY_INFO);
      setDistance(0);
      setDeliveryFee(0);
      setLocationValid(false);
      setLocationError('');
      setPincodeAreaInfo(null);
    }
  };

  const handleStreetChange = (e) => {
    const val = e.target.value;
    setIsExactMapPin(false);

    // If street is cleared by user -> both street & pincode are removed automatically & verified removed
    if (!val.trim()) {
      handleClearAddressFields();
      return;
    }

    setAddressDetails(prev => ({ ...prev, street: val }));
    lastMapSelectedPin.current = null;

    // Show live search suggestions as user types in Street / Area field
    const results = searchCoimbatoreLocal(val);
    setStreetSuggestions(results);
    setShowStreetSuggestions(results.length > 0);
  };

  const handleSelectStreetSuggestion = (item) => {
    const chosenStreet = item.subtitle || item.title;
    const chosenPin = item.pincode;

    setAddressDetails(prev => ({
      ...prev,
      street: chosenStreet,
      pincode: chosenPin
    }));

    setDeliveryInfo({
      position: { lat: item.lat, lng: item.lng },
      address: chosenStreet,
      pincode: chosenPin,
      isExactMapPin: false
    });
    setIsExactMapPin(false);
    setIsCalculatingDelivery(true);
    setLocationValid(false);

    setDistance(0);
    setDeliveryFee(0);
    setLocationValid(false);
    setLocationError('');

    lastMapSelectedPin.current = chosenPin;
    setShowStreetSuggestions(false);
  };

  const validateForm = () => {
    if (!addressDetails.fullName.trim()) {
      toast.error('Please enter full name');
      return false;
    }
    if (!validatePhoneNumber(addressDetails.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    if (subtotal >= 300) {
      if (isCalculatingDelivery) {
        toast.error('Please wait while we verify the driving distance.');
        return false;
      }
      if (!isExactMapPin) {
        toast.error('Please pin your exact delivery address on the map to calculate the route accurately.');
        return false;
      }
      if (!addressDetails.houseNo?.trim()) {
        toast.error('Please enter house / door number');
        return false;
      }
      if (!addressDetails.street?.trim()) {
        toast.error('Please enter street / area');
        return false;
      }
      if (!deliveryInfo.position) {
        toast.error('Please select delivery location on map or enter your 6-digit pincode');
        return false;
      }
      if (isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng)) {
        toast.error('Shop address cannot be used for Home Delivery. Please enter your delivery pincode or select on map.');
        return false;
      }
      if (!locationValid) {
        toast.error(locationError || 'Location outside Coimbatore service area');
        return false;
      }
    }
    if (!deliverySlot) {
      toast.error('Please select a delivery time slot');
      return false;
    }
    const sel = slots.find((s) => s.value === deliverySlot);
    if (sel && !isSlotAvailableForDate(sel, deliveryDate, currentTime)) {
      toast.error('Selected slot is no longer available. Please select another slot.');
      return false;
    }
    return true;
  };

  const handleApplyCoupon = (presetCode) => {
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

  const clearSavedCheckoutData = () => {
    Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
  };

  // Place Order Handler (Preserves 100% of exact backend contract)
  const handlePlaceOrder = async () => {
    if (isProcessingPayment.current) {
      toast.error('Payment already in progress.');
      return;
    }
    if (!validateForm()) return;

    if (!user) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    const isWhatsAppOrder = subtotal < 300 || selectedPayMethod === 'cod';
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!isWhatsAppOrder && !razorpayKey) {
      toast.error('Payment configuration error.');
      return;
    }

    try {
      isProcessingPayment.current = true;
      setLoading(true);
      setLoaderText(isWhatsAppOrder ? 'Placing WhatsApp Order...' : 'Preparing checkout...');

      let loaded = false;
      if (!isWhatsAppOrder) {
        loaded = await loadRazorpayScript();
        if (!loaded) {
          setLoading(false);
          isProcessingPayment.current = false;
          toast.error('Payment gateway unavailable.');
          return;
        }
      }

      const cakeMessage = customCakeRequest?.messageOnCake?.trim() || '';
      const builderNotes = customCakeRequest ? safeFormatNotes(formatCustomCakeNotes(customCakeRequest)) : '';
      const notesMerged = [builderNotes, orderNotesExtra.trim()].filter(Boolean).join('\n\n');

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
            landmark: isWhatsAppOrder ? 'Shop Pickup' : (addressDetails.landmark?.trim() || ''),
            city: 'Coimbatore',
            pincode: isWhatsAppOrder ? '641001' : (addressDetails.pincode || deliveryInfo.pincode || '641001'),
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
              cakeMessage: directItem.cakeMessage || directItem.options?.cakeMessage,
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
        if (!directItem) dispatch(clearCart());
        clearCustomCakeRequest();
        setCustomCakeRequest(null);
        clearSavedCheckoutData();
        setLoading(false);
        isProcessingPayment.current = false;

        const adminPhone = import.meta.env.VITE_ADMIN_PHONE || '9150670077';
        const orderNum = orderNumber || `ORD-${orderId.slice(-6).toUpperCase()}`;

        const itemsList = cartItems.map(item => {
          const optStr = item.selectedFlavor || item.selectedWeight ? ` (${[item.selectedFlavor, item.selectedWeight].filter(Boolean).join(', ')})` : '';
          const finalItemPrice = getFinalItemPrice(item);
          return `• ${item.name} x ${item.qty}${optStr} - ₹${finalItemPrice * item.qty}`;
        }).join('\n');

        const isDelivery = subtotal >= 300;
        const messageText = `🍫 *New ${isDelivery ? 'Delivery' : 'Shop Pickup'} Order*\n\n` +
          `🆔 *Order Number:* #${orderNum}\n` +
          `👤 *Customer Name:* ${addressDetails.fullName}\n` +
          `📞 *Customer Phone:* ${addressDetails.phone}\n` +
          `📍 *Address:* ${addressDetails.houseNo}, ${addressDetails.street}, Coimbatore - ${addressDetails.pincode}\n\n` +
          `🍰 *Items:*\n${itemsList}\n\n` +
          `💰 *Total Amount:* ₹${clientTotal}\n` +
          `📅 *Date:* ${deliveryDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n` +
          `⏰ *Slot:* ${deliverySlot || 'N/A'}\n\n` +
          `Please confirm my order. Thank you!`;

        const waLink = `https://wa.me/91${adminPhone}?text=${encodeURIComponent(messageText)}`;
        toast.success("Order registered! Redirecting to WhatsApp...");
        navigate("/order-success", { state: { orderId, waLink } });
        return;
      }

      if (!razorpayOrder?.id) throw new Error('Invalid order response');

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "The Chocolate Mine",
        description: "Artisan Cake Order Payment",
        image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            setLoading(true);
            setLoaderText("Verifying payment...");
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            if (!directItem) dispatch(clearCart());
            clearCustomCakeRequest();
            setCustomCakeRequest(null);
            clearSavedCheckoutData();
            setLoading(false);
            isProcessingPayment.current = false;
            toast.success("Payment successful! 🎉");
            navigate("/order-success", { state: { orderId } });
          } catch (e) {
            setLoading(false);
            isProcessingPayment.current = false;
            toast.error(e?.response?.data?.message || "Verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            isProcessingPayment.current = false;
            toast.error("Payment cancelled.");
          },
        },
        prefill: {
          name: addressDetails.fullName || user?.name || "",
          email: user?.email || "",
          contact: addressDetails.phone || user?.phone || "",
        },
        theme: {
          color: "#2C1A16",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setLoading(false);
        isProcessingPayment.current = false;
        toast.error('Payment failed. Please try again.');
      });
      setLoading(false);
      rzp.open();
    } catch (err) {
      setLoading(false);
      isProcessingPayment.current = false;
      toast.error(err?.response?.data?.message || 'Failed to place order.');
    }
  };

  const formattedSelectedDate = useMemo(() => {
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, [deliveryDate]);

  if (!loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 border border-border shadow-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-5">
            <Cake size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-heading mb-2">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-muted mb-6">
            Looks like you haven't added any delicious cakes yet. Browse our menu to pick your favorite artisanal treats!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-button-text font-black text-sm shadow-md transition-all active:scale-95"
          >
            <span>Explore Delicious Cakes</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 lg:pb-12 selection:bg-accent/20">
      <ScooterLoader isVisible={loading} text={loaderText} />

      {/* ─── 1. COMPACT STEP PROGRESS HEADER ─── */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border/70 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Back button & Checkout Title (No duplicate logo) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/cart')}
              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 bg-card-soft hover:bg-card text-heading border border-border/60 transition-all shadow-xs active:scale-95 shrink-0"
              title="Back to Cart"
            >
              <ArrowLeft size={14} />
              <span className="text-xs font-bold hidden sm:inline">Back to Cart</span>
            </button>
            <h1 className="text-xs sm:text-sm font-black text-heading uppercase tracking-wider">
              Checkout
            </h1>
          </div>

          {/* Stepper (Clean, well-spaced, interactive) */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-bold tracking-tight shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsAddressConfirmed(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1 text-heading cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                isAddressConfirmed ? 'bg-emerald-500 text-white' : 'bg-accent text-[#1A0C08]'
              }`}>
                {isAddressConfirmed ? <Check size={11} strokeWidth={3} /> : '1'}
              </span>
              <span className="font-bold text-[11px] sm:text-xs">Address</span>
            </button>

            <div className={`w-2.5 sm:w-5 h-[1.5px] transition-colors ${isAddressConfirmed ? 'bg-accent' : 'bg-border'}`} />

            <button
              type="button"
              onClick={() => {
                if (isAddressConfirmed) {
                  document.getElementById('section-delivery-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex items-center gap-1 text-heading cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                isAddressConfirmed && deliverySlot
                  ? 'bg-emerald-500 text-white'
                  : isAddressConfirmed
                    ? 'bg-accent text-[#1A0C08]'
                    : 'bg-card-soft text-muted border border-border'
              }`}>
                {isAddressConfirmed && deliverySlot ? <Check size={11} strokeWidth={3} /> : '2'}
              </span>
              <span className="font-bold text-[11px] sm:text-xs">Slot</span>
            </button>

            <div className={`w-2.5 sm:w-5 h-[1.5px] transition-colors ${isAddressConfirmed && deliverySlot ? 'bg-accent' : 'bg-border'}`} />

            <div className="flex items-center gap-1 text-heading">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                isFormComplete ? 'bg-accent text-[#1A0C08]' : 'bg-card-soft text-muted border border-border'
              }`}>
                3
              </span>
              <span className="font-bold text-[11px] sm:text-xs">Pay</span>
            </div>
          </div>

          {/* Right indicator */}
          <div className="hidden md:flex items-center gap-1 text-xs font-bold text-accent shrink-0">
            <ShieldCheck size={14} className="text-accent shrink-0" />
            <span>100% Secure</span>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN CONTENT GRID ─── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Notice for orders below ₹300 */}
        {subtotal < 300 && subtotal > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-warning-light border border-warning/30 flex items-center gap-2.5 text-warning-text text-xs">
            <span className="text-base shrink-0">⚠️</span>
            <div className="leading-tight">
              <strong>Notice: Shop Pickup Order.</strong> Orders below ₹300 are processed for Shop Pickup at our bakery counter in Coimbatore.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          {/* ─── LEFT COLUMN: FORM SECTIONS ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">

            {/* SECTION 1: DELIVERY ADDRESS */}
            <section className="bg-card rounded-2xl p-4 sm:p-5 shadow-xs border border-border/70 transition-all">
              <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAddressConfirmed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-accent/20 text-accent'
                  }`}>
                    {isAddressConfirmed ? <Check size={13} strokeWidth={3} /> : <MapPin size={13} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-black text-heading tracking-tight leading-tight">
                        Delivery Address
                      </h2>
                      {isAddressConfirmed && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <Check size={9} strokeWidth={3} /> Confirmed
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted">
                      {isAddressConfirmed ? 'Delivering to destination below' : 'Recipient details & destination'}
                    </p>
                  </div>
                </div>

                {/* Header Action: Change Address when confirmed, Select on Map when editing */}
                {isAddressConfirmed ? (
                  <button
                    type="button"
                    onClick={() => setIsAddressConfirmed(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-card-soft hover:bg-card text-accent border border-accent/40 transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Edit size={12} />
                    <span>Change Address</span>
                  </button>
                ) : (
                  subtotal >= 300 && (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-card-soft hover:bg-card text-accent border border-accent/30 transition-all active:scale-95 shadow-2xs"
                    >
                      <Navigation size={12} className="text-accent" />
                      <span>{deliveryInfo.position && addressDetails.pincode?.trim()?.length === 6 && !isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng) ? 'Change Pin' : 'Select on Map'}</span>
                    </button>
                  )
                )}
              </div>

              {isAddressConfirmed ? (
                /* Confirmed Full Address Display */
                <div className="bg-card-soft/60 rounded-xl p-3.5 border border-border/70 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-heading">{addressDetails.fullName}</span>
                      <span className="text-xs font-bold text-muted px-2 py-0.5 rounded-full bg-card border border-border/60">
                        +91 {addressDetails.phone}
                      </span>
                    </div>
                    {subtotal >= 300 ? (
                      <p className="text-xs text-heading font-medium leading-relaxed">
                        {addressDetails.houseNo}, {addressDetails.street}
                        {addressDetails.landmark?.trim() ? `, Near ${addressDetails.landmark.trim()}` : ''}
                        <br />
                        <span className="text-muted font-bold">Coimbatore - {addressDetails.pincode}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted font-medium">Shop Pickup at bakery counter in Coimbatore</p>
                    )}
                  </div>

                  {subtotal >= 300 && deliveryInfo?.position && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span className="truncate">Verified delivery ({distance.toFixed(1)} km from bakery)</span>
                      </div>
                      <span className="font-black text-heading shrink-0">{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Address Inputs & Confirmation */
                <>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-heading">
                        Full Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressDetails.fullName}
                        onChange={(e) => {
                          setAddressDetails({ ...addressDetails, fullName: e.target.value });
                          setIsAddressConfirmed(false);
                        }}
                        placeholder="Recipient's name"
                        className="w-full h-9 sm:h-10 px-3 rounded-lg border border-border/70 bg-card-soft text-heading placeholder:text-muted/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-heading">
                        Phone Number <span className="text-error">*</span>
                      </label>
                      <div className="flex items-center h-9 sm:h-10 rounded-lg border border-border/70 bg-card-soft overflow-hidden focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                        <span className="px-2 h-full flex items-center bg-card text-[11px] font-bold text-muted border-r border-border/70 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          inputMode="numeric"
                          value={addressDetails.phone}
                          onChange={(e) => {
                            handlePhoneChange(e);
                            setIsAddressConfirmed(false);
                          }}
                          placeholder="9150670077"
                          className="w-full h-full px-2.5 bg-transparent text-heading text-xs sm:text-sm focus:outline-none placeholder:text-muted/50"
                        />
                      </div>
                    </div>

                    {/* House / Door No */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-heading">
                        House / Door No. <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressDetails.houseNo}
                        onChange={(e) => {
                          setAddressDetails({ ...addressDetails, houseNo: e.target.value });
                          setIsAddressConfirmed(false);
                        }}
                        placeholder="e.g. 14/A, Golden Apt"
                        className="w-full h-9 sm:h-10 px-3 rounded-lg border border-border/70 bg-card-soft text-heading placeholder:text-muted/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                      />
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-heading">
                          Pincode <span className="text-error">*</span>
                        </label>
                        {isResolvingPincode && (
                          <span className="text-[10px] text-accent font-bold animate-pulse">Calculating delivery...</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          value={addressDetails.pincode}
                          onChange={(e) => {
                            handlePincodeChange(e);
                            setIsAddressConfirmed(false);
                          }}
                          placeholder="e.g. 641011"
                          className="w-full h-9 sm:h-10 px-3 pr-7 rounded-lg border border-border/70 bg-card-soft text-heading text-xs sm:text-sm font-semibold tracking-wider placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                        {addressDetails.pincode && (
                          <button
                            type="button"
                            onClick={() => {
                              handleClearAddressFields();
                              setIsAddressConfirmed(false);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-heading p-0.5 rounded transition-colors"
                            title="Clear Address"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Street / Area with Default Search Option */}
                    <div className="space-y-1 relative" ref={streetInputRef}>
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-heading">
                          Street / Area <span className="text-error">*</span>
                        </label>
                        <span className="text-[10px] text-accent font-semibold flex items-center gap-0.5">
                          <Search size={10} /> Search or select area
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                          <Search size={13} />
                        </div>
                        <input
                          type="text"
                          value={addressDetails.street}
                          onChange={(e) => {
                            handleStreetChange(e);
                            setIsAddressConfirmed(false);
                          }}
                          onClick={() => {
                            const results = addressDetails.street?.trim()
                              ? searchCoimbatoreLocal(addressDetails.street)
                              : getDefaultStreetSuggestions();
                            setStreetSuggestions(results);
                            setShowStreetSuggestions(results.length > 0);
                          }}
                          onFocus={() => {
                            const results = addressDetails.street?.trim()
                              ? searchCoimbatoreLocal(addressDetails.street)
                              : getDefaultStreetSuggestions();
                            setStreetSuggestions(results);
                            setShowStreetSuggestions(results.length > 0);
                          }}
                          placeholder="Search area (e.g. RS Puram, Saibaba Colony)..."
                          className="w-full h-9 sm:h-10 pl-8 pr-7 rounded-lg border border-border/70 bg-card-soft text-heading placeholder:text-muted/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                        {addressDetails.street && (
                          <button
                            type="button"
                            onClick={() => {
                              handleClearAddressFields();
                              setIsAddressConfirmed(false);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-heading p-0.5 rounded transition-colors"
                            title="Clear Address"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Search Autocomplete Dropdown */}
                      {showStreetSuggestions && streetSuggestions.length > 0 && (
                        <div
                          ref={suggestionsDropdownRef}
                          className="absolute left-0 right-0 top-full mt-1 z-50 bg-card rounded-xl border border-border shadow-2xl max-h-56 overflow-y-auto divide-y divide-border/40 py-1"
                        >
                          <div className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-muted bg-card-soft/60 flex items-center justify-between">
                            <span>{addressDetails.street?.trim() ? 'Matching Areas in Coimbatore' : 'Popular Delivery Areas in Coimbatore'}</span>
                            <span className="text-[9px] text-accent font-semibold lowercase">tap to select</span>
                          </div>
                          {streetSuggestions.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectStreetSuggestion(item);
                                setIsAddressConfirmed(false);
                              }}
                              className="w-full px-2.5 py-2 text-left hover:bg-card-soft flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={12} className="text-accent shrink-0" />
                                  <span className="text-xs font-bold text-heading group-hover:text-accent truncate">
                                    {item.title}
                                  </span>
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-card-soft font-semibold text-muted border border-border/50 shrink-0">
                                    {item.pincode}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted truncate pl-4 mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-accent block leading-tight">
                                  ₹10/km
                                </span>
                                <span className="text-[9px] text-muted block">
                                  road route after selection
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Landmark */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-heading">
                        Landmark <span className="text-[10px] font-normal text-muted">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={addressDetails.landmark}
                        onChange={(e) => {
                          setAddressDetails({ ...addressDetails, landmark: e.target.value });
                          setIsAddressConfirmed(false);
                        }}
                        placeholder="e.g. Near Nilgiris"
                        className="w-full h-9 sm:h-10 px-3 rounded-lg border border-border/70 bg-card-soft text-heading placeholder:text-muted/50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  {/* Pin verification banner */}
                  {subtotal >= 300 &&
                    Boolean(addressDetails.pincode?.trim()?.length === 6) &&
                    Boolean(addressDetails.street?.trim()) &&
                    Boolean(deliveryInfo?.position) &&
                    Boolean(deliveryInfo?.isExactMapPin) &&
                    !isNearShop(deliveryInfo.position.lat, deliveryInfo.position.lng) &&
                    locationValid && (
                    <div className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Verified • <strong>{distance.toFixed(1)} km</strong> from bakery • Delivery: <strong>{formatCurrency(deliveryFee)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="text-[11px] font-bold text-accent underline shrink-0 ml-2 cursor-pointer"
                      >
                        Adjust Pin
                      </button>
                    </div>
                  )}

                  {/* Helper prompt if pincode entered but street is missing */}
                  {subtotal >= 300 &&
                    Boolean(addressDetails.pincode?.trim()?.length === 6) &&
                    !addressDetails.street?.trim() && (
                    <div className="mt-3 py-1.5 px-3 rounded-lg bg-card-soft border border-accent/30 text-accent flex items-center gap-1.5 text-xs">
                      <Search size={13} className="shrink-0" />
                      <span>Please search or enter your <strong>Street / Area</strong> to verify address and calculate delivery fee.</span>
                    </div>
                  )}

                  {/* Full Address Preview Card when fields are filled */}
                  {Boolean(addressDetails.fullName?.trim() && addressDetails.phone?.trim() && (subtotal < 300 || (addressDetails.houseNo?.trim() && addressDetails.street?.trim() && addressDetails.pincode?.trim()?.length === 6))) && (
                    <div className="mt-3 p-3 rounded-xl bg-card-soft/70 border border-border/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted">
                        <span className="flex items-center gap-1 text-accent">
                          <MapPin size={11} /> Full Address Preview
                        </span>
                        {isAddressValid && (
                          <span className="text-[10px] text-emerald-500 font-bold lowercase flex items-center gap-0.5">
                            <Check size={11} /> ready to confirm
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-heading font-bold">
                        {addressDetails.fullName} <span className="font-normal text-muted">• +91 {addressDetails.phone}</span>
                      </p>
                      {subtotal >= 300 ? (
                        <p className="text-[11px] text-heading/90 leading-relaxed">
                          {addressDetails.houseNo}, {addressDetails.street}
                          {addressDetails.landmark?.trim() ? `, Near ${addressDetails.landmark.trim()}` : ''}
                          <br />
                          <span className="text-muted font-semibold">Coimbatore - {addressDetails.pincode}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted">Shop Pickup Counter (Coimbatore Bakery)</p>
                      )}
                    </div>
                  )}

                  {/* Confirm Address & Proceed to Slot Button */}
                  <button
                    type="button"
                    onClick={handleConfirmAddress}
                    className={`w-full mt-3 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                      isAddressValid
                        ? 'bg-accent hover:bg-accent-hover text-[#1A0C08]'
                        : 'bg-card-soft text-muted border border-border/70 hover:border-accent/40'
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Address &amp; Proceed to Slot</span>
                    <ChevronRight size={15} />
                  </button>
                </>
              )}
            </section>

            {/* SECTION 2: DELIVERY DATE & TIME (COMPACT CAROUSEL + 3-COL PILL GRID) */}
            <section
              id="section-delivery-slot"
              className={`bg-card rounded-2xl p-4 sm:p-5 shadow-xs border transition-all ${
                isAddressConfirmed ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border/70'
              }`}
            >
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-border/40">
                <div className="w-6 h-6 rounded-md bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                  <Clock size={13} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-heading tracking-tight leading-tight">
                    Delivery Date &amp; Time
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-muted">
                    Freshly prepared for arrival on {formattedSelectedDate}
                  </p>
                </div>
              </div>

              {/* Horizontal Date Picker Carousel */}
              <div className="relative mb-3.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollDateCarousel(-1)}
                    className="w-7 h-7 rounded-lg border border-border/70 bg-card-soft hover:bg-card flex items-center justify-center text-heading shrink-0 transition-all shadow-2xs active:scale-95"
                    aria-label="Previous dates"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div
                    ref={dateCarouselRef}
                    className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {availableDates.map((dateObj) => {
                      const isSelected = deliveryDate.toDateString() === dateObj.toDateString();
                      const isToday = new Date().toDateString() === dateObj.toDateString();
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNumber = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <button
                          key={dateObj.toISOString()}
                          type="button"
                          onClick={() => setDeliveryDate(dateObj)}
                          className={`min-w-[66px] sm:min-w-[76px] py-1.5 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-accent text-[#1A0C08] border-accent font-black shadow-xs scale-[1.02]'
                              : 'bg-card-soft text-body border-border/70 hover:border-accent/60 hover:bg-card'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#1A0C08]' : 'text-muted'}`}>
                            {dayName}
                          </span>
                          <span className="text-xs font-black whitespace-nowrap leading-tight mt-0.5">
                            {dayNumber}
                          </span>
                          {isToday && (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 ${
                              isSelected ? 'bg-black/15 text-[#1A0C08]' : 'bg-accent/15 text-accent'
                            }`}>
                              Today
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollDateCarousel(1)}
                    className="w-7 h-7 rounded-lg border border-border/70 bg-card-soft hover:bg-card flex items-center justify-center text-heading shrink-0 transition-all shadow-2xs active:scale-95"
                    aria-label="Next dates"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Time Slots (Compact 3-Column Pill Grid) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted">
                  <span>Pick a Delivery Slot</span>
                  <span className="text-[10px] font-normal">2hr kitchen prep time</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = deliverySlot === slot.value;
                    const isAvailable = slot.available;

                    return (
                      <button
                        key={slot.value}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => isAvailable && setDeliverySlot(slot.value)}
                        className={`py-2 px-2.5 rounded-xl border text-left transition-all flex items-center justify-between text-xs ${
                          !isAvailable
                            ? 'opacity-40 cursor-not-allowed bg-card-soft/40 border-border/40 text-muted'
                            : isSelected
                              ? 'bg-accent/15 border-2 border-accent text-heading font-black shadow-2xs'
                              : 'bg-card-soft border border-border/70 text-body hover:border-accent/40 hover:bg-card'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] sm:text-xs truncate">
                            {slot.label}
                          </p>
                          <span className={`text-[9px] block ${isAvailable ? 'text-success font-semibold' : 'text-error'}`}>
                            {isAvailable ? 'Available' : 'Passed'}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-accent text-[#1A0C08] flex items-center justify-center shrink-0 ml-1">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 3: ONLINE PAYMENT ONLY (NO COD, CRISP RELIABLE BADGES) */}
            <section className="bg-card rounded-2xl p-4 sm:p-5 shadow-xs border border-border/70 transition-all">
              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/40 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                    <CreditCard size={13} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-heading tracking-tight leading-tight">
                      Payment Method
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-muted">
                      100% Secure Instant Payment via Razorpay
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-accent">
                  <Lock size={12} />
                  <span>Safe &amp; Secure</span>
                </div>
              </div>

              {/* Single Clean Online Payment Card */}
              <div className="p-3.5 rounded-xl border-2 border-accent bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-accent text-[#1A0C08] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-heading leading-tight">
                      Razorpay (UPI • Cards • NetBanking)
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Pay instantly with Google Pay, PhonePe, Paytm, or any card
                    </p>
                  </div>
                </div>

                {/* Crisp Payment Badges that NEVER break */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-black text-[#1B365D] shadow-2xs border border-gray-200 shrink-0">
                    UPI
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-black tracking-tight shadow-2xs border border-gray-200 shrink-0">
                    <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#5f259f] text-[10px] font-bold text-white shadow-2xs shrink-0">
                    PhonePe
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-black text-[#002e6e] shadow-2xs border border-gray-200 shrink-0">
                    Pay<span className="text-[#00b9f5]">tm</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-black italic text-[#1A1F71] shadow-2xs border border-gray-200 shrink-0">
                    VISA
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white shadow-2xs border border-gray-200 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block -mr-1 opacity-90" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90" />
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-black text-[#097939] shadow-2xs border border-gray-200 shrink-0">
                    Ru<span className="text-[#005CA9]">Pay</span>
                  </span>
                </div>
              </div>
            </section>

          </div>

          {/* ─── RIGHT COLUMN: STICKY ORDER SUMMARY ─── */}
          <div id="order-summary-section" className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-3">
            <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-xs border border-border/70 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-accent" />
                  <h3 className="text-sm sm:text-base font-black text-heading tracking-tight">
                    Order Summary
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-card-soft border border-border/60 text-muted">
                  {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Cart Items List */}
              <div className="max-h-[240px] overflow-y-auto divide-y divide-border/40 my-2.5 pr-1">
                {cartItems.map((item) => {
                  const displayFlavor = item.selectedFlavor || item.options?.flavor || item.options?.color;
                  const displayWeight = item.selectedWeight || item.options?.weight;
                  const itemPrice = getFinalItemPrice(item);

                  return (
                    <div key={`${item.productId}-${displayFlavor}-${displayWeight}`} className="py-2.5 flex items-start gap-2.5">
                      <img
                        src={getOptimizedCloudinaryUrl(item.image, 100)}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border/60 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-heading truncate leading-tight">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted mt-0.5">
                          {displayWeight && <span>{displayWeight}</span>}
                          {displayFlavor && <span>• {displayFlavor}</span>}
                        </div>
                        <div className="text-[11px] font-bold text-accent mt-0.5">
                          Qty: {item.qty} × {formatCurrency(itemPrice)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-heading">
                          {formatCurrency(itemPrice * item.qty)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section */}
              <div className="pt-2.5 pb-2 border-t border-border/40">
                {hasAppliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-success-light border border-success/30 text-success-text text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <BadgePercent size={14} />
                      <span>{appliedCouponDisplay}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-error hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-border/70 bg-card-soft text-xs text-heading placeholder:text-muted/50 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="h-9 px-3.5 rounded-lg bg-card-soft hover:bg-card border border-border/70 text-heading text-xs font-bold transition-all shadow-2xs"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown Calculation */}
              <div className="space-y-1.5 pt-2.5 border-t border-border/40 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Product Price</span>
                  <span className="font-bold text-heading">{formatCurrency(productOnlyTotal)}</span>
                </div>

                {addonOnlyTotal > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Add-ons Total</span>
                    <span className="font-bold text-heading">+{formatCurrency(addonOnlyTotal)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success-text font-bold">
                    <span>Coupon Discount</span>
                    <span>−{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-heading">
                    {subtotal < 300 ? 'Shop Pickup (₹0)' : isAddressSelected ? formatCurrency(deliveryFee) : '—'}
                  </span>
                </div>

                <div className="flex justify-between text-muted">
                  <span>Convenience Fee (2.5%)</span>
                  <span className="font-bold text-heading">{formatCurrency(convenienceFee)}</span>
                </div>

                <div className="flex justify-between text-muted">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-success">Included</span>
                </div>

                {/* Grand Total */}
                <div className="pt-2.5 border-t border-border/70 flex items-baseline justify-between">
                  <span className="text-xs sm:text-sm font-bold text-heading tracking-tight">
                    Total Amount
                  </span>
                  <span className="text-lg sm:text-xl font-black text-heading tracking-tight">
                    {formatCurrency(displayTotal)}
                  </span>
                </div>
              </div>

              {/* Big CTA Proceed Button (Desktop) */}
              <div className="mt-4 hidden lg:block">
                <button
                  type="button"
                  disabled={!isFormComplete}
                  onClick={handlePlaceOrder}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                    isFormComplete
                      ? 'bg-accent hover:bg-accent-hover text-[#1A0C08] active:scale-[0.99] cursor-pointer'
                      : 'opacity-40 cursor-not-allowed bg-card-soft text-muted border border-border/50 shadow-none'
                  }`}
                >
                  <Lock size={14} />
                  <span>
                    {isFormComplete
                      ? `Proceed to Pay ${formatCurrency(displayTotal)}`
                      : missingFieldHint ? `Fill: ${missingFieldHint}` : 'Fill Required Details to Pay'}
                  </span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ─── 3. MOBILE STICKY BOTTOM ACTION BAR (COMPACT, DISABLED UNTIL FILLED) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-4 py-2.5 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('order-summary-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-left cursor-pointer group"
            title="View order details"
          >
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-0.5 group-hover:text-heading">
              <span>{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
              <ChevronUp size={11} />
            </span>
            <span className="text-base font-black text-heading tracking-tight block">
              {formatCurrency(displayTotal)}
            </span>
          </button>

          <button
            type="button"
            disabled={!isFormComplete && isAddressConfirmed}
            onClick={() => {
              if (!isAddressConfirmed) {
                handleConfirmAddress();
              } else {
                handlePlaceOrder();
              }
            }}
            className={`flex-1 py-2.5 px-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-1.5 transition-all ${
              (!isAddressConfirmed ? isAddressValid : isFormComplete)
                ? 'bg-accent hover:bg-accent-hover active:scale-95 text-[#1A0C08] cursor-pointer'
                : 'opacity-40 cursor-not-allowed bg-card-soft text-muted border border-border/50 shadow-none'
            }`}
          >
            <Lock size={13} className="shrink-0" />
            <span className="truncate">
              {!isAddressConfirmed
                ? (isAddressValid ? 'Confirm Address & Proceed' : 'Fill Address to Continue')
                : (isFormComplete
                  ? `Proceed to Pay ${formatCurrency(displayTotal)}`
                  : missingFieldHint ? `${missingFieldHint}` : 'Select Delivery Slot')}
            </span>
            <ChevronRight size={14} className="shrink-0" />
          </button>
        </div>
      </div>

      {/* ─── 5. FULL-SCREEN MAP SELECTOR MODAL ─── */}
      <AnimatePresence>
        {showMap && (
          <div className="fixed inset-0 z-[9999] bg-background flex flex-col w-full h-full h-[100dvh] max-h-[100dvh] p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full h-full h-[100dvh] max-h-[100dvh] flex flex-col"
            >
              <MapSelector
                initialPosition={deliveryInfo?.position}
                initialPincode={addressDetails?.pincode}
                onClose={() => setShowMap(false)}
                onSelect={(data) => {
                  lastMapSelectedPin.current = data.pincode || 'MAP_PIN';
                  const exactPinData = { ...data, isExactMapPin: true };
                  setDeliveryInfo(exactPinData);
                  setIsExactMapPin(true);
                  if (data.address || data.pincode) {
                    setAddressDetails(prev => ({
                      ...prev,
                      street: data.address || prev.street || '',
                      pincode: data.pincode || prev.pincode || ''
                    }));
                  }
                  setIsAddressConfirmed(false);
                  setShowMap(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
