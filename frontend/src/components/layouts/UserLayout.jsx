import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Truck, Phone, HelpCircle, MapPin } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from '../layout/MobileBottomNav';
import PureVegBadge from '../ui/PureVegBadge';
import NotificationPrompt from '../ui/NotificationPrompt';
import NotificationBanner from '../ui/NotificationBanner';
import { useAuth } from '../../context/AuthContext';

const UserLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/product/');
  const isAuthPage = ['/login', '/register', '/forgot-password'].some(path => location.pathname.toLowerCase().startsWith(path));

  const hasPermission = 'Notification' in window && Notification.permission === 'granted';
  const hasFcmToken = user?.fcmTokens && user.fcmTokens.length > 0;
  const showBanner = user && (!hasPermission || !hasFcmToken);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-[200] w-full">
        <NotificationBanner />
        <Navbar />
      </header>

      {/* ── RESPONSIVE INFO BANNER ── */}
      <div className="bg-[#4E2820] dark:bg-[#E8D3CB] py-2.5 px-4 overflow-hidden border-b border-border/10 transition-colors duration-300">

        {/* DESKTOP/TABLET LAYOUT (md and up) */}
        <div className="hidden md:flex items-center justify-between responsive-container">
          {/* Left: Pure Veg & Eggless */}
          <div className="flex items-center gap-2.5">
            <PureVegBadge size={16} className="shadow-none bg-white p-0.5 rounded-[2px]" hideText={true} />
            <span className="text-[9px] lg:text-xs font-black uppercase tracking-[0.15em] text-[#4ade80] dark:text-[#1B5E20] mt-0.5 hidden lg:inline-block">100% Pure Veg & Eggless cakes across the store</span>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#4ade80] dark:text-[#1B5E20] mt-0.5 inline-block lg:hidden">100% Pure Veg & Eggless Store</span>
          </div>

          {/* Center: Delivery */}
          <div className="flex items-center gap-2 text-[#F2E2DB] dark:text-[#120806] text-[9px] lg:text-xs font-black uppercase tracking-[0.15em] mt-0.5">
            <Truck size={14} className="shrink-0" />
            <span>Delivery in Coimbatore within 3 Hours</span>
          </div>

          {/* Right: Important Routes */}
          <div className="flex items-center gap-5 text-[9px] lg:text-xs font-black uppercase tracking-[0.15em] mt-0.5 text-[#4ade80] dark:text-[#4E2820]">
            <Link to="/contact" className="flex items-center gap-1.5 hover:text-white dark:hover:text-[#120806] transition-colors">
              <Phone size={12} className="shrink-0" /> Contact Us
            </Link>
            <Link to="/help" className="flex items-center gap-1.5 hover:text-white dark:hover:text-[#120806] transition-colors">
              <HelpCircle size={12} className="shrink-0" /> Help
            </Link>
            <Link to="/stores" className="flex items-center gap-1.5 hover:text-white dark:hover:text-[#120806] transition-colors">
              <MapPin size={12} className="shrink-0" /> Stores
            </Link>
          </div>
        </div>

        {/* MOBILE LAYOUT (below md) */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Pure Veg & Eggless */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PureVegBadge size={14} className="shadow-none bg-white p-0.5 rounded-[2px]" hideText={true} />
          </div>

          {/* Center: Delivery */}
          <div className="flex items-center gap-1 text-[#F2E2DB] dark:text-[#120806] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] mx-2 mt-0.5">
            <Truck size={11} className="shrink-0 text-[#F2E2DB] dark:text-[#120806]" />
            <span>3Hrs Delivery in CBE</span>
          </div>

          {/* Right: Icon links */}
          <div className="flex items-center gap-3.5 shrink-0 text-[#4ade80] dark:text-[#4E2820]">
            <Link to="/contact" className="hover:text-white dark:hover:text-[#120806] transition-colors">
              <Phone size={12} />
            </Link>
            <Link to="/help" className="hover:text-white dark:hover:text-[#120806] transition-colors">
              <HelpCircle size={12} />
            </Link>
            <Link to="/stores" className="hover:text-white dark:hover:text-[#120806] transition-colors">
              <MapPin size={12} />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-grow min-w-0">
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