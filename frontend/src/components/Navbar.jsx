import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
  Box, Cake, Leaf, Egg, Sun, Moon, Mic
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryLocation } from '../context/LocationContext';
import SearchOverlay from './search/SearchOverlay';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { label: 'HOME', path: '/' },
  { label: 'SHOP ALL', path: '/shop' },
  { label: 'CUSTOM CAKE', path: '/custom-cake' },
  { label: 'BESTSELLERS', path: '/shop?bestseller=true' },
  { label: 'FLOWERS', path: '/shop?category=flowers' },
  { label: 'BIRTHDAY', path: '/occasion/birthday' },
  { label: 'ANNIVERSARY', path: '/occasion/anniversary' },
  { label: 'GIFTS', path: '/shop?category=gifts' },
  { label: 'CHOCOLATES', path: '/shop?category=chocolates' },
];

const Navbar = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { location: deliveryCity, setLocation: setDeliveryCity } = useDeliveryLocation();
  const location = useLocation();
  const locationDropdownRef = useRef(null);

  const cartCount = cartItems ? cartItems.reduce((acc, item) => acc + item.qty, 0) : 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className={`sticky top-0 left-0 right-0 z-[100] bg-navbar transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="w-full px-4 sm:px-6 lg:px-10">

          {/* ── MAIN ROW ── */}
          <div className="relative flex items-center gap-3 lg:gap-5 py-3">

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary/8 transition-colors shrink-0"
            >
              <Menu size={22} className="text-heading" />
            </button>

            {/* Logo — centered on mobile, left on desktop */}
            <Link to="/" className="shrink-0 lg:shrink-0 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
              <div className="font-black uppercase leading-none tracking-tight text-heading text-center lg:text-left">
                <div className="text-[9px] sm:text-[10px] lg:text-[11px] tracking-[0.2em]">THE CHOCOLATE</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl tracking-tight -mt-0.5">MINE</div>
              </div>
            </Link>

            {/* Location Selector — Desktop */}
            <div className="hidden lg:block relative shrink-0" ref={locationDropdownRef}>
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-surface hover:border-primary/30 transition-all duration-200 min-w-[150px]"
              >
                <MapPin size={15} className="text-primary shrink-0" />
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
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1.5 w-44 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-50"
                  >
                    {['coimbatore', 'pan india'].map((city, i) => (
                      <button
                        key={city}
                        onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider hover:bg-primary/8 text-heading transition-colors ${i > 0 ? 'border-t border-border/30' : ''} ${deliveryCity === city ? 'bg-primary/8 text-primary' : ''}`}
                      >
                        {city === 'pan india' ? 'PAN INDIA' : 'COIMBATORE'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar — desktop only */}
            <div
              className="hidden lg:flex flex-1 cursor-pointer"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-surface border border-border/60 text-foreground pl-9 pr-10 py-2.5 rounded-xl outline-none placeholder:text-muted/50 text-sm cursor-pointer hover:border-primary/30 transition-colors"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-primary transition-colors">
                  <Mic size={15} />
                </button>
              </div>
            </div>

            {/* Action Icons — Desktop only */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                user
                  ? { icon: User, label: user.name.split(' ')[0], to: user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard' }
                  : { icon: LogIn, label: 'Sign In', to: '/login' },
              ].map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[64px]">
                  <Icon size={20} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[9px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">{label}</span>
                </Link>
              ))}

              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-primary/8 group transition-colors relative min-w-[64px]">
                <div className="relative">
                  <ShoppingCart size={20} className="text-heading group-hover:text-primary transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-accent text-[#120807] text-[9px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full leading-none px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-muted group-hover:text-primary uppercase tracking-wide transition-colors">Cart</span>
              </Link>

              {/* Theme toggle — Icon Only with smooth rotation/scale transition */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-primary/8 text-heading hover:text-primary transition-colors ml-1 flex items-center justify-center h-10 w-10 shrink-0"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>

            {/* Mobile Theme Toggle — Far Right Corner */}
            <button
              onClick={toggleTheme}
              className="lg:hidden ml-auto p-2 rounded-lg hover:bg-primary/8 text-heading transition-colors shrink-0 z-10 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                </motion.div>
              </AnimatePresence>
            </button>

          </div>

          {/* ── BADGES + NAV ROW ── */}
          <div className={`hidden lg:flex items-center justify-between border-t border-border/20 transition-all duration-300 ${isScrolled ? 'h-0 opacity-0 overflow-hidden pointer-events-none py-0' : 'py-2 opacity-100'}`}>

            {/* Badges left */}
            <div className="flex items-center gap-2 shrink-0 mr-6">
              <div className="flex items-center gap-1.5 bg-[var(--badge-green-bg)] border border-green-200/60 dark:border-green-800/40 px-2.5 py-1 rounded-full">
                <Leaf size={11} className="text-green-600 dark:text-green-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-green-700 dark:text-green-400">Pure Veg</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--badge-amber-bg)] border border-amber-200/60 dark:border-amber-800/40 px-2.5 py-1 rounded-full">
                <Egg size={11} className="text-amber-600 dark:text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Eggless</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
              {NAV_LINKS.map(({ label, path }) => {
                const isActive = location.pathname === path || (path !== '/' && location.pathname + location.search === path);
                return (
                  <Link
                    key={label}
                    to={path}
                    className={`text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-colors relative group pb-1 ${isActive ? 'text-primary' : 'text-heading/70 hover:text-heading'}`}
                  >
                    {label}
                    <span className={`absolute bottom-0 left-0 h-[2px] bg-primary rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile rows below top bar */}
          <div className="lg:hidden pb-3 space-y-2">

            {/* Location pill — centered */}
            <div className="flex justify-center" ref={locationDropdownRef}>
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-border/60 bg-surface hover:border-primary/30 transition-colors"
              >
                <MapPin size={13} className="text-primary" />
                <span className="text-[11px] font-black text-heading uppercase tracking-widest">
                  {deliveryCity === 'pan india' ? 'PAN INDIA' : (deliveryCity?.toUpperCase() || 'SELECT CITY')}
                </span>
                <ChevronDown size={13} className="text-heading transition-transform duration-200" style={{ transform: isLocationOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>

            {/* Location dropdown */}
            <AnimatePresence>
              {isLocationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-xl border border-border/50 overflow-hidden mx-2">
                    {['coimbatore', 'pan india'].map((city, i) => (
                      <button
                        key={city}
                        onClick={() => { setDeliveryCity(city); setIsLocationOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider hover:bg-primary/8 text-heading transition-colors ${i > 0 ? 'border-t border-border/30' : ''} ${deliveryCity === city ? 'text-primary' : ''}`}
                      >
                        {city === 'pan india' ? 'PAN INDIA' : 'COIMBATORE'}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search bar */}
            <div className="relative" onClick={() => setIsSearchOverlayOpen(true)}>
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
              <input
                type="text"
                readOnly
                placeholder="Search cakes, desserts and more..."
                className="w-full bg-surface border border-border/60 text-foreground pl-9 pr-10 py-2.5 rounded-xl outline-none placeholder:text-muted/50 text-sm cursor-pointer"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50">
                <Mic size={15} />
              </button>
            </div>

            {/* Pure Veg + Eggless badges */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 bg-[var(--badge-green-bg)] border border-green-200/60 dark:border-green-800/40 px-3 py-1.5 rounded-full">
                <Leaf size={11} className="text-green-600 dark:text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-400">Pure Veg</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--badge-amber-bg)] border border-amber-200/60 dark:border-amber-800/40 px-3 py-1.5 rounded-full">
                <Egg size={11} className="text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Eggless</span>
              </div>
            </div>
          </div>

        </div>
      </nav>

      {/* ── MOBILE SIDEBAR ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[75%] max-w-[280px] bg-card z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border/15">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-black uppercase leading-none tracking-tight text-heading">
                    <div className="text-[9px] tracking-[0.2em]">THE CHOCOLATE</div>
                    <div className="text-2xl tracking-tight">MINE</div>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-primary/8 text-heading">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {[
                  { label: 'Shop All Cakes', icon: ShoppingBag, path: '/shop' },
                  { label: 'Custom Cake', icon: Cake, path: '/custom-cake' },
                  { label: 'My Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
                  { label: 'My Wishlist', icon: Heart, path: '/account/wishlist' },
                  { label: 'Manage Profile', icon: User, path: '/account/profile' },
                  { label: user ? 'Logout' : 'Login / Register', icon: LogIn, path: user ? '/logout' : '/login' },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/8 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                        <item.icon size={15} className="text-primary" />
                      </div>
                      <span className="font-bold text-[11px] uppercase tracking-wide text-heading">item.label</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="bg-accent text-[#120807] text-[9px] font-black px-1.5 py-0.5 rounded-md">{item.badge}</span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-border/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[var(--badge-green-bg)] px-2.5 py-1 rounded-full">
                      <Leaf size={11} className="text-green-600 dark:text-green-400" />
                      <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-wide">Pure Veg</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[var(--badge-amber-bg)] px-2.5 py-1 rounded-full">
                      <Egg size={11} className="text-amber-600 dark:text-amber-400" />
                      <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">Eggless</span>
                    </div>
                  </div>
                  <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-primary/8 transition-colors flex items-center justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={theme}
                        initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        {theme === 'dark' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
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