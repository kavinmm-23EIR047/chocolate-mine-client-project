import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Search, Navigation, RotateCcw, X, Check, Loader2, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { lookupPincode, isNearShop, calculateDistanceKm, SHOP_LAT, SHOP_LNG, DELIVERY_RADIUS_KM } from '../utils/geoUtils';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [28, 44],
    iconAnchor: [14, 44]
});

L.Marker.prototype.options.icon = DefaultIcon;

const extractPincode = (data) => {
  if (!data) return '';
  if (data.address && data.address.postcode) {
    const code = String(data.address.postcode).replace(/[^0-9]/g, '');
    if (code.length === 6) return code;
  }
  const match = String(data.display_name || '').match(/\b6[0-9]{5}\b/);
  return match ? match[0] : '';
};

const formatCleanAddress = (data, lat, lng) => {
  if (lat != null && lng != null && isNearShop(lat, lng)) {
    return 'The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001';
  }
  if (!data) return '';
  const addr = data.address || {};
  let primaryName = addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || addr.neighbourhood || addr.residential || data.display_name?.split(',')[0];

  // If OpenStreetMap returns administrative "Ward XX", clean it up with road or suburb
  if (primaryName && /^Ward\s+\d+/i.test(primaryName)) {
    if (addr.suburb && !/^Ward\s+\d+/i.test(addr.suburb)) {
      primaryName = addr.suburb;
    } else if (addr.road) {
      primaryName = addr.road;
    } else if (addr.neighbourhood) {
      primaryName = addr.neighbourhood;
    } else {
      primaryName = 'Coimbatore Area';
    }
  }

  const city = addr.city || addr.town || addr.suburb || addr.district || 'Coimbatore';
  const state = addr.state || 'Tamil Nadu';
  const pincode = addr.postcode || '';

  const cleanParts = [];
  if (primaryName) cleanParts.push(primaryName);
  if (city && !cleanParts.includes(city)) cleanParts.push(city);
  if (state && !cleanParts.includes(state)) cleanParts.push(state);
  if (pincode) cleanParts.push(pincode);

  return cleanParts.length > 0 ? cleanParts.join(', ') : data.display_name;
};

const LocationMarker = ({ position, setPosition, setAddress, setPincode, setIsGeocoding }) => {
  const markerRef = useRef(null);

  const fetchAddress = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      if (isNearShop(lat, lng)) {
        setAddress('The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001');
        setPincode('641001');
        return;
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data) {
        setAddress(formatCleanAddress(data, lat, lng));
        setPincode(extractPincode(data));
      } else {
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsGeocoding(false);
    }
  };

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      fetchAddress(lat, lng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          setPosition(newLatLng);
          fetchAddress(newLatLng.lat, newLatLng.lng);
        }
      },
    }),
    [setPosition],
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={DefaultIcon}
    />
  );
};

const MapUpdater = ({ position }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.setView(position, map.getZoom() || 15);
    }
  }, [position, map]);
  return null;
};

const MapSelector = ({ initialPosition, initialPincode, onSelect, onClose }) => {
  // Determine starting position: initialPosition -> initialPincode lookup -> default to shop
  const startingPos = useMemo(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      return { lat: Number(initialPosition.lat), lng: Number(initialPosition.lng) };
    }
    if (initialPincode) {
      const pinMatch = lookupPincode(initialPincode);
      if (pinMatch) return { lat: pinMatch.lat, lng: pinMatch.lng };
    }
    return { lat: SHOP_LAT, lng: SHOP_LNG };
  }, [initialPosition, initialPincode]);

  const [position, setPosition] = useState(startingPos); 
  const [address, setAddress] = useState(isNearShop(startingPos.lat, startingPos.lng) ? "The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001" : "Determining address...");
  const [pincode, setPincode] = useState(initialPincode || "641012");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const isAtShop = isNearShop(position?.lat, position?.lng);
  const distance = calculateDistanceKm(SHOP_LAT, SHOP_LNG, position?.lat, position?.lng);
  const isOutOfRadius = distance > DELIVERY_RADIUS_KM;

  const handleResetToShop = () => {
    const shopPos = { lat: SHOP_LAT, lng: SHOP_LNG };
    setPosition(shopPos);
    setAddress("The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001");
    setPincode("641001");
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Fetch address for initial position on mount
  useEffect(() => {
    const initGeocode = async () => {
      if (position?.lat && position?.lng) {
        if (isNearShop(position.lat, position.lng)) {
          setAddress("The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001");
          setPincode("641001");
          return;
        }
        setIsGeocoding(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data) {
            setAddress(formatCleanAddress(data, position.lat, position.lng));
            const extractedPin = extractPincode(data);
            if (extractedPin) setPincode(extractedPin);
          }
        } catch {
          setAddress(`Location (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`);
        } finally {
          setIsGeocoding(false);
        }
      }
    };
    initGeocode();
  }, []);

  // Debounced address autocomplete search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const q = searchQuery.trim();
        // Bias search results toward current map position and India for better relevance
        const lat = position?.lat || defaultLat;
        const lng = position?.lng || defaultLng;
        const viewbox = `${lng - 1},${lat - 1},${lng + 1},${lat + 1}`;
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&countrycodes=in&viewbox=${viewbox}&bounded=0`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Geocoding suggestions error:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const newPos = { lat, lng };
    setPosition(newPos);
    setAddress(formatCleanAddress(item, lat, lng));
    setPincode(extractPincode(item));
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocatingUser(true);
    setIsGeocoding(true);

    const onSuccess = async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      console.log(`[GPS] lat: ${latitude}, lng: ${longitude}, accuracy: ${accuracy}m`);
      const newPos = { lat: latitude, lng: longitude };
      setPosition(newPos);

      try {
        if (isNearShop(latitude, longitude)) {
          setAddress("The Chocolate Mine Bakery (Shop Location), Coimbatore - 641001");
          setPincode("641001");
          return;
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data) {
          setAddress(formatCleanAddress(data, latitude, longitude));
          setPincode(extractPincode(data));
        } else {
          setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      } finally {
        setIsLocatingUser(false);
        setIsGeocoding(false);
      }
    };

    const onError = (err) => {
      console.error("Geolocation error:", err);
      alert("Could not fetch current location. Please allow location permissions in your browser.");
      setIsLocatingUser(false);
      setIsGeocoding(false);
    };

    const geoOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    // Use watchPosition for better accuracy - take the first high-accuracy reading then stop
    let resolved = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Accept if accuracy is good enough or after first reading
        if (!resolved && (pos.coords.accuracy < 200 || !resolved)) {
          resolved = true;
          navigator.geolocation.clearWatch(watchId);
          onSuccess(pos);
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          navigator.geolocation.clearWatch(watchId);
          onError(err);
        }
      },
      geoOptions
    );

    // Safety timeout: if watchPosition hasn't resolved in 15s, fall back to getCurrentPosition
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        navigator.geolocation.clearWatch(watchId);
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
      }
    }, 15000);
  };

  const handleConfirm = () => {
    if (isAtShop) {
      alert("Shop location cannot be used for home delivery. Please drag the pin to your delivery address, search your area, or tap 'Use My Current Location'.");
      return;
    }
    if (isOutOfRadius) {
      alert(`Selected location (${distance.toFixed(1)} km) is outside our 30 km Coimbatore delivery area.`);
      return;
    }
    onSelect({ position, address, pincode });
  };

  return (
    <div className="w-full h-full h-[100dvh] max-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] relative z-[9999] overflow-hidden">
      {/* ── TOP HEADER BAR ── */}
      <div className="px-4 sm:px-8 py-3.5 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h2 className="font-black text-[var(--heading)] text-sm sm:text-base uppercase tracking-wider leading-none">Select Delivery Location</h2>
            <p className="text-[11px] font-bold text-[var(--muted)] mt-0.5">Pin location for accurate delivery & charges</p>
          </div>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--border)]/40 text-[var(--muted)] hover:text-[var(--heading)] transition-colors"
            title="Close Location Picker"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── SEARCH & GPS CONTROLS BAR ── */}
      <div className="px-4 sm:px-8 py-3 bg-[var(--card)] border-b border-[var(--border)]/80 relative z-50 shrink-0">
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-[var(--input)] border border-[var(--input-border)] rounded-2xl px-4 py-3 shadow-inner focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
            <Search size={20} className="text-[var(--muted)] shrink-0" />
            <input 
              type="text" 
              placeholder="Search area, landmark, or street name..." 
              className="bg-transparent w-full text-[var(--foreground)] text-sm sm:text-base font-bold outline-none border-none p-0 focus:ring-0 placeholder:text-[var(--foreground)] placeholder:opacity-60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {isLoadingSuggestions ? (
              <Loader2 size={18} className="animate-spin text-[var(--primary)] shrink-0" />
            ) : searchQuery ? (
              <button 
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                className="text-[var(--muted)] hover:text-[var(--heading)] p-1 shrink-0"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {/* Realtime Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[1200] mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto divide-y divide-[var(--border)]/30">
              {suggestions.map((item, idx) => {
                const cleanAddr = formatCleanAddress(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-5 py-3.5 hover:bg-[var(--primary)]/10 transition-colors flex items-start gap-3.5 group"
                  >
                    <MapPin size={18} className="text-[var(--primary)] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[var(--heading)] truncate">
                        {cleanAddr.split(',')[0]}
                      </p>
                      <p className="text-xs font-medium text-[var(--muted)] line-clamp-1 mt-0.5">
                        {cleanAddr}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto mt-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-button-text hover:bg-primary-hover text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Navigation size={15} className={isLocatingUser ? 'animate-spin' : ''} />
              <span>{isLocatingUser ? 'Detecting Location...' : 'Use My Current Location'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetToShop}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-foreground hover:border-primary/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Reset location back to Bakery Shop center"
            >
              <RotateCcw size={13} className="text-muted" />
              <span>Center to Shop</span>
            </button>
          </div>
          <span className="text-xs text-[var(--muted)] font-bold hidden sm:inline">Drag pin or tap map to set your house location</span>
        </div>
      </div>

      {/* ── LEAFLET MAP CONTAINER ── */}
      <div className="flex-1 w-full relative z-10 min-h-[180px] sm:min-h-[250px] overflow-hidden">
        {isOutOfRadius && (
          <div className="absolute top-3 left-4 right-4 z-[500] bg-red-600/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">⚠️</span>
              <span className="line-clamp-2">Selected location is {distance.toFixed(1)} km away (outside our 30 km Coimbatore delivery limit).</span>
            </div>
            <button
              type="button"
              onClick={handleResetToShop}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white font-black text-[11px] uppercase tracking-wider shrink-0 transition cursor-pointer"
            >
              Reset to Shop
            </button>
          </div>
        )}
        {isAtShop && !isOutOfRadius && (
          <div className="absolute top-3 left-4 right-4 z-[500] bg-amber-600/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">📍</span>
              <span className="line-clamp-2">Currently at Bakery Shop. Please drag the pin to your home/delivery location or click &quot;Use My Current Location&quot;.</span>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-2.5 py-1 bg-white text-amber-900 font-black text-[11px] uppercase tracking-wider rounded-lg shadow shrink-0 transition hover:bg-amber-100 cursor-pointer whitespace-nowrap"
            >
              Use My GPS
            </button>
          </div>
        )}
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%', touchAction: 'pan-x pan-y' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            setAddress={setAddress}
            setPincode={setPincode}
            setIsGeocoding={setIsGeocoding}
          />
          <MapUpdater position={position} />
        </MapContainer>
      </div>

      {/* ── FOOTER ADDRESS CONFIRMATION CARD (Safari Safe Area Aware) ── */}
      <div className="p-3.5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-[var(--card)] border-t border-[var(--border)] z-30 shrink-0 shadow-2xl">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 w-full min-w-0">
            <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${isOutOfRadius ? 'bg-red-500/20 text-red-600' : isAtShop ? 'bg-amber-500/20 text-amber-600' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
              {isGeocoding ? <Loader2 size={22} className="animate-spin" /> : <MapPin size={22} />}
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-black text-[var(--heading)] uppercase tracking-wider text-xs flex items-center gap-2 flex-wrap">
                <span className={isOutOfRadius ? 'text-red-600' : isAtShop ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {isOutOfRadius ? 'OUTSIDE DELIVERY LIMIT' : isAtShop ? 'BAKERY SHOP (MOVE PIN TO YOUR ADDRESS)' : 'DELIVER TO'}
                </span>
                {pincode && <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">PIN: {pincode}</span>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isOutOfRadius ? 'bg-red-500/10 text-red-600 border-red-300' : isAtShop ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700' : 'bg-surface text-muted border-border/40'}`}>
                  {isAtShop ? '0.0 km • Shop (Not for delivery)' : `${distance.toFixed(1)} km • ₹${Math.round(distance * 10)}`}
                </span>
                {isGeocoding && <span className="text-xs text-[var(--primary)] font-bold lowercase">updating address...</span>}
              </p>
              <p className="text-[var(--foreground)] line-clamp-2 text-xs sm:text-sm font-bold mt-0.5 leading-snug">
                {address}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleConfirm}
            disabled={isGeocoding || isOutOfRadius || isAtShop}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider shrink-0 flex items-center justify-center gap-2 rounded-xl transition-all ${
              isOutOfRadius
                ? 'bg-red-600 text-white cursor-not-allowed opacity-80 shadow-md'
                : isAtShop
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-2 border-dashed border-amber-500/40 cursor-not-allowed font-black'
                : 'bg-primary text-button-text hover:bg-primary-hover shadow-premium active:scale-95 cursor-pointer'
            }`}
          >
            {isAtShop ? (
              <>
                <MapPin size={18} className="animate-bounce text-amber-600 dark:text-amber-400" />
                <span>Move Pin to Your Address</span>
              </>
            ) : isOutOfRadius ? (
              <>
                <AlertCircle size={18} />
                <span>Out of Radius (&gt;30 KM)</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Confirm Delivery Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
