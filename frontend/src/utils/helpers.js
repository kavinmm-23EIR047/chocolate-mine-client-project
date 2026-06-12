import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const truncate = (str, len = 50) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

/** Unit discount for one item (matches backend cart pricing). basePrice = offer/sale price before coupon. */
export const getCouponUnitDiscount = (basePrice, coupon) => {
  if (!coupon?.enabled || basePrice == null || Number.isNaN(Number(basePrice))) return 0;
  const bp = Number(basePrice);
  const t = coupon.type;
  if (t === 'percent') {
    return Math.round((bp * Number(coupon.value)) / 100);
  }
  if (t === 'flat') {
    return Math.min(bp, Number(coupon.value));
  }
  if (t === 'price') {
    return Math.max(0, bp - Number(coupon.value));
  }
  return 0;
};

export const idsMatch = (a, b) => String(a ?? '') === String(b ?? '');

export const normalizeCartCoupon = (raw) => {
  if (raw == null) return '';
  if (typeof raw === 'object' && raw.code) {
    raw = raw.code;
  }
  const s = String(raw).trim();
  return s === '' || s === '[object Object]' ? '' : s.toUpperCase();
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
