/**
 * Geo & Pincode Utilities for Frontend Client
 * Provides instant offline pincode lookup, multi-verification, distance calculation,
 * and shop location prevention for delivery orders.
 */

export const SHOP_LAT = Number(import.meta.env.VITE_SHOP_LAT) || 11.004451331397814;
export const SHOP_LNG = Number(import.meta.env.VITE_SHOP_LNG) || 76.97477228939373;
export const DELIVERY_RADIUS_KM = Number(import.meta.env.VITE_DELIVERY_RADIUS_KM) || 30;

// Comprehensive database of Coimbatore postal codes with centroid coordinates
export const COIMBATORE_PINCODES = {
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

// Popular Coimbatore Areas & Major Landmarks for 1-tap quick pick on Mobile
export const POPULAR_COIMBATORE_AREAS = [
  { name: 'RS Puram', locality: 'R.S. Puram, D.B. Road', pincode: '641002', lat: 11.0095, lng: 76.9496, tags: ['db road', 'tv samy', 'rs puram'] },
  { name: 'Gandhipuram', locality: 'Gandhipuram, Cross Cut Road', pincode: '641012', lat: 11.0183, lng: 76.9680, tags: ['cross cut', '100 feet road', 'gandhipuram', 'bus stand'] },
  { name: 'Peelamedu', locality: 'Peelamedu, Avinashi Road (PSG Tech)', pincode: '641004', lat: 11.0270, lng: 77.0130, tags: ['psg', 'avinashi road', 'fun mall', 'peelamedu'] },
  { name: 'Saibaba Colony', locality: 'Saibaba Colony, N.S.R Road', pincode: '641003', lat: 11.0267, lng: 76.9431, tags: ['nsr road', 'alagesan', 'saibaba colony', 'ganga hospital'] },
  { name: 'Saravanampatti', locality: 'Saravanampatti, IT Corridor (KGISL/CHIL)', pincode: '641028', lat: 11.0792, lng: 77.0016, tags: ['kgisl', 'chil sez', 'kct', 'saravanampatti', 'it corridor'] },
  { name: 'Race Course', locality: 'Race Course, Thomas Park', pincode: '641018', lat: 11.0031, lng: 76.9822, tags: ['race course', 'thomas park', 'circuit house'] },
  { name: 'Vadavalli', locality: 'Vadavalli, Marudhamalai Road', pincode: '641024', lat: 11.0250, lng: 76.8900, tags: ['marudhamalai', 'vadavalli', 'mullai nagar'] },
  { name: 'Singanallur', locality: 'Singanallur, Trichy Road', pincode: '641005', lat: 10.9986, lng: 77.0262, tags: ['trichy road', 'singanallur', 'kamarajar road'] },
  { name: 'Ramanathapuram', locality: 'Ramanathapuram, 80 Feet Road', pincode: '641016', lat: 10.9926, lng: 76.9892, tags: ['ramanathapuram', '80 feet road', 'nanjundapuram', 'sungam'] },
  { name: 'Hopes College', locality: 'Hopes College, Avinashi Road', pincode: '641004', lat: 11.0285, lng: 77.0260, tags: ['hopes', 'hopes college', 'tidel park junction'] },
  { name: 'Thudiyalur', locality: 'Thudiyalur, Mettupalayam Road', pincode: '641020', lat: 11.0776, lng: 76.9427, tags: ['thudiyalur', 'nggo colony', 'mtp road'] },
  { name: 'Kuniyamuthur', locality: 'Kuniyamuthur, Palakkad Road', pincode: '641008', lat: 10.9575, lng: 76.9535, tags: ['kuniyamuthur', 'palakkad road', 'bk pudur'] },
  { name: 'Kovaipudur', locality: 'Kovaipudur (Sri Krishna College)', pincode: '641042', lat: 10.9400, lng: 76.9200, tags: ['kovaipudur', 'skcet', 'vlb'] },
  { name: 'Ganapathy', locality: 'Ganapathy, Sathy Road', pincode: '641006', lat: 11.0375, lng: 76.9830, tags: ['ganapathy', 'sathy road', 'textool'] },
  { name: 'SITRA / Airport', locality: 'Civil Aerodrome / SITRA, Airport Road', pincode: '641013', lat: 11.0315, lng: 77.0425, tags: ['sitra', 'airport', 'kmch', 'civil aerodrome'] },
  { name: 'Town Hall', locality: 'Town Hall, Oppanakara Street', pincode: '641001', lat: 10.9997, lng: 76.9629, tags: ['town hall', 'oppanakara street', 'raja street'] },
  { name: 'Ukkadam', locality: 'Ukkadam, Bus Stand / Bypass', pincode: '641001', lat: 10.9912, lng: 76.9605, tags: ['ukkadam', 'perur bypass', 'big bazaar'] },
  { name: 'Sundarapuram', locality: 'Sundarapuram, Pollachi Road', pincode: '641009', lat: 10.9389, lng: 76.9658, tags: ['sundarapuram', 'pollachi road', 'lic colony'] },
  { name: 'Perur', locality: 'Perur, Siruvani Road', pincode: '641039', lat: 10.9700, lng: 76.9100, tags: ['perur', 'temple', 'siruvani road'] },
  { name: 'Eachanari', locality: 'Eachanari, Pollachi Highway (SIDCO)', pincode: '641042', lat: 10.9160, lng: 76.9690, tags: ['eachanari', 'karpagam', 'sidco'] },
  { name: 'Kavundampalayam', locality: 'Kavundampalayam, MTP Road', pincode: '641011', lat: 11.0456, lng: 76.9360, tags: ['kavundampalayam', 'goundampalayam', 'cheran nagar'] },
  { name: 'Vilankurichi', locality: 'Vilankurichi, TIDEL Park Road', pincode: '641048', lat: 11.0550, lng: 77.0150, tags: ['vilankurichi', 'tidel park', 'cheranma nagar'] },
  { name: 'Ondipudur', locality: 'Ondipudur, Trichy Road Flyover', pincode: '641014', lat: 10.9995, lng: 77.0543, tags: ['ondipudur', 'sihs colony'] },
  { name: 'Podanur', locality: 'Podanur / Kurichi', pincode: '641021', lat: 10.9600, lng: 76.9750, tags: ['podanur', 'kurichi', 'railway colony'] },
  { name: 'Vellalore', locality: 'Vellalore', pincode: '641019', lat: 10.9650, lng: 77.0150, tags: ['vellalore', 'bus terminus'] },
  { name: 'Keeranatham', locality: 'Keeranatham, CHIL SEZ (KGiSL)', pincode: '641035', lat: 11.0880, lng: 77.0120, tags: ['keeranatham', 'chil sez', 'saravanampatti ext'] },
  { name: 'Kalapatti', locality: 'Kalapatti, Nehru Nagar', pincode: '641044', lat: 11.0722, lng: 77.0372, tags: ['kalapatti', 'nehru nagar', 'sharp nagar'] },
  { name: 'Sulur', locality: 'Sulur, Air Force Road', pincode: '641046', lat: 11.0100, lng: 77.1200, tags: ['sulur', 'rvs', 'air force'] }
];

/**
 * Calculate distance in kilometers between two coordinates using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
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
 * Check if a coordinate is within the shop perimeter (< 400 meters)
 */
export const isNearShop = (lat, lng, thresholdKm = 0.4) => {
  if (lat == null || lng == null) return false;
  const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
  return dist <= thresholdKm;
};

/**
 * Find the nearest Coimbatore known area/locality from given coordinates
 */
export const findNearestCoimbatoreArea = (lat, lng) => {
  if (lat == null || lng == null) return null;
  let closest = null;
  let minDistance = Infinity;

  // Search popular areas first
  for (const area of POPULAR_COIMBATORE_AREAS) {
    const d = calculateDistanceKm(lat, lng, area.lat, area.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = {
        name: area.name,
        locality: area.locality,
        pincode: area.pincode,
        lat: area.lat,
        lng: area.lng,
        distanceFromShopKm: calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng),
        distanceToCentroidKm: d
      };
    }
  }

  // Also check all pincodes
  for (const [pin, data] of Object.entries(COIMBATORE_PINCODES)) {
    const d = calculateDistanceKm(lat, lng, data.lat, data.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = {
        name: data.name.split('/')[0].trim(),
        locality: `${data.name}, Coimbatore`,
        pincode: pin,
        lat: data.lat,
        lng: data.lng,
        distanceFromShopKm: calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng),
        distanceToCentroidKm: d
      };
    }
  }

  return closest;
};

/**
 * Instant local search for Coimbatore areas, landmarks, and pincodes (0ms response)
 */
export const searchCoimbatoreLocal = (query) => {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const digitsOnly = query.replace(/\D/g, '');

  const matches = [];
  const addedKeys = new Set();

  // 1. Direct Pincode matching
  if (digitsOnly.length >= 2) {
    for (const [pin, data] of Object.entries(COIMBATORE_PINCODES)) {
      if (pin.startsWith(digitsOnly) || pin.includes(digitsOnly)) {
        const key = `pin_${pin}`;
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, data.lat, data.lng);
          matches.push({
            id: key,
            title: data.name,
            subtitle: `Coimbatore - ${pin} (Postal Area)`,
            pincode: pin,
            lat: data.lat,
            lng: data.lng,
            distanceKm: dist,
            deliveryFee: Math.round(dist * 10),
            isLocal: true
          });
        }
      }
    }
  }

  // 2. Popular Areas and Landmark Matching
  for (const area of POPULAR_COIMBATORE_AREAS) {
    const matchName = area.name.toLowerCase().includes(cleanQ);
    const matchLocality = area.locality.toLowerCase().includes(cleanQ);
    const matchTags = area.tags && area.tags.some(t => t.includes(cleanQ));
    const matchPin = area.pincode.includes(cleanQ);

    if (matchName || matchLocality || matchTags || matchPin) {
      const key = `area_${area.name}_${area.pincode}`;
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, area.lat, area.lng);
        matches.push({
          id: key,
          title: area.name,
          subtitle: `${area.locality}, Coimbatore - ${area.pincode}`,
          pincode: area.pincode,
          lat: area.lat,
          lng: area.lng,
          distanceKm: dist,
          deliveryFee: Math.round(dist * 10),
          isLocal: true
        });
      }
    }
  }

  // Sort matches by relevance: exact match first, then by proximity to shop
  matches.sort((a, b) => {
    const aExact = a.title.toLowerCase().startsWith(cleanQ);
    const bExact = b.title.toLowerCase().startsWith(cleanQ);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.distanceKm - b.distanceKm;
  });

  return matches.slice(0, 8);
};

/**
 * Instant local lookup for 6-digit postal code
 */
export const lookupPincode = (pincode) => {
  if (!pincode) return null;
  const cleanPin = String(pincode).trim().replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  if (COIMBATORE_PINCODES[cleanPin]) {
    const data = COIMBATORE_PINCODES[cleanPin];
    const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, data.lat, data.lng);
    return {
      pincode: cleanPin,
      name: data.name,
      lat: data.lat,
      lng: data.lng,
      distanceKm: dist,
      deliveryFee: Math.round(dist * 10),
      isCoimbatore: true,
      isWithinRadius: dist <= DELIVERY_RADIUS_KM
    };
  }

  return null;
};

/**
 * Geocode pincode or address with multi-verification (local database first + Nominatim fallback)
 */
export const geocodePincodeOrAddress = async (pincode, street = '') => {
  const cleanPin = String(pincode || '').trim().replace(/\D/g, '').slice(0, 6);
  
  // Tier 1: Local lookup (instant & guaranteed accurate for Coimbatore)
  const localMatch = lookupPincode(cleanPin);
  if (localMatch) {
    return localMatch;
  }

  // Tier 2: Nominatim geocoding if outside local table or street provided
  if (cleanPin.length === 6 || (street && street.trim().length > 3)) {
    try {
      const query = [street, cleanPin, 'Coimbatore', 'Tamil Nadu', 'India'].filter(Boolean).join(', ');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
        return {
          pincode: cleanPin,
          name: item.display_name?.split(',')[0] || 'Coimbatore Area',
          lat,
          lng,
          distanceKm: dist,
          deliveryFee: Math.round(dist * 10),
          isCoimbatore: (item.display_name || '').toLowerCase().includes('coimbatore'),
          isWithinRadius: dist <= DELIVERY_RADIUS_KM
        };
      }
    } catch (err) {
      console.error('Online geocoding failed:', err);
    }
  }

  return null;
};
