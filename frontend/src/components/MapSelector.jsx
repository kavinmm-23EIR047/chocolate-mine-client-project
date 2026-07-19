import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Search, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, setAddress }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      
      // Reverse Geocoding
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={DefaultIcon} />
  );
};

const MapUpdater = ({ position }) => {
  const map = useMapEvents({});
  React.useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const MapSelector = ({ onSelect }) => {
  const [position, setPosition] = useState({ 
    lat: Number(import.meta.env.VITE_SHOP_LAT) || 11.00454, 
    lng: Number(import.meta.env.VITE_SHOP_LNG) || 76.97511 
  }); 
  const [address, setAddress] = useState("The Chocolate Mine Shop, Coimbatore");
  const [isSearching, setIsSearching] = useState(false);

  const handleConfirm = () => {
    onSelect({ position, address });
  };

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' || !address.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setAddress(display_name); // Update with the formatted address
      } else {
        alert("Location not found. Please try a different search.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error searching for location.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="card-premium overflow-hidden">
      <div className="p-4 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search your area and press Enter..." 
            className="input-field pl-10 w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleSearch}
          />
          <Search className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
          {isSearching && (
            <div className="absolute right-3 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      <div className="h-[300px] sm:h-[400px] relative">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            setAddress={setAddress} 
          />
          <MapUpdater position={position} />
        </MapContainer>
        
        <button className="absolute bottom-4 right-4 z-[1000] p-3 bg-[var(--card)] rounded-full shadow-2xl text-[var(--secondary)] border border-[var(--border)] hover:scale-110 transition-transform">
          <Navigation size={24} />
        </button>
      </div>

      <div className="p-4 bg-[var(--card)] flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-lg">
            <MapPin size={24} />
          </div>
          <div className="text-sm">
            <p className="font-black text-[var(--heading)] uppercase tracking-tighter">Deliver to</p>
            <p className="text-[var(--muted)] line-clamp-1 font-bold">{address}</p>
          </div>
        </div>
        <button 
          onClick={handleConfirm}
          className="btn-primary w-full sm:w-auto shadow-premium"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default MapSelector;
