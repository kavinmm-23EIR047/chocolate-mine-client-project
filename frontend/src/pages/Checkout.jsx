import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  X,
  Tag,
  Cake,
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { clearCart, setCoupon } from '../redux/slices/cartSlice';
import { useCreateOrderMutation } from '../services/api/orderApi';
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

const Checkout = () => {
  const dispatch = useDispatch();
  const cartItemsFromRedux = useSelector((state) => state.cart.items);
  const appliedCouponFromRedux = useSelector((state) => state.cart.appliedCoupon);
  const [createOrder, { isLoading: orderCreating }] = useCreateOrderMutation();
  
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
  const [loaderText, setLoaderText] = useState('Preparing your order...');
  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  // Prevent duplicate payment attempts
  const isProcessingPayment = useRef(false);

  const [deliveryInfo, setDeliveryInfo] = useState({
    address: null,
    position: null,
  });

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


  // Define slots with end times for validation
  const slots = [
    { value: '10am-1pm', label: 'Morning (10 AM - 1 PM)', endHour: 13, endMinute: 0 },
    { value: '1pm-4pm', label: 'Afternoon (1 PM - 4 PM)', endHour: 16, endMinute: 0 },
    { value: '4pm-7pm', label: 'Evening (4 PM - 7 PM)', endHour: 19, endMinute: 0 },
    { value: '7pm-10pm', label: 'Night (7 PM - 10 PM)', endHour: 22, endMinute: 0 },
  ];

  const [deliverySlot, setDeliverySlot] = useState(null);

  const [customCakeRequest, setCustomCakeRequest] = useState(null);
  const [orderNotesExtra, setOrderNotesExtra] = useState('');

  useEffect(() => {
    const saved = loadCustomCakeRequest();
    if (saved && typeof saved === 'object') setCustomCakeRequest(saved);
  }, []);

  // Function to check if a slot is available for a given date
  const isSlotAvailableForDate = (slot, date) => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // For future dates (tomorrow or later), all slots are available
    if (selectedDate > currentDate) {
      return true;
    }

    // For today, check based on current time
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeDecimal = currentHour + (currentMinute / 60);

    // Slot cutoff time = end time - 1 hour
    const cutoffTimeDecimal = slot.endHour - 1;

    // Slot is available if current time is before cutoff time
    return currentTimeDecimal < cutoffTimeDecimal;
  };

  // Get slots with availability status for current date
  const getSlotsWithAvailability = () => {
    const todaySlots = slots.map(slot => ({
      ...slot,
      available: isSlotAvailableForDate(slot, deliveryDate)
    }));

    // Check if any slot is available today
    const hasAvailableSlot = todaySlots.some(slot => slot.available);

    // If no slots available today, auto-switch to tomorrow
    if (!hasAvailableSlot && deliveryDate.toDateString() === new Date().toDateString()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(tomorrow);
      return slots.map(slot => ({ ...slot, available: true }));
    }

    return todaySlots;
  };

  // Get available slots for current date
  const availableSlots = getSlotsWithAvailability();

  // Set default available slot when date changes
  useEffect(() => {
    const firstAvailableSlot = availableSlots.find(slot => slot.available);
    if (firstAvailableSlot) {
      setDeliverySlot(firstAvailableSlot.value);
    } else {
      setDeliverySlot(null);
    }
  }, [deliveryDate]);

  // Handle date change
  const handleDateChange = (increment) => {
    const newDate = new Date(deliveryDate);
    newDate.setDate(newDate.getDate() + increment);
    setDeliveryDate(newDate);
  };

  // Check if today has any available slots
  const hasAvailableSlotsToday = () => {
    const todaySlots = slots.map(slot => isSlotAvailableForDate(slot, new Date()));
    return todaySlots.some(slot => slot);
  };

  // ==================== PRICE CALCULATION ====================

  const getItemBasePrice = (item) => {
    const hasOfferPrice = item.offerPrice !== undefined &&
      item.offerPrice !== null &&
      Number(item.offerPrice) > 0 &&
      Number(item.offerPrice) < Number(item.price);
    return hasOfferPrice ? Number(item.offerPrice) : Number(item.price);
  };

  const getItemCouponDiscount = (item) => {
    const code = directItem ? normalizeCartCoupon(localCoupon) : normalizeCartCoupon(appliedCouponFromRedux);
    if (!code || !item.coupon?.enabled) return 0;
    if (code !== normalizeCartCoupon(item.coupon.code)) return 0;

    const basePrice = getItemBasePrice(item);
    return getCouponUnitDiscount(basePrice, item.coupon);
  };

  const getFinalItemPrice = (item) => {
    return getItemBasePrice(item) - getItemCouponDiscount(item);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const validateLocation = async () => {
      if (!deliveryInfo.position) return;

      const dist = calculateDistance(
        SHOP_LAT, SHOP_LNG,
        deliveryInfo.position.lat,
        deliveryInfo.position.lng
      );
      setDistance(dist);
      setDeliveryFee(Math.max(30, Math.round(dist * 4)));

      // Condition B: Distance Check
      if (dist > DELIVERY_RADIUS) {
        setLocationValid(false);
        setLocationError("Delivery available only inside Coimbatore service area (within 30km).");
        return;
      }

      // Condition A: Address Check (Coimbatore)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${deliveryInfo.position.lat}&lon=${deliveryInfo.position.lng}`);
        const data = await res.json();
        const fullAddress = data.display_name || '';

        if (!fullAddress.toLowerCase().includes('coimbatore')) {
          setLocationValid(false);
          setLocationError("Delivery available only inside Coimbatore service area.");
          return;
        }

        setLocationValid(true);
        setLocationError('');
      } catch (error) {
        console.error("Location validation error:", error);
        // Fallback to basic check if geocoding fails
        setLocationValid(true);
      }
    };

    validateLocation();
  }, [deliveryInfo.position]);


  const cartItems = directItem ? [directItem] : cartItemsFromRedux;

  const subtotal = cartItems.reduce((sum, item) =>
    sum + getFinalItemPrice(item) * item.qty, 0
  );

  const originalTotal = cartItems.reduce((sum, item) =>
    sum + Number(item.price) * item.qty, 0
  );

  const offerDiscount = cartItems.reduce((sum, item) => {
    const mrp = Number(item.price);
    const base = getItemBasePrice(item);
    return sum + (mrp - base) * item.qty;
  }, 0);

  const couponDiscount = cartItems.reduce((sum, item) => {
    return sum + getItemCouponDiscount(item) * item.qty;
  }, 0);

  const gst = Math.round(subtotal * 0.18);
  const convenienceFee = Math.round(subtotal * 0.02);
  const total = subtotal + deliveryFee + gst + convenienceFee;

  // Check if address is selected
  const isAddressSelected = deliveryInfo.position !== null;

  // ==================== FETCH ADDRESSES ====================

  useEffect(() => {
    // Initial data verification
  }, [user, directItem]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        setSavedAddresses(res.data.data);
        const defaultAddr = res.data.data.find(a => a.isDefault);
        if (defaultAddr) {
          handleSelectAddress(defaultAddr);
        }
      } catch (err) {
        console.error('Failed to fetch addresses');
      }
    };
    if (user) fetchAddresses();
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setDeliveryInfo({
      address: `${addr.houseNo}, ${addr.street}, ${addr.city}`,
      position: { lat: addr.lat, lng: addr.lng }
    });
    setAddressDetails({
      fullName: addr.fullName,
      phone: addr.phone,
      houseNo: addr.houseNo,
      street: addr.street
    });
  };

  // Phone number validation (exactly 10 digits)
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    if (!addressDetails.fullName.trim()) {
      toast.error('Please enter full name');
      return false;
    }
    if (!addressDetails.phone.trim()) {
      toast.error('Please enter phone number');
      return false;
    }
    if (!validatePhoneNumber(addressDetails.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!addressDetails.houseNo.trim() && !addressDetails.street.trim() && !deliveryInfo.address) {
      toast.error('Please enter a delivery address');
      return false;
    }
    if (!deliveryInfo.position) {
      toast.error('Please select delivery location on map');
      return false;
    }
    if (!deliverySlot) {
      toast.error('Please select a delivery slot');
      return false;
    }

    // Final slot availability check before submission
    const selectedSlot = slots.find(s => s.value === deliverySlot);
    if (selectedSlot && !isSlotAvailableForDate(selectedSlot, deliveryDate)) {
      toast.error('Selected delivery slot is no longer available. Please choose another slot.');
      return false;
    }

    if (!locationValid) {
      toast.error(locationError || 'Selected location is outside our service area');
      return false;
    }

    return true;
  };


  const handleApplyCoupon = async (presetCode) => {
    const raw = presetCode != null ? String(presetCode) : couponInput;
    const code = raw.trim().toUpperCase();
    if (!code) return toast.error('Enter coupon code');
    
    if (directItem) {
      if (directItem.coupon?.enabled && directItem.coupon.code.toUpperCase() === code) {
        setLocalCoupon(directItem.coupon.code.toUpperCase());
        toast.success(`Coupon ${code} applied`);
        setCouponInput('');
      } else {
        toast.error('Invalid coupon for this item');
      }
      return;
    }

    // For Redux cart, we just check if it's valid for any item
    const isValid = cartItemsFromRedux.some(i => normalizeCartCoupon(i.coupon?.code) === code);
    if (isValid) {
      dispatch(setCoupon(code));
      toast.success(`Coupon ${code} applied`);
      setCouponInput('');
    } else {
      toast.error('Invalid coupon for items in bag');
    }
  };

  const handleRemoveCoupon = async () => {
    if (directItem) {
      setLocalCoupon('');
      toast.success('Coupon removed');
      return;
    }
    dispatch(setCoupon(null));
    toast.success('Coupon removed');
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePlaceOrder = async () => {
    // Prevent duplicate payment attempts
    if (isProcessingPayment.current) {
      toast.error('Payment already in progress. Please wait.');
      return;
    }

    if (!validateForm()) return;

    const token = sessionStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    // Check if Razorpay key is configured
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error('Payment configuration error. Please contact support.');
      console.error('Razorpay key is missing');
      return;
    }

    try {
      isProcessingPayment.current = true;
      setLoading(true);
      setLoaderText('Preparing your order...');

      const loadingInterval = setInterval(() => {
        setLoaderText(prev => {
          const messages = ['Confirming delivery address...', 'Calculating total...', 'Almost there...'];
          const nextIndex = messages.indexOf(prev) + 1;
          return nextIndex < messages.length ? messages[nextIndex] : prev;
        });
      }, 2000);

      const payload = {
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
        deliveryDate: deliveryDate,
        deliverySlot,
        directItem: directItem ? {
          productId: directItem.productId,
          qty: directItem.qty,
          selectedFlavor: directItem.selectedFlavor,
          selectedWeight: directItem.selectedWeight,
          appliedCoupon: localCoupon
        } : undefined,
      };

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        clearInterval(loadingInterval);
        setLoading(false);
        isProcessingPayment.current = false;
        toast.error('Payment gateway unavailable. Please check your internet connection.');
        return;
      }

      // Create order with backend
      const cakeMessage = customCakeRequest?.messageOnCake?.trim() || '';
      const builderNotes = customCakeRequest ? formatCustomCakeNotes(customCakeRequest) : '';
      const notesMerged = [builderNotes, orderNotesExtra.trim()].filter(Boolean).join('\n\n');

      const res = await api.post('/payment/create-order', {
        address: payload.address,
        deliveryDate: payload.deliveryDate,
        deliverySlot: payload.deliverySlot,
        directItem: payload.directItem,
        items: cartItemsFromRedux,
        notes: notesMerged || undefined,
        cakeMessage: cakeMessage || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { razorpayOrder, orderId, pricing } = res.data.data;

      // Validate order response
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Invalid order response from server');
      }

      // If backend pricing differs (rounding/config), prefer backend as source of truth.
      // This prevents UI showing a different payable amount than Razorpay.
      if (pricing?.total !== undefined && deliveryInfo.position) {
        const backendTotal = Number(pricing.total);
        const uiTotal = Number(total);
        if (Number.isFinite(backendTotal) && Math.abs(backendTotal - uiTotal) >= 1) {
          toast(`Total updated to ${formatCurrency(backendTotal)} (finalized by server)`);
        }
      }

      clearInterval(loadingInterval);
      setLoading(false);

      // Get prefill data from selected address or user
      const prefillName = addressDetails.fullName || user?.name || '';
      const prefillContact = addressDetails.phone || user?.phone || '';
      const prefillEmail = user?.email || '';

      // Razorpay options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'The Chocolate Mine',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            setLoading(true);
            setLoaderText('Verifying your payment...');

            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!directItem) {
              dispatch(clearCart());
            }
            clearCustomCakeRequest();
            setLoading(false);
            isProcessingPayment.current = false;
            toast.success('Payment successful! 🎉');
            navigate('/order-success', { state: { orderId } });
          } catch (verifyErr) {
            setLoading(false);
            isProcessingPayment.current = false;
            console.error('Payment verification error:', verifyErr);
            toast.error(verifyErr?.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: async function () {
            setLoading(false);
            isProcessingPayment.current = false;
            try {
              await api.post('/payment/log-failure', {
                orderId,
                reason: 'User closed payment window',
              });
            } catch (e) {
              console.error('Failed to log payment dismissal', e);
            }
            toast.error('Payment cancelled. You can try again.');
          },
        },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
        theme: { color: '#4A2C2A' },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', async function (response) {
        setLoading(false);
        isProcessingPayment.current = false;

        try {
          await api.post('/payment/log-failure', {
            orderId,
            reason: response.error?.description || 'Payment failed',
          });
        } catch (e) {
          console.error('Failed to log payment failure', e);
        }

        toast.error(`Payment failed: ${response.error?.description || 'Please try again'}`);
      });

      // ✅ FIX: Only call open() once
      razorpayInstance.open();

    } catch (err) {
      setLoading(false);
      isProcessingPayment.current = false;

      if (err?.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      console.error('Order creation error:', err);
      toast.error(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setTimeout(() => {
        if (isProcessingPayment.current) {
          isProcessingPayment.current = false;
          setLoading(false);
          toast.error('Payment timed out. Please try again.');
        }
      }, 60000);
    }
  };

  const availableCoupons = useMemo(() => {
    const coupons = new Set();
    cartItems.forEach(item => {
      if (item.coupon?.enabled) {
        coupons.add(item.coupon.code);
      }
    });
    return Array.from(coupons);
  }, [cartItems]);

  // Handle phone number input
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAddressDetails({ ...addressDetails, phone: value });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = deliveryDate.toDateString() === new Date().toDateString();
  const showDateSelector = !hasAvailableSlotsToday() && isToday;

  return (
    <div className="min-h-screen bg-background">
      <ScooterLoader isVisible={loading} text={loaderText} />

      {/* Header */}
      <div className="bg-navbar text-navbar-text border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <button onClick={() => navigate('/cart')} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft size={14} />
              Back to Cart
            </button>
            <ChevronRight size={14} />
            <span className="font-bold text-foreground">Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN - Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Delivery Address */}
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-card-soft">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-button-text flex items-center justify-center text-[10px] font-black">1</div>
                  <h2 className="font-black text-heading text-sm uppercase tracking-widest">Delivery Address</h2>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest">Saved Addresses</p>
                    <div className="grid gap-3">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr._id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`text-left p-6 border-2 rounded-[1.5rem] transition-all shadow-sm relative overflow-hidden group ${selectedAddressId === addr._id
                            ? 'border-accent bg-accent/5'
                            : 'border-border/30 hover:border-accent/30 bg-surface/30'
                            }`}
                        >
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <span className="font-black text-heading text-base uppercase tracking-tight">{addr.fullName}</span>
                              <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 italic">{addr.phone}</p>
                            </div>
                            {selectedAddressId === addr._id && (
                              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-primary shadow-sm">
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted font-bold mt-4 line-clamp-2 leading-relaxed relative z-10">{addr.houseNo}, {addr.street}</p>
                          {selectedAddressId === addr._id && (
                            <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/20"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px]">
                        <span className="bg-card px-3 text-muted font-black uppercase tracking-widest">OR</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowMap(true)}
                  className="w-full p-4 border-2 border-dashed border-border rounded-xl text-center text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all"
                >
                  + Add New Address via Map
                </button>

                {deliveryInfo.position && (
                  <div className="mt-4 p-4 bg-success-light rounded-xl border border-success/10">
                    <p className="text-sm font-black text-success-text uppercase tracking-widest">Delivery Location Selected</p>
                    <p className="text-xs text-success-text mt-1 font-medium">{deliveryInfo.address}</p>
                    <p className="text-xs text-success-text/80 mt-1 font-bold uppercase tracking-widest">{distance.toFixed(1)} km from our bakery</p>
                  </div>
                )}


                <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-border/30">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-2">Full Name *</label>
                    <input
                      className="input-field"
                      placeholder="Recipient name"
                      value={addressDetails.fullName}
                      onChange={(e) => setAddressDetails({ ...addressDetails, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-2">Phone Number *</label>
                    <input
                      className="input-field"
                      placeholder="Contact number"
                      value={addressDetails.phone}
                      onChange={handlePhoneChange}
                      type="tel"
                      maxLength={10}
                    />
                    {addressDetails.phone && !validatePhoneNumber(addressDetails.phone) && (
                      <p className="text-xs text-error-text mt-1 font-bold">Please enter a valid 10-digit phone number</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-2">House/Flat No. *</label>
                    <input
                      className="input-field"
                      placeholder="Apartment, studio, or floor"
                      value={addressDetails.houseNo}
                      onChange={(e) => setAddressDetails({ ...addressDetails, houseNo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-2">Street/Landmark *</label>
                    <input
                      className="input-field"
                      placeholder="Nearby building or area"
                      value={addressDetails.street}
                      onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Slot */}
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-card-soft">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-button-text flex items-center justify-center text-[10px] font-black">2</div>
                  <h2 className="font-black text-heading text-sm uppercase tracking-widest">Delivery Slot</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.value}
                      onClick={() => setDeliverySlot(slot.value)}
                      className={`p-4 text-center border rounded-lg transition-all ${deliverySlot === slot.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/50 hover:border-primary/40 bg-surface'
                        }`}
                    >
                      <Clock size={18} className="mx-auto mb-2 text-muted" />
                      <p className="text-xs font-black text-heading uppercase tracking-widest">{slot.label}</p>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted text-center mt-3 font-bold">
                  {deliveryDate.toDateString() === new Date().toDateString()
                    ? 'Slots available until 1 hour before end time'
                    : 'All slots available for future dates'}
                </p>
              </div>
            </div>

            {/* Custom cake + notes (from builder / optional) */}
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-card-soft">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-button-text flex items-center justify-center text-[10px] font-black">
                    <Cake size={14} strokeWidth={2.5} />
                  </div>
                  <h2 className="font-black text-heading text-sm uppercase tracking-widest">Custom cake & notes</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {customCakeRequest ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Saved from custom cake builder</p>
                      <Link
                        to="/custom-cake"
                        className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline shrink-0"
                      >
                        Edit
                      </Link>
                    </div>
                    <pre className="text-[11px] text-muted font-medium whitespace-pre-wrap leading-relaxed font-sans">
                      {formatCustomCakeNotes(customCakeRequest)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs text-muted font-medium leading-relaxed">
                    Want lettering, tiers, or a theme?{' '}
                    <Link to="/custom-cake" className="font-black text-primary hover:underline">
                      Open the custom cake form
                    </Link>{' '}
                    — your choices attach here automatically when you save.
                  </p>
                )}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-2">
                    Extra notes for the bakery (optional)
                  </label>
                  <textarea
                    className="input-field min-h-[88px] resize-y py-3 text-sm"
                    placeholder="Gate code, allergy info, delivery instructions…"
                    value={orderNotesExtra}
                    onChange={(e) => setOrderNotesExtra(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment - Online Only */}
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-card-soft">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-button-text flex items-center justify-center text-[10px] font-black">3</div>
                  <h2 className="font-black text-heading text-sm uppercase tracking-widest">Payment Method</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="p-5 border border-primary/30 rounded-2xl bg-primary/5">
                  <CreditCard size={24} className="mb-3 text-primary" />
                  <p className="font-black text-heading text-sm uppercase tracking-widest">Online Payment Only</p>
                  <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wider">Cards, UPI, NetBanking via Razorpay</p>
                </div>
                <p className="text-[10px] text-muted/40 mt-4 text-center font-bold uppercase tracking-widest italic">We only accept online payments for a seamless and secure experience.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
                <h3 className="font-black text-heading text-xs uppercase tracking-widest mb-6">ORDER SUMMARY</h3>

                <div className="max-h-64 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedFlavor || ''}-${item.selectedWeight || ''}`}
                      className="flex gap-4"
                    >
                      <img src={item.image} className="w-14 h-14 rounded-xl object-cover border border-border/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-heading truncate uppercase tracking-tight">{item.name}</p>
                        {item.selectedFlavor && (
                          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Flavor: {item.selectedFlavor}</p>
                        )}
                        {item.selectedWeight && (
                          <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Weight: {item.selectedWeight}</p>
                        )}
                        <p className="text-[10px] text-muted/60 font-black mt-1">QTY: {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-heading text-sm tracking-tight">{formatCurrency(getFinalItemPrice(item) * item.qty)}</p>
                        {Number(item.price) > getFinalItemPrice(item) && (
                          <p className="text-[10px] line-through text-muted/40 font-bold">{formatCurrency(Number(item.price) * item.qty)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm border-t border-border/30 pt-6">
                  <div className="flex justify-between font-bold">
                    <span className="text-muted text-[11px] uppercase tracking-widest">Total MRP</span>
                    <span className="text-heading">{formatCurrency(originalTotal)}</span>
                  </div>

                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-success font-black text-[11px] uppercase tracking-widest">
                      <span>Offer Discount</span>
                      <span>- {formatCurrency(offerDiscount)}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-success font-black text-[11px] uppercase tracking-widest">
                      <span>Coupon ({appliedCouponDisplay})</span>
                      <span>- {formatCurrency(couponDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-border/30 pt-2 flex justify-between font-black">
                    <span className="text-muted text-[11px] uppercase tracking-widest">Subtotal</span>
                    <span className="text-heading">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted font-medium">Delivery Fee</span>
                    <span className="text-heading font-black">{deliveryInfo.position ? formatCurrency(deliveryFee) : '--'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted font-medium">GST (18%)</span>
                    <span className="text-heading font-black">{deliveryInfo.position ? formatCurrency(gst) : '--'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted font-medium">Convenience Fee</span>
                    <span className="text-heading font-black">{deliveryInfo.position ? formatCurrency(convenienceFee) : '--'}</span>
                  </div>

                  {(offerDiscount + couponDiscount) > 0 && (
                    <div className="bg-success-light rounded-xl px-4 py-3 flex justify-between text-success-text font-black text-xs uppercase tracking-widest border border-success/10">
                      <span>You Save</span>
                      <span>- {formatCurrency(offerDiscount + couponDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 mt-1">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {deliveryInfo.position ? formatCurrency(total) : '--'}
                      </span>
                    </div>
                    {!isAddressSelected && (
                      <p className="text-xs text-warning-text mt-2 text-center font-bold">
                        Please select delivery address to see complete total
                      </p>
                    )}
                  </div>
                </div>

                {!hasAppliedCoupon && cartItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest mb-4">
                      <Tag size={16} />
                      <span>Apply coupon</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="input-field font-black uppercase tracking-widest h-12 flex-1 min-w-0"
                        placeholder="ENTER CODE"
                        value={couponInput}
                        disabled={couponBusy || hasAppliedCoupon}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponBusy || hasAppliedCoupon}
                        className="bg-primary text-button-text hover:brightness-110 px-8 h-12 shrink-0"
                      >
                        {couponBusy ? '…' : 'APPLY'}
                      </Button>
                    </div>
                    {availableCoupons.length > 0 && !hasAppliedCoupon && (
                      <p className="text-[10px] text-muted font-bold mt-3 mb-2 uppercase tracking-widest">Available on this order</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availableCoupons.map((code) => (
                        <button
                          key={code}
                          type="button"
                          disabled={couponBusy || hasAppliedCoupon}
                          onClick={() => handleApplyCoupon(code)}
                          className="px-3 py-1.5 bg-surface/10 rounded-lg text-[10px] font-black text-heading font-mono hover:bg-surface/20 transition-colors uppercase tracking-widest border border-border/10"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasAppliedCoupon && (
                  <div className="mt-6 p-4 bg-success-light rounded-2xl flex justify-between items-center border border-success/10">
                    <div>
                      <span className="text-[10px] font-black text-success-text uppercase tracking-widest opacity-60">Coupon Applied</span>
                      <p className="text-sm font-mono font-black text-success-text tracking-widest">{appliedCouponDisplay}</p>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="text-[10px] font-black text-error uppercase tracking-widest hover:underline">Remove</button>
                  </div>
                )}

                <Button
                  onClick={handlePlaceOrder}
                  className="w-full mt-6"
                  disabled={!addressDetails.fullName.trim() || !addressDetails.phone.trim() || !deliveryInfo.position}
                >
                  {`PAY ${isAddressSelected ? formatCurrency(total) : '---'}`}
                </Button>

                <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-muted/40 font-black uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  <span>Secure Transaction</span>
                  <span>•</span>
                  <Truck size={14} />
                  <span>Fresh Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {showMap && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-3xl w-full max-w-4xl h-[80vh] relative overflow-hidden shadow-premium border border-border"
            >
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-4 right-4 z-10 bg-surface p-2.5 rounded-full shadow-premium text-foreground hover:bg-muted/10 transition-colors"
              >
                <X size={20} />
              </button>
              <MapSelector
                onSelect={(data) => {
                  setDeliveryInfo(data);
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