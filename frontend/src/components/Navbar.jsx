import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
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

  // Using imported Logo component instead of inline LogoMark

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

        <div className="responsive-container pb-3 lg:pb-0 relative z-10">

          {/* DESKTOP LAYOUT ROW */}
          <div className="hidden lg:flex items-center justify-between gap-3 py-2 min-h-[54px] tv:min-h-[72px]">
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/" className="shrink-0 block select-none group pr-1">
                <Logo className="w-[110px] sm:w-[130px] lg:w-[145px] h-auto object-contain" />
              </Link>

              <div className="relative shrink-0" ref={locationDropdownRef}>
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-surface hover:border-primary/30 transition-all duration-200 min-w-[140px] tv:min-w-[180px]"
                >
                  <MapPin size={14} className="text-primary shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">Deliver to</span>
                    <span className="text-[12px] font-black text-heading uppercase tracking-wide flex items-center gap-1 leading-tight mt-0.5">
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
            <div className="flex flex-1 max-w-md xl:max-w-xl tv:max-w-3xl mx-auto cursor-pointer px-4" onClick={() => setIsSearchOverlayOpen(true)}>
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-heading/70" />
                <input
                  type="text" readOnly placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-surface border border-border/60 text-foreground pl-12 pr-12 py-3.5 rounded-full outline-none text-sm cursor-pointer"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-heading/60 hover:text-heading transition-colors">
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Desktop Navigation Panels */}
            <div className="flex items-center gap-1.5 shrink-0">
              {user ? (
                <NotificationDropdown 
                  buttonClass="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[56px] relative cursor-pointer"
                  iconClass="text-heading group-hover:text-primary transition-colors"
                  showLabel={true}
                />
              ) : (
                <button onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[56px]">
                  <Bell size={20} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Alerts</span>
                </button>
              )}

              {[user ? { icon: User, label: user.name.split(' ')[0], to: user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard' } : { icon: LogIn, label: 'Sign In', to: '/login' }].map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[56px]">
                  <Icon size={20} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">{label}</span>
                </Link>
              ))}

              <Link to="/cart" className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl hover:bg-primary/8 group transition-colors relative min-w-[56px]">
                <ShoppingCart size={20} className="text-heading group-hover:text-primary transition-colors" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-[#120807] text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full leading-none px-1">{cartCount}</span>}
                <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide transition-colors">Cart</span>
              </Link>
              <ThemeToggle 
                buttonClass="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl hover:bg-primary/8 group transition-colors min-w-[56px] relative cursor-pointer"
                iconClass="text-heading group-hover:text-primary transition-colors"
                showLabel={true}
              />
            </div>
          </div>

          {/* MOBILE VIEW LAYOUT */}
          <div className="lg:hidden flex flex-col gap-4 pt-3 pb-1">

            {/* Top Row: Menu + Logo + Actions */}
            <div className="flex items-center justify-between w-full px-1">
              {/* Left Side: Menu + Logo */}
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMenuOpen(true)} className="p-1 rounded-lg transition-colors flex-shrink-0">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-heading">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <Link to="/" className="shrink-0 block select-none group pr-0.5 pl-0">
                  <Logo className="w-[110px] sm:w-[130px] h-auto object-contain" />
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
                <ThemeToggle buttonClass="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center relative" iconClass="text-heading" />
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
        <div className="hidden lg:flex items-center justify-start gap-5 xl:gap-7 tv:gap-10 py-1 border-t border-border/10 bg-navbar responsive-container relative">
          <MegaMenu />
          <CustomCakeMenu />
          <Link to="/shop?offers=true" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2.5 flex items-center gap-1">
            Offer Cakes <span className="text-xs">🔥</span>
          </Link>
          <Link to="/shop?bestseller=true" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2.5">Bestseller</Link>
          <Link to="/shop?featured=true" className="text-sm font-black uppercase tracking-widest text-heading hover:text-primary transition-colors py-2.5">Features</Link>
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
              className="fixed top-2 bottom-2 left-0 w-[85%] max-w-[340px] bg-card border border-l-0 border-border/30 rounded-r-[28px] z-[220] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
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

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                
                {/* SECTION 1: MAIN MENU */}
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

                    {/* Custom Cakes with Sub Tiers */}
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

                    <Link to="/shop?offers=true" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <Flame size={16} />
                        </div>
                        <span className="font-extrabold text-sm text-heading group-hover:text-amber-500 transition-colors">Offer Cakes</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">🔥 HOT</span>
                    </Link>

                    <Link to="/shop?bestseller=true" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Star size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Bestsellers</span>
                    </Link>

                    <Link to="/shop?featured=true" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Zap size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-heading group-hover:text-primary transition-colors">Featured Items</span>
                    </Link>
                  </div>
                </div>

                {/* SECTION 2: MY ACCOUNT & BAG */}
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

                {/* SECTION 3: AUTH ACTION */}
                <div className="pt-3 border-t border-border/15">
                  {user ? (
                    <button 
                      onClick={async () => { setIsMenuOpen(false); await logout(); }} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-extrabold text-sm transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                        <LogIn size={16} />
                      </div>
                      <span>Logout Account</span>
                    </button>
                  ) : (
                    <Link 
                      to="/login" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-button-text font-extrabold text-sm transition-colors justify-center shadow-md"
                    >
                      <LogIn size={16} />
                      <span>Sign In / Register</span>
                    </Link>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
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