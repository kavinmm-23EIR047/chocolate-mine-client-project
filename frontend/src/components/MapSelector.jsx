import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Tooltip } from 'react-leaflet';
import { 
  Search, X, Check, Loader2, AlertCircle, RotateCcw, Store, MapPin, ChevronLeft, ChevronRight, Plus, Minus
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { 
  POPULAR_COIMBATORE_AREAS, 
  COIMBATORE_PINCODES,
  searchCoimbatoreLocal,
  findNearestCoimbatoreArea,
  lookupPincode, 
  isNearShop, 
  calculateDistanceKm, 
  calculateDrivingDistanceKm,
  calculateDeliveryFee,
  SHOP_LAT, 
  SHOP_LNG, 
  DELIVERY_RADIUS_KM 
} from '../utils/geoUtils';

// Default Leaflet Icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [26, 38],
  iconAnchor: [13, 38]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Shop Marker (Bakery POI Badge with Bakery Colors)
const shopDivIcon = L.divIcon({
  className: 'custom-bakery-poi-icon',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto; transform: translate(-50%, -100%);">
      <div style="background: #24120b; color: #fde047; padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.5); border: 1.5px solid #eab308; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; font-family: system-ui, sans-serif;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        <span>The Chocolate Mine (Shop)</span>
      </div>
      <svg width="28" height="36" viewBox="0 0 26 34" fill="none">
        <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34S26 22.75 26 13C26 5.82 20.18 0 13 0Z" fill="#D97706"/>
        <circle cx="13" cy="13" r="8.5" fill="#FFFFFF"/>
        <path d="M8.5 10.5h9v1.5h-9zm1 2.5h7v4h-7z" fill="#D97706"/>
      </svg>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

const extractPincode = (data) => {
  if (!data) return '';
  if (data.address && data.address.postcode) {
    const code = String(data.address.postcode).replace(/[^0-9]/g, '');
    if (code.length === 6) return code;
  }
  const match = String(data.display_name || '').match(/\b641[0-9]{3}\b/) || String(data.display_name || '').match(/\b6[0-9]{5}\b/);
  return match ? match[0] : '';
};

const formatAddressDetails = (data, lat, lng) => {
  if (lat != null && lng != null && isNearShop(lat, lng)) {
    return {
      primary: 'The Chocolate Mine Bakery',
      secondary: 'Race Course Road, Gopalapuram, Coimbatore - 641001',
      pincode: '641001',
      fullAddress: 'The Chocolate Mine Bakery (Shop Location), Race Course, Coimbatore - 641001',
      isShop: true
    };
  }

  const nearest = findNearestCoimbatoreArea(lat, lng);
  const addr = data?.address || {};
  
  let street = addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
  
  if (!street || /^Ward\s+\d+/i.test(street)) {
    if (addr.suburb && !/^Ward\s+\d+/i.test(addr.suburb)) {
      street = addr.suburb;
    } else if (addr.road) {
      street = addr.road;
    } else if (nearest) {
      street = nearest.name;
    } else {
      street = 'Coimbatore Location';
    }
  }

  let locality = addr.suburb || addr.neighbourhood || addr.residential || (nearest ? nearest.name : 'Coimbatore');
  if (/^Ward\s+\d+/i.test(locality) && nearest) {
    locality = nearest.name;
  }

  const city = 'Coimbatore';
  const pin = extractPincode(data) || (nearest ? nearest.pincode : '641012');

  let primaryLine = street;
  if (locality && locality !== street && !street.toLowerCase().includes(locality.toLowerCase())) {
    primaryLine = `${street}, ${locality}`;
  }

  const secondaryLine = `${city} - ${pin}`;
  const fullClean = `${primaryLine}, ${city} - ${pin}`;

  return {
    primary: primaryLine,
    secondary: secondaryLine,
    pincode: pin,
    fullAddress: fullClean,
    isShop: false
  };
};

// React Leaflet Map Controller
const MapController = ({ onMapMoveStart, onMapMoveEnd, onMapClick, setMapInstance }) => {
  const map = useMapEvents({
    movestart() {
      onMapMoveStart();
    },
    moveend() {
      const center = map.getCenter();
      onMapMoveEnd({ lat: center.lat, lng: center.lng });
    },
    click(e) {
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.35 });
      if (onMapClick) onMapClick(e.latlng);
    }
  });

  useEffect(() => {
    if (setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  return null;
};

const MapSelector = ({ initialPosition, initialPincode, onSelect, onClose }) => {
  const defaultCoimbatoreCenter = useMemo(() => ({ lat: 11.0183, lng: 76.9680 }), []); // Gandhipuram / RS Puram central hub

  // Determine starting position
  const startingPos = useMemo(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      return { lat: Number(initialPosition.lat), lng: Number(initialPosition.lng) };
    }
    if (initialPincode) {
      const pinMatch = lookupPincode(initialPincode);
      if (pinMatch) return { lat: pinMatch.lat, lng: pinMatch.lng };
    }
    return defaultCoimbatoreCenter;
  }, [initialPosition, initialPincode, defaultCoimbatoreCenter]);

  const [position, setPosition] = useState(startingPos);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Address Information
  const [addressDetails, setAddressDetails] = useState(() => formatAddressDetails(null, startingPos.lat, startingPos.lng));
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingOnlineSearch, setIsLoadingOnlineSearch] = useState(false);

  const reverseGeocodeTimerRef = useRef(null);
  const chipsContainerRef = useRef(null);

  // Distance & Delivery Calculation
  const isAtShop = isNearShop(position?.lat, position?.lng);
  const deliveryFee = calculateDeliveryFee(distance);
  const isOutOfRadius = distance != null && distance > DELIVERY_RADIUS_KM;

  useEffect(() => {
    let cancelled = false;
    if (isAtShop) {
      setDistance(0);
      setIsCalculatingRoute(false);
      setRouteError('');
      return undefined;
    }

    setDistance(null);
    setIsCalculatingRoute(true);
    setRouteError('');
    const timer = setTimeout(async () => {
      try {
        const routeDistance = await calculateDrivingDistanceKm(position?.lat, position?.lng);
        if (!cancelled) setDistance(routeDistance);
      } catch {
        if (!cancelled) setRouteError('Unable to calculate the driving route. Please try again.');
      } finally {
        if (!cancelled) setIsCalculatingRoute(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [position, isAtShop]);

  // Reverse Geocoding Function
  const fetchAddressForCoords = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      if (isNearShop(lat, lng)) {
        setAddressDetails(formatAddressDetails(null, lat, lng));
        return;
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        setAddressDetails(formatAddressDetails(data, lat, lng));
      } else {
        setAddressDetails(formatAddressDetails(null, lat, lng));
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setAddressDetails(formatAddressDetails(null, lat, lng));
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Map Movement Handlers
  const handleMapMoveStart = useCallback(() => {
    setIsMapMoving(true);
    if (reverseGeocodeTimerRef.current) {
      clearTimeout(reverseGeocodeTimerRef.current);
    }
  }, []);

  const handleMapMoveEnd = useCallback((newPos) => {
    setIsMapMoving(false);
    setPosition(newPos);

    const nearest = findNearestCoimbatoreArea(newPos.lat, newPos.lng);
    if (nearest && !isNearShop(newPos.lat, newPos.lng)) {
      setAddressDetails(prev => ({
        ...prev,
        primary: nearest.name,
        secondary: `${nearest.locality}, Coimbatore - ${nearest.pincode}`,
        pincode: nearest.pincode,
        fullAddress: `${nearest.locality}, Coimbatore - ${nearest.pincode}`,
        isShop: false
      }));
    }

    if (reverseGeocodeTimerRef.current) {
      clearTimeout(reverseGeocodeTimerRef.current);
    }

    reverseGeocodeTimerRef.current = setTimeout(() => {
      fetchAddressForCoords(newPos.lat, newPos.lng);
    }, 280);
  }, [fetchAddressForCoords]);

  // Initial geocode on mount
  useEffect(() => {
    fetchAddressForCoords(startingPos.lat, startingPos.lng);
    return () => {
      if (reverseGeocodeTimerRef.current) clearTimeout(reverseGeocodeTimerRef.current);
    };
  }, [startingPos, fetchAddressForCoords]);

  // Fly Map to coordinate smoothly
  const flyToCoords = useCallback((lat, lng, zoom = 16) => {
    if (mapInstance && Number.isFinite(lat) && Number.isFinite(lng)) {
      mapInstance.flyTo([lat, lng], zoom, {
        duration: 0.6,
        easeLinearity: 0.25
      });
      setPosition({ lat, lng });
    }
  }, [mapInstance]);

  // Quick Area Chip Click
  const handleSelectAreaChip = (area) => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (reverseGeocodeTimerRef.current) clearTimeout(reverseGeocodeTimerRef.current);
    
    flyToCoords(area.lat, area.lng, 16);
    setAddressDetails({
      primary: area.name,
      secondary: `${area.locality}, Coimbatore - ${area.pincode}`,
      pincode: area.pincode,
      fullAddress: `${area.locality}, Coimbatore - ${area.pincode}`,
      isShop: false
    });
  };

  const scrollChips = (dir) => {
    if (chipsContainerRef.current) {
      const amount = dir === 'left' ? -280 : 280;
      chipsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Autocomplete Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const localMatches = searchCoimbatoreLocal(searchQuery);
    setSuggestions(localMatches);
    setShowSuggestions(localMatches.length > 0);

    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(async () => {
        setIsLoadingOnlineSearch(true);
        try {
          const q = searchQuery.trim();
          const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Coimbatore, Tamil Nadu')}&limit=8&addressdetails=1&countrycodes=in&viewbox=76.75,10.80,77.25,11.25&bounded=0`;
          const res = await fetch(searchUrl);
          const data = await res.json();

          if (Array.isArray(data) && data.length > 0) {
            const onlineResults = data.map((item, idx) => {
              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              const dist = calculateDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
              const cleanDetails = formatAddressDetails(item, lat, lng);
              return {
                id: `online_${idx}_${lat}_${lng}`,
                title: cleanDetails.primary,
                subtitle: cleanDetails.secondary,
                pincode: cleanDetails.pincode,
                lat,
                lng,
                distanceKm: dist,
                deliveryFee: calculateDeliveryFee(dist),
                isLocal: false
              };
            });

            setSuggestions(prev => {
              const existingTitles = new Set(localMatches.map(m => m.title.toLowerCase()));
              const filteredOnline = onlineResults.filter(o => !existingTitles.has(o.title.toLowerCase()));
              return [...localMatches, ...filteredOnline].slice(0, 10);
            });
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error('Autocomplete search error:', err);
        } finally {
          setIsLoadingOnlineSearch(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    flyToCoords(item.lat, item.lng, 16);
    setAddressDetails({
      primary: item.title,
      secondary: item.subtitle,
      pincode: item.pincode,
      fullAddress: `${item.title}, ${item.subtitle}`,
      isShop: false
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Google Maps My Location GPS Button Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocatingUser(true);

    let isHandled = false;

    const onSuccess = (pos) => {
      if (isHandled) return;
      isHandled = true;
      const { latitude, longitude } = pos.coords;
      flyToCoords(latitude, longitude, 17);
      fetchAddressForCoords(latitude, longitude);
      setIsLocatingUser(false);
    };

    const onError = (err) => {
      if (isHandled) return;
      isHandled = true;
      console.error('GPS error:', err);
      alert('Could not access current location. Please check browser location permissions or choose an area.');
      setIsLocatingUser(false);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isHandled && pos.coords.accuracy < 250) {
          navigator.geolocation.clearWatch(watchId);
          onSuccess(pos);
        }
      },
      (err) => {
        navigator.geolocation.clearWatch(watchId);
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    setTimeout(() => {
      if (!isHandled) {
        navigator.geolocation.clearWatch(watchId);
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 0
        });
      }
    }, 8000);
  };

  // Recenter to Coimbatore City Hub
  const handleResetToCoimbatore = () => {
    flyToCoords(defaultCoimbatoreCenter.lat, defaultCoimbatoreCenter.lng, 14);
    fetchAddressForCoords(defaultCoimbatoreCenter.lat, defaultCoimbatoreCenter.lng);
  };

  // Confirm Location
  const handleConfirm = () => {
    if (distance == null || isCalculatingRoute || routeError) return;
    if (isAtShop) {
      alert('Bakery shop location cannot be used for home delivery. Please choose your area or move the map to your address.');
      return;
    }
    if (isOutOfRadius) {
      alert(`Selected location (${distance.toFixed(1)} km) is outside our 30 km Coimbatore delivery limit.`);
      return;
    }
    onSelect({
      position,
      address: addressDetails.fullAddress,
      pincode: addressDetails.pincode,
      distanceKm: distance,
      deliveryFee
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] relative z-[9999] overflow-hidden select-none font-sans">
      
      {/* ── 1. FULL-SCREEN LEAFLET MAP CANVAS ── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer 
          center={startingPos} 
          zoom={15} 
          zoomControl={false}
          style={{ height: '100%', width: '100%', touchAction: 'pan-x pan-y' }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Delivery 30 KM Zone Circle Boundary */}
          <Circle 
            center={[SHOP_LAT, SHOP_LNG]} 
            radius={DELIVERY_RADIUS_KM * 1000} 
            pathOptions={{ 
              color: '#d97706', 
              fillColor: '#fef3c7', 
              fillOpacity: 0.05, 
              weight: 2, 
              dashArray: '6, 8' 
            }} 
          />

          {/* Bakery Shop Marker */}
          <Marker position={[SHOP_LAT, SHOP_LNG]} icon={shopDivIcon}>
            <Tooltip permanent={false} direction="top" offset={[0, -36]}>
              <div className="text-xs sm:text-sm text-amber-950 font-medium">
                The Chocolate Mine Bakery
              </div>
            </Tooltip>
          </Marker>

          {/* Map Event Controller */}
          <MapController 
            onMapMoveStart={handleMapMoveStart}
            onMapMoveEnd={handleMapMoveEnd}
            setMapInstance={setMapInstance}
          />
        </MapContainer>
      </div>

      {/* ── 2. EXPANSIVE FLOATING TOP SEARCH & POPULAR AREAS (NO OVERLAP / UNIFIED HEADER) ── */}
      <div className="absolute top-2.5 sm:top-5 left-3 right-3 sm:left-6 sm:right-6 md:left-12 md:right-12 max-w-4xl lg:max-w-5xl md:mx-auto z-40 pointer-events-auto flex flex-col gap-2">
        
        {/* Top Row: Search Input + Close Map Button Side-by-Side */}
        <div className="flex items-center gap-2 w-full">
          <div className="bg-[var(--card)] dark:bg-[#24120B] rounded-full shadow-xl border border-[var(--border)] dark:border-[#522918] px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2.5 flex-1 min-w-0 transition-all focus-within:ring-2 focus-within:ring-[#E6B25A]">
            <Search size={18} className="text-[var(--muted)] dark:text-[#D6BE9F] shrink-0 sm:size-5" />
            <input 
              type="text" 
              placeholder="Search RS Puram, Peelamedu, Gandhipuram..." 
              className="bg-transparent w-full text-[var(--foreground)] dark:text-[#F2EADF] text-xs sm:text-base font-medium outline-none border-none p-0 focus:ring-0 placeholder:text-xs sm:placeholder:text-sm placeholder:text-[var(--muted)] dark:placeholder:text-[#9E8272]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {isLoadingOnlineSearch ? (
              <Loader2 size={18} className="animate-spin text-[#E6B25A] shrink-0" />
            ) : searchQuery ? (
              <button 
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-surface dark:text-[#D6BE9F] dark:hover:text-white dark:hover:bg-[#3D1E12] transition-colors shrink-0 cursor-pointer"
                title="Clear search text"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {onClose && (
            <button 
              type="button" 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--card)] dark:bg-[#24120B] text-[var(--foreground)] dark:text-[#F2EADF] hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white border border-[var(--border)] dark:border-[#522918] shadow-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 group"
              title="Close Map"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-200 sm:size-5" />
            </button>
          )}
        </div>

        {/* Autocomplete Search Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-[var(--card)] dark:bg-[#24120B] rounded-2xl shadow-2xl border border-[var(--border)] dark:border-[#522918] max-h-[230px] sm:max-h-[300px] overflow-y-auto divide-y divide-[var(--border)]/40 dark:divide-[#3D1E12] animate-in fade-in slide-in-from-top-1 duration-150">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 sm:px-6 py-2.5 sm:py-3.5 hover:bg-surface dark:hover:bg-[#3D1E12] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] dark:text-[#E6B25A] flex items-center justify-center shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-base font-semibold text-[var(--heading)] dark:text-[#F2EADF] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] sm:text-sm text-[var(--muted)] dark:text-[#D6BE9F] truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-[var(--primary)] dark:text-[#E6B25A]">
                    Route calculated after selection
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular Areas Navigation Bar (Full Width, Left/Right Arrows) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollChips('left')}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[var(--card)]/95 dark:bg-[#2B150D]/95 text-[var(--foreground)] dark:text-[#F2EADF] hover:bg-[#E6B25A] hover:text-[#1A0C08] border border-[var(--border)] dark:border-[#522918] shadow-md flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer"
            title="Previous Areas"
          >
            <ChevronLeft size={16} className="sm:size-5" />
          </button>

          {/* Scrollable Chips List */}
          <div 
            ref={chipsContainerRef}
            className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth flex-1 min-w-0"
          >
            {POPULAR_COIMBATORE_AREAS.map((area) => {
              const isSelected = addressDetails.primary.toLowerCase().includes(area.name.toLowerCase());
              return (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => handleSelectAreaChip(area)}
                  className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-all active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer border ${
                    isSelected 
                      ? 'bg-[#E6B25A] text-[#1A0C08] border-[#E6B25A] font-bold shadow-md'
                      : 'bg-[var(--card)]/95 dark:bg-[#2B150D]/95 text-[var(--foreground)] dark:text-[#F2EADF] border-[var(--border)] dark:border-[#522918] hover:bg-surface dark:hover:bg-[#3D1E12]'
                  }`}
                >
                  {isSelected && (
                    <Check size={13} className="stroke-[3]" />
                  )}
                  <span>{area.name}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollChips('right')}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[var(--card)]/95 dark:bg-[#2B150D]/95 text-[var(--foreground)] dark:text-[#F2EADF] hover:bg-[#E6B25A] hover:text-[#1A0C08] border border-[var(--border)] dark:border-[#522918] shadow-md flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer"
            title="Next Areas"
          >
            <ChevronRight size={16} className="sm:size-5" />
          </button>
        </div>
      </div>

      {/* ── 3. GOOGLE MAPS RED CENTER PIN (SCALED & PROMINENT ON LAPTOP & TABLET) ── */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-[400] transition-all duration-200 ease-out flex flex-col items-center ${
          isMapMoving ? '-translate-y-[calc(100%+12px)] scale-105' : '-translate-y-full scale-100'
        }`}
      >
        {/* Floating Capsule Badge with Comfortable Font Size */}
        <div className={`mb-2 px-3.5 sm:px-5 py-1 sm:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-semibold shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border ${
          isMapMoving 
            ? 'bg-slate-950 text-white border-slate-700 shadow-slate-900/50' 
            : isOutOfRadius
            ? 'bg-red-600 text-white border-red-500 shadow-red-600/40'
            : isAtShop
            ? 'bg-amber-600 text-white border-amber-500 shadow-amber-600/40'
            : 'bg-slate-950 text-white border-slate-700/90 shadow-md'
        }`}>
          {isMapMoving ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Setting doorstep location...</span>
            </>
          ) : isOutOfRadius ? (
            <span>Outside 30km Delivery Limit</span>
          ) : isAtShop ? (
            <span>Bakery Shop Location</span>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-[400px]">
                {addressDetails.primary || 'Selected Location'}
              </span>
            </>
          )}
        </div>

        {/* Google Maps Exact Red Marker SVG (Scales nicely: 30x40 on mobile, 40x50 on tablet/laptop) */}
        <div className="relative flex items-center justify-center">
          <svg 
            className="w-[30px] h-[40px] sm:w-[38px] sm:h-[48px] md:w-[44px] md:h-[54px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            viewBox="0 0 26 36" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
          >
            <path 
              d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 36 13 36S26 22.75 26 13C26 5.82 20.18 0 13 0Z" 
              fill={isOutOfRadius ? '#DC2626' : isAtShop ? '#D97706' : '#EA4335'} 
            />
            <circle cx="13" cy="13" r="5" fill="#FFFFFF" />
            <circle cx="13" cy="13" r="2.5" fill={isOutOfRadius ? '#DC2626' : isAtShop ? '#D97706' : '#C5221F'} />
          </svg>
        </div>
      </div>

      {/* Target Ground Shadow Dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[399] flex items-center justify-center">
        <div className={`rounded-full bg-black/45 blur-[1px] transition-all duration-200 ${isMapMoving ? 'w-3 h-1.5 opacity-20 scale-75' : 'w-4 h-2 sm:w-6 sm:h-3 opacity-60 scale-100'}`} />
      </div>

      {/* ── 4. FLOATING ACTION CONTROLS (RIGHT SIDE FAB - HIGHER VERTICAL CLEARANCE) ── */}
      <div className="absolute right-3 sm:right-6 md:right-8 lg:right-10 bottom-[240px] sm:bottom-[255px] md:bottom-[265px] z-30 flex flex-col items-center gap-2.5 sm:gap-3 pointer-events-auto">
        
        {/* Zoom Controls (Plus / Minus - Shown on tablet/desktop, mobile uses pinch) */}
        <div className="hidden sm:flex flex-col rounded-2xl bg-[var(--card)] dark:bg-[#24120B] border border-[var(--border)] dark:border-[#522918] shadow-xl overflow-hidden divide-y divide-[var(--border)] dark:divide-[#522918]">
          <button
            type="button"
            onClick={() => mapInstance?.zoomIn()}
            className="w-12 h-12 lg:w-14 lg:h-14 text-[var(--foreground)] dark:text-[#F2EADF] hover:bg-[#E6B25A] hover:text-[#1A0C08] dark:hover:bg-[#E6B25A] dark:hover:text-[#1A0C08] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Zoom In"
          >
            <Plus size={20} className="sm:size-6" />
          </button>
          <button
            type="button"
            onClick={() => mapInstance?.zoomOut()}
            className="w-12 h-12 lg:w-14 lg:h-14 text-[var(--foreground)] dark:text-[#F2EADF] hover:bg-[#E6B25A] hover:text-[#1A0C08] dark:hover:bg-[#E6B25A] dark:hover:text-[#1A0C08] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Zoom Out"
          >
            <Minus size={20} className="sm:size-6" />
          </button>
        </div>

        {/* Google Maps Exact "My Location" Crosshair Button (Enlarged for Easy Touch) */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full sm:rounded-2xl bg-[var(--card)] dark:bg-[#24120B] text-[var(--foreground)] dark:text-[#F2EADF] hover:text-[#E6B25A] dark:hover:text-[#E6B25A] border border-[var(--border)] dark:border-[#522918] shadow-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer group"
          title="Your Current Location (Live GPS)"
        >
          {isLocatingUser ? (
            <Loader2 className="animate-spin text-[#E6B25A] w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill={isLocatingUser ? "#E6B25A" : "currentColor"}>
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          )}
        </button>

        {/* Center to Coimbatore City Hub Button (Enlarged for Easy Touch) */}
        <button
          type="button"
          onClick={handleResetToCoimbatore}
          className="w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14 rounded-full sm:rounded-2xl bg-[var(--card)] dark:bg-[#24120B] text-[var(--muted)] dark:text-[#D6BE9F] hover:text-[var(--foreground)] dark:hover:text-white border border-[var(--border)] dark:border-[#522918] shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Center to Coimbatore Hub"
        >
          <RotateCcw size={19} className="sm:size-6" />
        </button>
      </div>

      {/* ── 5. FLOATING BOTTOM DELIVERY SHEET (COMPACT & SLEEK ON MOBILE, WIDE ON LAPTOPS) ── */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-10 md:right-10 max-w-2xl lg:max-w-3xl mx-auto z-40 pointer-events-auto">
        <div className="bg-[var(--card)]/95 dark:bg-[#24120B]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[var(--border)] dark:border-[#522918] p-3 sm:p-5 shadow-2xl space-y-2 sm:space-y-3">
          
          {/* Status & Delivery Charge Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {isOutOfRadius ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[11px] sm:text-sm font-semibold border border-red-300 dark:border-red-800">
                  <AlertCircle size={13} className="sm:size-4" />
                  <span>Outside 30 KM Zone</span>
                </span>
              ) : isAtShop ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[11px] sm:text-sm font-semibold border border-amber-300 dark:border-amber-800">
                  <Store size={13} className="sm:size-4" />
                  <span>Bakery Shop Location</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-sm font-semibold border border-emerald-300 dark:border-emerald-800">
                  <Check size={13} className="stroke-[3] sm:size-4" />
                  <span>Delivery Available</span>
                </span>
              )}

              {addressDetails.pincode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface dark:bg-[#3D1E12] text-[11px] sm:text-sm font-bold text-[var(--muted)] dark:text-[#E6B25A] border border-[var(--border)] dark:border-[#5A2C1A]">
                  <MapPin size={11} className="sm:size-3.5" />
                  <span>PIN: {addressDetails.pincode}</span>
                </span>
              )}
            </div>

            <div className="text-right">
              <span className={`text-xs sm:text-base font-bold ${isOutOfRadius ? 'text-red-500' : isAtShop ? 'text-amber-600' : 'text-[var(--heading)] dark:text-[#E6B25A]'}`}>
                {isAtShop ? 'Shop (0.0 km)' : isCalculatingRoute ? 'Calculating driving route…' : routeError || `${distance?.toFixed(1)} km • ₹${deliveryFee} Delivery`}
              </span>
            </div>
          </div>

          {/* Formatted Address Box */}
          <div className="flex items-start gap-2.5 sm:gap-3 bg-surface/80 dark:bg-[#1A0C08] border border-[var(--border)]/80 dark:border-[#4D2819] rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
            <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 mt-0.5 ${
              isOutOfRadius 
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600' 
                : isAtShop 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' 
                : 'bg-[#E6B25A]/15 text-[#E6B25A]'
            }`}>
              {isGeocoding ? (
                <Loader2 size={16} className="animate-spin text-[#E6B25A] sm:size-5" />
              ) : (
                <MapPin size={16} className="sm:size-5" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-base font-bold text-[var(--heading)] dark:text-[#FFFFFF] truncate leading-tight">
                {addressDetails.primary || 'Selected Delivery Location'}
              </p>
              <p className="text-[11px] sm:text-sm text-[var(--muted)] dark:text-[#D6BE9F] font-normal line-clamp-1 mt-0.5 leading-snug">
                {addressDetails.secondary || addressDetails.fullAddress}
              </p>
            </div>
          </div>

          {/* Confirm Delivery Location Button */}
          <button 
            type="button"
            onClick={isAtShop ? handleUseCurrentLocation : handleConfirm}
            disabled={isGeocoding || isCalculatingRoute || distance == null || Boolean(routeError) || isOutOfRadius}
            className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              isOutOfRadius
                ? 'bg-red-600 text-white cursor-not-allowed opacity-80'
                : isAtShop
                ? 'bg-amber-500 hover:bg-amber-400 text-[#1A0C08] font-bold'
                : 'bg-gradient-to-r from-[#E6B25A] to-[#D49F47] hover:from-[#f0bc62] hover:to-[#e0ab52] text-[#1A0C08] shadow-[#E6B25A]/25'
            }`}
          >
            {isAtShop ? (
              <span>Use Current Location or Select Area</span>
            ) : isOutOfRadius ? (
              <span>Outside 30 KM Delivery Limit</span>
            ) : (
              <span>Confirm Delivery Location (₹{deliveryFee})</span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default MapSelector;
