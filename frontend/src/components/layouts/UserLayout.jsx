import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Truck, Phone, HelpCircle, MapPin } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from '../layout/MobileBottomNav';
import EgglessBadge from '../ui/EgglessBadge';
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
    <div className={`min-h-screen flex flex-col bg-background ${showBanner ? 'has-notification-banner' : ''}`}>
      <NotificationBanner />
      <Navbar />

      {/* ── RESPONSIVE INFO BANNER ── */}
      <div className="bg-success/10 border-y border-success/20 text-success py-2.5 md:py-3 px-4 overflow-hidden">

        {/* DESKTOP/TABLET LAYOUT (md and up) */}
        <div className="hidden md:flex items-center justify-between responsive-container">
          {/* Left: Pure Veg & Eggless (Increased Size to 20) */}
          <div className="flex items-center gap-3">
            <PureVegBadge size={20} className="shadow-none bg-transparent p-0" hideText={true} />
            <EgglessBadge size={20} className="shadow-none bg-transparent p-0" hideText={true} />
            <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.1em] lg:tracking-[0.15em] mt-0.5 hidden lg:inline-block">100% Pure Veg & Eggless cakes across the store</span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] mt-0.5 inline-block lg:hidden">100% Pure Veg & Eggless Store</span>
          </div>

          {/* Center: Delivery */}
          <div className="flex items-center gap-2 text-primary text-[11px] font-black uppercase tracking-[0.15em] mt-0.5">
            <Truck size={15} className="shrink-0" />
            <span>Delivery in Coimbatore within 3 Hours</span>
          </div>

          {/* Right: Important Routes */}
          <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.15em] mt-0.5">
            <Link to="/contact" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone size={12} className="shrink-0" /> Contact Us
            </Link>
            <Link to="/help" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <HelpCircle size={12} className="shrink-0" /> Help
            </Link>
            <Link to="/stores" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <MapPin size={12} className="shrink-0" /> Stores
            </Link>
          </div>
        </div>

        {/* MOBILE LAYOUT (below md) */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Pure Veg & Eggless (Increased Size to 16 for better visibility in image_6b58ba.png) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PureVegBadge size={16} className="shadow-none bg-transparent p-0" hideText={true} />
            <EgglessBadge size={16} className="shadow-none bg-transparent p-0" hideText={true} />
          </div>

          {/* Center: Delivery (Shortened) */}
          <div className="flex items-center gap-1 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] mx-2">
            <Truck size={13} className="shrink-0" />
            <span>3Hrs Delivery in CBE</span>
          </div>

          {/* Right: Icon links */}
          <div className="flex items-center gap-3.5 shrink-0">
            <Link to="/contact" className="hover:text-primary transition-colors">
              <Phone size={13} />
            </Link>
            <Link to="/help" className="hover:text-primary transition-colors">
              <HelpCircle size={13} />
            </Link>
            <Link to="/stores" className="hover:text-primary transition-colors">
              <MapPin size={13} />
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