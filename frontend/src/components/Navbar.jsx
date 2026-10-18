import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, MapPin, Heart, ChevronDown, ShoppingBag, LogIn, LogOut, Loader2,
  Cake, SlidersHorizontal, Bell, Sparkles, Flame, Zap, Star
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
import CustomCakeMenu from './ui/CustomCakeMenu';
import Logo from './Logo';
import { useGetProductsQuery } from '../product/productApi';

const Navbar = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { location: deliveryCity, setLocation: setDeliveryCity } = useDeliveryLocation();

  const { data: offerProductsRes } = useGetProductsQuery({
    offers: 'true',
    limit: 1,
    location: deliveryCity
  });
  const hasOffers = offerProductsRes?.data?.length > 0;

  const handleNavbarLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsMenuOpen(false);
      await logout();
    } catch (e) {
      setIsLoggingOut(false);
    }
  };

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

  // Lock body scroll & listen for ESC key when mobile sidebar is open (Safari + all browsers)
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

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

  return (
    <>
      <nav className={`relative w-full z-[200] transition-all duration-300 bg-navbar text-heading lg:rounded-none ${isScrolled ? 'shadow-md' : ''}`}>

        {/* MOBILE WATERMARK BACKGROUND PATTERN */}
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

        <div className="responsive-container pb-1 lg:pb-0 relative z-10">

          {/* DESKTOP LAYOUT ROW */}
          <div className="hidden lg:flex items-center justify-between gap-3 pt-3.5 pb-2.5">
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" className="shrink-0 block select-none group pr-1">
                <Logo className="w-[100px] sm:w-[118px] lg:w-[128px] h-auto object-contain" />
              </Link>

              <div className="relative shrink-0" ref={locationDropdownRef}>
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-all duration-200 shadow-sm min-w-[140px] tv:min-w-[180px] cursor-pointer"
                >
                  <MapPin size={15} className="text-[var(--primary)] shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest leading-none">Deliver to</span>
                    <span className="text-[11px] font-black text-[var(--heading)] uppercase tracking-wide flex items-center gap-1 leading-tight mt-0.5">
                      {deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'SELECT CITY')}
                      <ChevronDown size={11} className={`transition-transform duration-200 text-[var(--primary)] ${isLocationOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isLocationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 w-48 bg-[var(--card)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden z-50 p-1"
                    >
                      {['coimbatore', 'pan india'].map((city) => (
                        <button
                          key={city} onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                          disabled={city === 'pan india'}
                          className={`w-full text-left px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors ${city === 'pan india' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] cursor-pointer'}`}
                        >
                          {city === 'pan india' ? 'PAN INDIA (Coming Soon)' : 'COIMBATORE'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Search Bar (Uses card background) */}
            <div className="flex flex-1 max-w-md xl:max-w-xl tv:max-w-3xl mx-auto cursor-pointer px-3" onClick={() => setIsSearchOverlayOpen(true)}>
              <div className="relative w-full">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]" />
                <input
                  type="text" readOnly placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--body)] font-medium pl-11 pr-11 py-2 rounded-full outline-none text-xs sm:text-sm hover:border-[var(--primary)] transition-all cursor-pointer shadow-sm"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)] hover:scale-110 transition-transform p-1">
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Desktop Navigation Panels */}
            <div className="flex items-center gap-1 shrink-0">
              {user ? (
                <NotificationDropdown
                  buttonClass="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[52px] relative cursor-pointer"
                  iconClass="text-heading group-hover:text-primary transition-colors"
                  showLabel={true}
                />
              ) : (
                <button onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))} className="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[52px]">
                  <Bell size={24} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Alerts</span>
                </button>
              )}

              {user ? (
                <Link to={user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard'} className="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[52px]">
                  <User size={18} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[52px]">
                    <User size={18} className="text-heading group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Sign In</span>
                  </Link>
                </>
              )}

              <Link to="/cart" className="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors relative min-w-[52px]">
                <ShoppingCart size={18} className="text-heading group-hover:text-primary transition-colors" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-[#120807] text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full leading-none px-1">{cartCount}</span>}
                <span className="text-[10px] font-bold text-muted group-hover:text-primary uppercase tracking-wide transition-colors">Cart</span>
              </Link>
              <ThemeToggle
                buttonClass="flex flex-col items-center gap-0.5 px-2 py-0.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[52px] relative cursor-pointer"
                iconClass="text-heading group-hover:text-primary transition-colors"
                showLabel={true}
              />
            </div>
          </div>

          {/* MOBILE VIEW LAYOUT */}
          <div className="lg:hidden flex flex-col gap-3 pt-3.5 pb-3.5 px-1.5">

            {/* Top Row: Menu + Logo (Left) | Notification + Theme (Right) */}
            <div className="flex items-center justify-between w-full px-0.5">
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setIsMenuOpen(true)} className="p-1 rounded-lg transition-colors flex-shrink-0">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-heading">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <Link to="/" className="shrink-0 block select-none group pr-0.5 pl-0">
                  <Logo className="w-[100px] sm:w-[118px] h-auto object-contain" />
                </Link>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user ? (
                  <NotificationDropdown iconClass="text-heading" />
                ) : (
                  <button onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center relative">
                    <Bell size={22} className="text-heading" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                  </button>
                )}
                <ThemeToggle buttonClass="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center relative" iconClass="text-heading" />
              </div>
            </div>

            {/* Location Capsule Row */}
            <div className="flex justify-start relative px-0.5" ref={mobileLocationDropdownRef}>
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--heading)] transition-all text-[11px] font-black tracking-wider uppercase shadow-sm cursor-pointer whitespace-nowrap"
              >
                <MapPin size={14} className="text-[var(--primary)] shrink-0" />
                <span className="flex items-center gap-1">
                  {deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'SELECT CITY')}
                  <ChevronDown size={11} className={`transition-transform duration-200 text-[var(--primary)] ${isLocationOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1.5 left-0.5 w-48 bg-[var(--card)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden z-[100] p-1"
                  >
                    {['coimbatore', 'pan india'].map((city) => (
                      <button
                        key={city} onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                        disabled={city === 'pan india'}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors ${city === 'pan india' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] cursor-pointer'}`}
                      >
                        {city === 'pan india' ? 'PAN INDIA (Coming Soon)' : 'COIMBATORE'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Search Pill */}
            <div
              className="relative w-full cursor-pointer flex items-center pl-11 pr-11 py-3 rounded-full bg-[var(--card)] border border-[var(--border)] min-h-[46px] select-none hover:border-[var(--primary)] transition-all shadow-sm"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]" />

              <span className="text-[var(--body)] font-medium text-xs sm:text-sm truncate flex-1 block">
                Search cakes, desserts and more...
              </span>

              <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)] hover:scale-110 transition-transform p-1 flex items-center justify-center">
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM DESKTOP NAVIGATION LINKS */}
        <div className="hidden lg:flex items-center justify-start gap-5 xl:gap-7 tv:gap-10 pt-1 pb-2.5 bg-navbar responsive-container relative">
          <MegaMenu />
          <CustomCakeMenu />
          {hasOffers && (
            <Link to="/shop?offers=true" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2 flex items-center gap-1">
              Offer Cakes <span className="text-xs">🔥</span>
            </Link>
          )}
          <Link to="/shop?bestseller=true" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2">Bestseller</Link>
          <Link to="/shop?category=special cakes" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2">Special Cakes</Link>
        </div>
      </nav>

      {/* Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[210]"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-2 bottom-2 left-0 w-[85%] max-w-[340px] max-h-[calc(100dvh-16px)] bg-card border border-l-0 border-border/30 rounded-r-[28px] z-[220] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-border/15 flex items-center justify-between bg-surface/50">
                <Logo className="w-[120px] h-auto object-contain" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-border/20 hover:bg-border/40 text-heading transition-all flex items-center justify-center active:scale-95"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2 block px-2">
                    Explore Menu
                  </span>
                  <div className="space-y-1">
                    <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary shrink-0">
                        <ShoppingBag size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Shop All Cakes</span>
                    </Link>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2 space-y-1.5 mt-1">
                      <Link to="/custom-cake" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-2.5">
                          <Sparkles size={16} className="text-primary animate-pulse" />
                          <span className="font-extrabold text-sm text-primary uppercase tracking-wide">Custom Cakes</span>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">✨ DEDICATED</span>
                      </Link>

                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-primary/15">
                        <Link to="/custom-cake?tier=1" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-bold text-center py-1 rounded bg-card/60 hover:bg-primary/20 text-heading hover:text-primary transition-colors">1 Tier</Link>
                        <Link to="/custom-cake?tier=2" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-bold text-center py-1 rounded bg-card/60 hover:bg-primary/20 text-heading hover:text-primary transition-colors">2 Tiers</Link>
                        <Link to="/custom-cake?tier=3" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-bold text-center py-1 rounded bg-card/60 hover:bg-primary/20 text-heading hover:text-primary transition-colors">3 Tiers</Link>
                      </div>
                    </div>

                    {hasOffers && (
                      <Link to="/shop?offers=true" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <Flame size={16} />
                          </div>
                          <span className="font-extrabold text-sm text-heading group-hover:text-amber-500 transition-colors">Offer Cakes</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">🔥 HOT</span>
                      </Link>
                    )}

                    <Link to="/shop?bestseller=true" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Star size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Bestsellers</span>
                    </Link>

                    <Link to="/shop?category=special cakes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Zap size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Special Cakes</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/15">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2 block px-2">
                    My Account
                  </span>
                  <div className="space-y-1">
                    <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <ShoppingCart size={16} />
                        </div>
                        <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">My Cart</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="bg-accent text-[#120807] text-[10px] font-black px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                    <Link to="/account/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Heart size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">My Wishlist</span>
                    </Link>

                    <Link to="/account/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Manage Profile</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/15">
                  {user ? (
                    <button
                      onClick={handleNavbarLogout}
                      disabled={isLoggingOut}
                      className="logout-btn-danger w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-80"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white shrink-0" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut size={18} className="text-white shrink-0" />
                          <span>Logout Account</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-[var(--primary)] text-[var(--button-text)] font-extrabold text-sm transition-colors justify-center shadow-md hover:brightness-110"
                      >
                        <User size={16} />
                        <span>Sign In / Register</span>
                      </Link>
                    </div>
                  )}
                </div>

              </div>

              <div className="p-3.5 border-t border-border/15 bg-surface/50 text-[11px] font-extrabold text-muted flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" />
                  <span className="uppercase">{deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'COIMBATORE')}</span>
                </div>
                <ThemeToggle buttonClass="p-1.5 rounded-lg hover:bg-border/20 transition-colors" iconClass="text-heading" />
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