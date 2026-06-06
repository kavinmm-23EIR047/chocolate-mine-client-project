import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Truck, Phone, HelpCircle, MapPin } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from '../layout/MobileBottomNav';
import EgglessBadge from '../ui/EgglessBadge';
import PureVegBadge from '../ui/PureVegBadge';
import NotificationPrompt from '../ui/NotificationPrompt';

const UserLayout = () => {
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/product/');
  const isAuthPage = ['/login', '/register', '/forgot-password'].some(path => location.pathname.toLowerCase().startsWith(path));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── RESPONSIVE INFO BANNER ── */}
      <div className="bg-success/10 border-y border-success/20 text-success py-2 sm:py-2.5 px-4 overflow-hidden">
        
        {/* DESKTOP LAYOUT (lg and up) */}
        <div className="hidden lg:flex items-center justify-between max-w-[1400px] mx-auto w-full">
          {/* Left: Pure Veg & Eggless */}
          <div className="flex items-center gap-3">
            <PureVegBadge className="px-2 py-0.5 rounded-full" size={10} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">100% Pure Veg & Eggless cakes across the store</span>
          </div>
          
          {/* Center: Delivery */}
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-black uppercase tracking-[0.2em]">
            <Truck size={14} />
            <span>Delivery in Coimbatore within 3 Hours</span>
          </div>

          {/* Right: Important Routes */}
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
            <Link to="/contact" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone size={12} /> Contact Us
            </Link>
            <Link to="/help" className="flex items-center gap-1 hover:text-primary transition-colors">
              <HelpCircle size={12} /> Help
            </Link>
            <Link to="/stores" className="flex items-center gap-1 hover:text-primary transition-colors">
              <MapPin size={12} /> Stores
            </Link>
          </div>
        </div>

        {/* MOBILE LAYOUT (below lg) */}
        <div className="flex lg:hidden items-center justify-between w-full">
          {/* Left: Pure Veg */}
          <div className="flex items-center gap-1">
            <PureVegBadge className="px-1.5 py-0.5 rounded-sm text-[8px]" size={8} />
          </div>
          
          {/* Center: Delivery (Shortened) */}
          <div className="flex items-center gap-1 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em]">
            <Truck size={12} />
            <span>3Hrs Delivery in CBE</span>
          </div>

          {/* Right: Icon links */}
          <div className="flex items-center gap-3">
            <Link to="/contact" className="hover:text-primary transition-colors">
              <Phone size={12} />
            </Link>
            <Link to="/stores" className="hover:text-primary transition-colors">
              <MapPin size={12} />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-grow">
        <Outlet />
      </main>
      <div className={isProductPage ? "hidden lg:block" : "block"}>
        <Footer />
      </div>
      {!isAuthPage && <MobileBottomNav />}
      <NotificationPrompt />
    </div>
  );
};

export default UserLayout;
