/**
 * Geo & Pincode Utilities for Coimbatore Service Area
 * Protects against shop location exploits and provides multi-tier verification
 */

const SHOP_LAT = Number(process.env.SHOP_LAT ?? 11.004451331397814);
const SHOP_LNG = Number(process.env.SHOP_LNG ?? 76.97477228939373);
const MAX_DELIVERY_RADIUS_KM = Number(process.env.DELIVERY_RADIUS_KM ?? 30);

// Comprehensive database of Coimbatore district postal codes with centroid coordinates
const COIMBATORE_PINCODES = {
  '641001': { name: 'Town Hall / Coimbatore H.O', lat: 10.9997, lng: 76.9629 },
  '641002': { name: 'R.S. Puram', lat: 11.0095, lng: 76.9496 },
  '641003': { name: 'Saibaba Colony', lat: 11.0267, lng: 76.9431 },
  '641004': { name: 'Peelamedu', lat: 11.0270, lng: 77.0130 },
  '641005': { name: 'Singanallur', lat: 10.9986, lng: 77.0262 },
  '641006': { name: 'Ganapathy', lat: 11.0375, lng: 76.9830 },
  '641007': { name: 'Ramnagar', lat: 11.0125, lng: 76.9635 },
  '641008': { name: 'Kuniyamuthur', lat: 10.9575, lng: 76.9535 },
  '641009': { name: 'Sundarapuram', lat: 10.9389, lng: 76.9658 },
  '641010': { name: 'Vadavalli West', lat: 11.0280, lng: 76.9015 },
  '641011': { name: 'Kavundampalayam', lat: 11.0456, lng: 76.9360 },
  '641012': { name: 'Gandhipuram / Tatabad', lat: 11.0183, lng: 76.9680 },
  '641013': { name: 'Civil Aerodrome / SITRA', lat: 11.0315, lng: 77.0425 },
  '641014': { name: 'Ondipudur', lat: 10.9995, lng: 77.0543 },
  '641015': { name: 'Irugur', lat: 11.0167, lng: 77.0833 },
  '641016': { name: 'Ramanathapuram', lat: 10.9926, lng: 76.9892 },
  '641017': { name: 'Kovaipudur', lat: 10.9400, lng: 76.9200 },
  '641018': { name: 'Race Course / Uppilipalayam', lat: 11.0031, lng: 76.9822 },
  '641019': { name: 'Vellalore', lat: 10.9650, lng: 77.0150 },
  '641020': { name: 'Thudiyalur', lat: 11.0776, lng: 76.9427 },
  '641021': { name: 'Podanur / Kurichi', lat: 10.9600, lng: 76.9750 },
  '641022': { name: 'Sowripalayam', lat: 11.0050, lng: 77.0080 },
  '641023': { name: 'Telungupalayam', lat: 10.9980, lng: 76.9250 },
  '641024': { name: 'Vadavalli / Marudhamalai', lat: 11.0250, lng: 76.8900 },
  '641025': { name: 'Periyanaickenpalayam', lat: 11.1400, lng: 76.9350 },
  '641026': { name: 'Veerakeralam', lat: 11.0150, lng: 76.9050 },
  '641027': { name: 'Selvapuram', lat: 10.9850, lng: 76.9450 },
  '641028': { name: 'Saravanampatti', lat: 11.0792, lng: 77.0016 },
  '641029': { name: 'Pappanaickenpalayam', lat: 11.0150, lng: 76.9800 },
  '641030': { name: 'Sundakkamuthur', lat: 10.9450, lng: 76.9350 },
  '641031': { name: 'Madukkarai', lat: 10.9050, lng: 76.9600 },
  '641032': { name: 'Madukkarai Market', lat: 10.9000, lng: 76.9550 },
  '641033': { name: 'Chettipalayam', lat: 10.9050, lng: 77.0400 },
  '641034': { name: 'Goundampalayam', lat: 11.0400, lng: 76.9400 },
  '641035': { name: 'Keeranatham / CHIL SEZ', lat: 11.0880, lng: 77.0120 },
  '641036': { name: 'Karamadai', lat: 11.2400, lng: 76.9600 },
  '641037': { name: 'Rathinapuri', lat: 11.0300, lng: 76.9700 },
  '641038': { name: 'Mettupalayam', lat: 11.3000, lng: 76.9400 },
  '641039': { name: 'Perur', lat: 10.9700, lng: 76.9100 },
  '641041': { name: 'Siruvani / Alandurai', lat: 10.9450, lng: 76.7900 },
  '641042': { name: 'Eachanari / SIDCO', lat: 10.9160, lng: 76.9690 },
  '641043': { name: 'Kovaipudur West', lat: 10.9350, lng: 76.9150 },
  '641044': { name: 'Kalapatti', lat: 11.0722, lng: 77.0372 },
  '641045': { name: 'Malumichampatti', lat: 10.8932, lng: 76.9930 },
  '641046': { name: 'Sulur', lat: 11.0100, lng: 77.1200 },
  '641047': { name: 'Kurumbapalayam / SSK', lat: 11.1100, lng: 77.0400 },
  '641048': { name: 'Vilankurichi', lat: 11.0550, lng: 77.0150 },
  '641049': { name: 'Kovaipudur Central', lat: 10.9420, lng: 76.9250 },
  '641062': { name: 'Karunya Nagar', lat: 10.9350, lng: 76.7450 }
};

/**
 * Calculate distance in kilometers between two coordinates using Haversine formula
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2)) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
      Math.cos(nLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a coordinate is within the shop perimeter (e.g. within 400 meters)
 */
const isNearShop = (lat, lng, thresholdKm = 0.4) => {
  if (lat == null || lng == null) return false;
  const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
  return dist <= thresholdKm;
};

/**
 * Lookup coordinates for a given 6-digit postal code
 */
const resolvePincode = (pincode) => {
  if (!pincode) return null;
  const cleanPin = String(pincode).trim().replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  if (COIMBATORE_PINCODES[cleanPin]) {
    return {
      pincode: cleanPin,
      name: COIMBATORE_PINCODES[cleanPin].name,
      lat: COIMBATORE_PINCODES[cleanPin].lat,
      lng: COIMBATORE_PINCODES[cleanPin].lng,
      isCoimbatore: true
    };
  }

  return null;
};

/**
 * Multi-verification of delivery coordinates & calculation of distance / charge.
 * - Prevents users from pinning the shop location for free delivery on delivery orders.
 * - Automatically falls back to pincode geocoding if coordinates are missing or set to the shop.
 */
const resolveDeliveryCoordinates = ({
  lat,
  lng,
  pincode,
  isDelivery = true,
  shopLat = SHOP_LAT,
  shopLng = SHOP_LNG
}) => {
  let targetLat = Number(lat);
  let targetLng = Number(lng);
  const cleanPin = String(pincode || '').trim().replace(/\D/g, '').slice(0, 6);
  const pinData = resolvePincode(cleanPin);

  const hasValidProvidedCoords =
    Number.isFinite(targetLat) &&
    Number.isFinite(targetLng) &&
    targetLat !== 0 &&
    targetLng !== 0;

  let isShopCoordinate = false;
  if (hasValidProvidedCoords) {
    const distFromShop = calculateDistanceKm(shopLat, shopLng, targetLat, targetLng);
    isShopCoordinate = distFromShop < 0.4; // within 400m
  }

  let isResolvedFromPincode = false;

  // If this is a delivery order and the coordinate is missing, invalid, or placed on the shop:
  if (isDelivery && (!hasValidProvidedCoords || isShopCoordinate)) {
    if (pinData) {
      targetLat = pinData.lat;
      targetLng = pinData.lng;
      isResolvedFromPincode = true;
      isShopCoordinate = false;
    }
  }

  const finalDistance = calculateDistanceKm(shopLat, shopLng, targetLat, targetLng);
  // Rate: ₹10 per km rounded to nearest integer
  const deliveryCharge = isDelivery ? Math.max(0, Math.round(finalDistance * 10)) : 0;

  return {
    lat: targetLat || null,
    lng: targetLng || null,
    distanceKm: finalDistance,
    deliveryCharge,
    isResolvedFromPincode,
    isShopLocation: isShopCoordinate,
    areaName: pinData?.name || null,
    isWithinServiceRadius: finalDistance <= MAX_DELIVERY_RADIUS_KM
  };
};

module.exports = {
  SHOP_LAT,
  SHOP_LNG,
  MAX_DELIVERY_RADIUS_KM,
  COIMBATORE_PINCODES,
  calculateDistanceKm,
  isNearShop,
  resolvePincode,
  resolveDeliveryCoordinates
};
