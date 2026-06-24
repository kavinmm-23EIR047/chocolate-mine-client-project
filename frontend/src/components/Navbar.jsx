import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
  Cake, SlidersHorizontal, Bell, Sparkles
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryLocation } from '../context/LocationContext';
import SearchOverlay from './search/SearchOverlay';
import ThemeToggle from './ui/ThemeToggle';
import NotificationDropdown from './ui/NotificationDropdown';
import MegaMenu from './ui/MegaMenu';

const Navbar = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const { location: deliveryCity, setLocation: setDeliveryCity } = useDeliveryLocation();
  const location = useLocation();
  const locationDropdownRef = useRef(null);
  const mobileLocationDropdownRef = useRef(null);

  const cartCount = cartItems ? cartItems.reduce((acc, item) => acc + item.qty, 0) : 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (locationDropdownRef.current && locationDropdownRef.current.contains(e.target)) ||
        (mobileLocationDropdownRef.current && mobileLocationDropdownRef.current.contains(e.target))
      ) {
        return;
      }
      setIsLocationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const LogoMark = ({ containerClass = "w-[95px] sm:w-[110px] lg:w-[120px] tv:w-[150px]" }) => (
    <div className={`flex flex-col items-center text-inherit font-sans py-1 my-auto ${containerClass}`}>
      <div className="w-full flex justify-between text-[8px] sm:text-[8.5px] lg:text-[9.5px] font-black uppercase leading-none select-none text-inherit/90 tracking-normal mb-1 px-[0.5px]">
        <span>T</span><span>H</span><span>E</span>
        <span className="w-[8%]"></span>
        <span>C</span><span>H</span><span>O</span><span>C</span><span>O</span><span>L</span><span>A</span><span>T</span><span>E</span>
      </div>
      <svg
        viewBox="0 0 325 90"
        className="w-full h-auto fill-current text-inherit transition-colors"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 86V0h25.5l29.5 45L84.5 0H110v86H87V32L61.5 71h-13L23 32v54H0z" />
        <path d="M131 0h24v86h-24V0z" />
        <path d="M176 86V0h24.5l37.5 56V0h24v86h-23.5L200 29v57h-24z" />
        <path d="M283 0h42v21h-18v12h14v20h-14v12h18v21h-42V0z" />
      </svg>
    </div>
  );

  return (
    <>
      <nav className={`sticky top-0 left-0 right-0 z-[200] transition-all duration-300 bg-navbar text-heading lg:rounded-none relative ${isScrolled ? 'shadow-md' : ''}`}>

        {/* MOBILE WATERMARK BACKGROUND PATTERN (Subtle themed watermarks) */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden z-0 opacity-[0.05]">
          <div className="absolute top-3 left-24"><Cake size={24} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute top-14 left-10"><Sparkles size={14} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute top-24 left-40"><Cake size={20} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute top-4 right-32"><Cake size={26} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute top-20 right-20"><Cake size={22} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute top-16 right-48"><Sparkles size={16} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute bottom-12 left-6"><Sparkles size={18} strokeWidth={1.2} className="text-heading" /></div>
          <div className="absolute bottom-4 right-10"><Cake size={22} strokeWidth={1.2} className="text-heading" /></div>
        </div>

        <div className="responsive-container pb-5 lg:pb-0 relative z-10">

          {/* DESKTOP LAYOUT ROW */}
          <div className="hidden lg:flex items-center justify-between gap-4 py-3 min-h-[65px] tv:min-h-[84px]">
            <div className="flex items-center gap-6 shrink-0">
              <Link to="/" className="shrink-0 block select-none group pr-1">
                <LogoMark />
              </Link>

              <div className="relative shrink-0" ref={locationDropdownRef}>
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-surface hover:border-primary/30 transition-all duration-200 min-w-[140px] tv:min-w-[180px]"
                >
                  <MapPin size={14} className="text-primary shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest leading-none">Deliver to</span>
                    <span className="text-[11px] font-black text-heading uppercase tracking-wide flex items-center gap-1 leading-tight mt-0.5">
                      {deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'SELECT CITY')}
                      <ChevronDown size={11} className={`transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isLocationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 w-44 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-50"
                    >
                      {['coimbatore', 'pan india'].map((city) => (
                        <button
                          key={city} onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider hover:bg-primary/8 text-heading transition-colors"
                        >
                          {city === 'pan india' ? 'PAN INDIA' : 'COIMBATORE'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="flex flex-1 max-w-md xl:max-w-xl tv:max-w-3xl mx-auto cursor-pointer px-2" onClick={() => setIsSearchOverlayOpen(true)}>
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-heading/70" />
                <input
                  type="text" readOnly placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-surface border border-border/60 text-foreground pl-10 pr-10 py-2.5 rounded-full outline-none text-xs cursor-pointer"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-heading/60">
                  <SlidersHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Desktop Navigation Panels */}
            <div className="flex items-center gap-1 shrink-0">
              {user ? (
                <div className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[64px]">
                  <NotificationDropdown />
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wide whitespace-nowrap mt-0.5">Alerts</span>
                </div>
              ) : (
                <button onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[64px]">
                  <Bell size={24} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Alerts</span>
                </button>
              )}

              {[user ? { icon: User, label: user.name.split(' ')[0], to: user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard' } : { icon: LogIn, label: 'Sign In', to: '/login' }].map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[64px]">
                  <Icon size={24} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">{label}</span>
                </Link>
              ))}

              <Link to="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:bg-primary/8 group transition-colors relative min-w-[64px]">
                <ShoppingCart size={24} className="text-heading group-hover:text-primary transition-colors" />
                {cartCount > 0 && <span className="absolute -top-2 -right-2.5 bg-accent text-[#120807] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full leading-none px-1">{cartCount}</span>}
                <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide transition-colors">Cart</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>

          {/* MOBILE VIEW LAYOUT */}
          <div className="lg:hidden flex flex-col gap-4 pt-3">

            {/* Top Row: Menu + Logo + Actions */}
            <div className="flex items-center justify-between w-full px-1">
              {/* Left Side: Menu + Logo */}
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMenuOpen(true)} className="p-1 rounded-lg transition-colors flex-shrink-0">
                  <Menu size={28} className="text-heading" />
                </button>
                <Link to="/" className="block select-none group flex-shrink-0">
                  <LogoMark containerClass="w-[95px] sm:w-[115px]" />
                </Link>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center gap-3">
                {user ? (
                  <NotificationDropdown iconClass="text-heading" />
                ) : (
                  <button onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center relative">
                    <Bell size={24} className="text-heading" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
                  </button>
                )}
                <ThemeToggle buttonClass="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card-soft text-foreground hover:bg-background transition-all active:scale-95 shadow-sm" />
              </div>
            </div>

            {/* Location Capsule Row */}
            <div className="flex justify-start relative mt-0.5" ref={mobileLocationDropdownRef}>
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent text-heading transition-colors text-[12px] font-black tracking-wider uppercase"
              >
                <MapPin size={15} className="text-heading" />
                <span>{deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'COIMBATORE')}</span>
                <ChevronDown size={14} className="text-heading transition-transform duration-200" style={{ transform: isLocationOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1.5 left-0 w-48 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-[100]"
                  >
                    {['coimbatore', 'pan india'].map((city) => (
                      <button
                        key={city} onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                        className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-wider hover:bg-primary/8 text-heading transition-colors"
                      >
                        {city === 'pan india' ? 'PAN INDIA' : 'COIMBATORE'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Themed Search Pill with Contrast against bg-navbar */}
            <div
              className="relative w-full mt-0.5 cursor-pointer flex items-center pl-12 pr-12 py-3 rounded-full bg-card border border-border/60 shadow-sm min-h-[48px] select-none"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />

              <span className="text-muted/60 text-sm font-medium truncate flex-1 block">
                Search cakes, desserts and more...
              </span>

              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors p-1 flex items-center justify-center">
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM DESKTOP NAVIGATION LINKS */}
        <div className="hidden lg:flex items-center justify-start gap-8 xl:gap-10 tv:gap-14 py-2 tv:py-3 border-t border-border/10 bg-navbar responsive-container relative">
          <MegaMenu />
          <Link to="/custom-cake" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-4">Custom Cakes</Link>
          <Link to="/occasion/anniversary" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-4">Anniversary</Link>
          <Link to="/shop?bestseller=true" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-4">Bestseller</Link>
          <Link to="/shop?featured=true" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-4">Features</Link>
        </div>
      </nav>

      {/* Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[210]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-full sm:w-[82%] sm:max-w-[360px] bg-card z-[220] shadow-2xl flex flex-col">
              <div className="p-4 border-b border-border/15">
                <div className="flex justify-between items-center mb-4">
                  <LogoMark containerClass="w-[115px]" />
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl text-heading hover:bg-heading/10 transition-all active:scale-95 flex items-center justify-center" aria-label="Close menu"><X size={22} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {[
                  { label: 'Shop All Cakes', icon: ShoppingBag, path: '/shop' },
                  { label: 'Custom Cake', icon: Cake, path: '/custom-cake' },
                  { label: 'My Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
                  { label: 'My Wishlist', icon: Heart, path: '/account/wishlist' },
                  { label: 'Manage Profile', icon: User, path: '/account/profile' },
                  { label: user ? 'Logout' : 'Login / Register', icon: LogIn, path: user ? '#' : '/login', isLogout: !!user },
                ].map((item, i) => {
                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors"><item.icon size={15} className="text-primary" /></div>
                        <span className="font-bold text-[11px] uppercase tracking-wide text-heading">{item.label}</span>
                      </div>
                      {item.badge > 0 && <span className="bg-accent text-[#120807] text-[9px] font-black px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                    </>
                  );

                  if (item.isLogout) {
                    return (
                      <button key={i} onClick={async () => { setIsMenuOpen(false); await logout(); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/8 transition-colors group min-h-[48px]">{content}</button>
                    );
                  }

                  return (
                    <Link key={i} to={item.path} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/8 transition-colors group min-h-[48px]">{content}</Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
    </>
  );
};

export default Navbar;