import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Search, Navigation, X, Check, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

const formatCleanAddress = (data) => {
  if (!data) return '';
  const addr = data.address || {};
  const primaryName = addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || addr.neighbourhood || addr.residential || data.display_name?.split(',')[0];
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
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data) {
        setAddress(formatCleanAddress(data));
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
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const MapSelector = ({ onSelect, onClose }) => {
  // Default to The Chocolate Mine Shop Location
  const defaultLat = Number(import.meta.env.VITE_SHOP_LAT) || 11.00454;
  const defaultLng = Number(import.meta.env.VITE_SHOP_LNG) || 76.97511;

  const [position, setPosition] = useState({ lat: defaultLat, lng: defaultLng }); 
  const [address, setAddress] = useState("The Chocolate Mine Shop, Coimbatore, Tamil Nadu");
  const [pincode, setPincode] = useState("641012");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
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
    setAddress(formatCleanAddress(item));
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data) {
            setAddress(formatCleanAddress(data));
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
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not fetch current location. Please allow location permissions in your browser.");
        setIsLocatingUser(false);
        setIsGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelect({ position, address, pincode });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] relative z-[9999] overflow-hidden">
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
              className="bg-transparent w-full text-[var(--foreground)] text-sm sm:text-base font-bold outline-none border-none p-0 focus:ring-0 placeholder:text-[var(--muted)]/60"
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

        <div className="max-w-3xl mx-auto mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black border border-[var(--primary)]/20 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Navigation size={15} className={isLocatingUser ? 'animate-spin' : ''} />
            <span>{isLocatingUser ? 'Detecting Location...' : 'Use My Current Location'}</span>
          </button>
          <span className="text-xs text-[var(--muted)] font-bold hidden sm:inline">Drag pin or tap map to set location</span>
        </div>
      </div>

      {/* ── LEAFLET MAP CONTAINER ── */}
      <div className="flex-1 w-full relative z-10 min-h-[250px]">
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
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

      {/* ── FOOTER ADDRESS CONFIRMATION CARD ── */}
      <div className="p-4 sm:p-6 bg-[var(--card)] border-t border-[var(--border)] z-20 shrink-0 shadow-2xl">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3.5 flex-1 w-full min-w-0">
            <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl shrink-0">
              {isGeocoding ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-black text-[var(--heading)] uppercase tracking-wider text-xs flex items-center gap-2">
                <span>DELIVER TO</span>
                {pincode && <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">PIN: {pincode}</span>}
                {isGeocoding && <span className="text-xs text-[var(--primary)] font-bold lowercase">updating address...</span>}
              </p>
              <p className="text-[var(--foreground)] line-clamp-2 text-sm font-bold mt-1 leading-snug">
                {address}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleConfirm}
            disabled={isGeocoding}
            className="btn-primary w-full sm:w-auto px-8 py-3.5 shadow-premium text-sm font-black uppercase tracking-wider shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} />
            <span>CONFIRM LOCATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
