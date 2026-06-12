import React from 'react';
import { MapPin, Clock, Store } from 'lucide-react';

const Stores = () => {
  return (
    <div className="responsive-container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Our Stores</h1>
      <p className="text-muted max-w-lg mb-10">Visit our physical outlets to experience the magic of freshly baked cakes and premium chocolates.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="p-6 rounded-2xl flex flex-col items-start text-left gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <Store size={20} />
            </div>
            <h3 className="font-bold text-lg">Main Outlet - RS Puram</h3>
          </div>
          <div className="flex items-start gap-2 text-muted text-sm">
            <MapPin size={16} className="shrink-0 mt-0.5" />
            <p>123 Bakery Street, RS Puram<br />Coimbatore, Tamil Nadu 641002</p>
          </div>
          <div className="flex items-center gap-2 text-muted text-sm">
            <Clock size={16} className="shrink-0" />
            <p>Mon - Sun: 9:00 AM - 10:00 PM</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl flex flex-col items-start text-left gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <Store size={20} />
            </div>
            <h3 className="font-bold text-lg">Express Kiosk - Peelamedu</h3>
          </div>
          <div className="flex items-start gap-2 text-muted text-sm">
            <MapPin size={16} className="shrink-0 mt-0.5" />
            <p>Food Court, Fun Republic Mall<br />Peelamedu, Coimbatore 641004</p>
          </div>
          <div className="flex items-center gap-2 text-muted text-sm">
            <Clock size={16} className="shrink-0" />
            <p>Mon - Sun: 10:00 AM - 11:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
