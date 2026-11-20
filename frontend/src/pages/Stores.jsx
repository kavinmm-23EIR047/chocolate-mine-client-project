import React from 'react';
import { MapPin, Clock, Store, ExternalLink, Phone, ShieldCheck } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const Stores = () => {
  useSEO({
    title: 'Visit The Chocolate Mine | Best Cake & Pastry Shop in Race Course, Coimbatore',
    description: 'Visit The Chocolate Mine retail store at Race Course Road, Gopalapuram, Coimbatore. Enjoy 100% pure veg & eggless cakes, artisan chocolates, custom cake consultation & takeaway.',
    keywords: 'cake shop race course coimbatore, bakery in race course coimbatore, the chocolate mine outlet coimbatore, best pastry shop coimbatore',
    canonical: 'https://thechocolatemine.in/stores'
  });

  return (
    <div className="responsive-container py-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-3" style={{ color: 'var(--heading)' }}>
        Our Store in Coimbatore
      </h1>
      <p className="text-muted max-w-lg mb-10 text-sm sm:text-base leading-relaxed">
        Visit our flagship outlet in Race Course to experience freshly baked 100% pure veg cakes, artisanal chocolates, and personalized custom cake consultations.
      </p>

      <div className="w-full max-w-xl">
        <div className="p-6 sm:p-8 rounded-2xl flex flex-col items-start text-left gap-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
              <Store size={22} />
            </div>
            <div>
              <h2 className="font-black text-xl text-heading">The Chocolate Mine</h2>
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">100% Pure Veg & Eggless Bakery</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-muted text-sm pt-2">
            <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              No.7, 3, Race Course Rd, near Codissia Office Building,<br />
              Anna Silai, Gopalapuram, Coimbatore, Tamil Nadu 641018
            </p>
          </div>

          <div className="flex items-center gap-3 text-muted text-sm">
            <Clock size={18} className="text-primary shrink-0" />
            <p>Mon - Sat: 10:00 AM – 10:30 PM | Sun: 10:00 AM – 10:00 PM</p>
          </div>

          <div className="flex items-center gap-3 text-muted text-sm">
            <Phone size={18} className="text-primary shrink-0" />
            <a href="tel:+919150670077" className="font-bold text-foreground hover:text-primary transition-colors">
              +91 91506 70077
            </a>
          </div>

          <div className="w-full pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
            <a
              href="https://maps.app.goo.gl/1aPW7FVjAmLBnwxc7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
            >
              <ExternalLink size={14} />
              Open in Google Maps
            </a>

            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <ShieldCheck size={16} className="text-primary" />
              <span>In-store pickup & walk-ins welcome</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
