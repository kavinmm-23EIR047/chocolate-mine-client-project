import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, Sun, Moon,
  MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
  Box, Cake
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryLocation } from '../context/LocationContext';
import Logo from './Logo';
import SearchOverlay from './search/SearchOverlay';
import ThemeToggle from './ui/ThemeToggle';

const Navbar = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { location: deliveryCity, setLocation: setDeliveryCity } = useDeliveryLocation();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = cartItems ? cartItems.reduce((acc, item) => acc + item.qty, 0) : 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Sticky Navbar */}
      <nav
        className={`sticky top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled
            ? 'bg-navbar/95 backdrop-blur-xl shadow-premium py-2 border-b border-border/10'
            : 'bg-navbar py-4'
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-12">

            {/* 1. LOGO */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
              <div className="relative">
                <Logo className="w-10 h-10 sm:w-14 sm:h-14 bg-card rounded-xl sm:rounded-2xl p-1.5 shadow-lg sm:shadow-xl shadow-primary/10 border border-border/50 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute -inset-1 bg-primary/5 blur-lg rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] sm:text-[18px] font-black text-primary tracking-tighter leading-none uppercase">The Chocolate</span>
                <span className="text-[9px] sm:text-[12px] font-black text-accent tracking-[0.4em] uppercase mt-0.5 sm:mt-1 leading-none">Mine</span>
              </div>
            </Link>

            {/* 1.5 MAIN LINKS (Desktop) */}
            <div className="hidden lg:flex items-center gap-8 px-4">
              {[
                { label: 'Home', path: '/' },
                { label: 'Shop', path: '/shop' },
                { label: 'Custom cake', path: '/custom-cake' },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-muted'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* 2. SEARCH BAR */}
            <div
              className="hidden md:flex flex-1 max-w-xl cursor-pointer"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <div className="relative group w-full">
                <input
                  type="text"
                  readOnly
                  placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-surface/50 border border-border/60 text-foreground pl-6 pr-12 py-3 rounded-2xl shadow-sm outline-none placeholder:text-muted/50 font-semibold text-sm transition-all group-hover:bg-surface group-hover:border-primary/30 group-hover:shadow-md"
                />
                <div className="absolute right-0 top-0 h-full px-5 flex items-center bg-transparent">
                  <Search size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* 3. ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">

              {/* Delivery Location */}
              <div className="hidden lg:relative lg:flex items-center gap-3 cursor-pointer group py-2.5 px-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all duration-300"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-button-text transition-all duration-300">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">Deliver to</span>
                  <span className="text-xs font-black flex items-center gap-1 group-hover:text-primary transition-colors uppercase mt-1">
                    {deliveryCity || 'Select City'} <ChevronDown size={14} className={`transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                  </span>
                </div>

                <AnimatePresence>
                  {isLocationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute top-full left-0 mt-3 w-56 bg-card/95 backdrop-blur-xl border border-border/40 shadow-2xl rounded-3xl py-3 z-[110] overflow-hidden"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-border/30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Select your city</span>
                      </div>
                      {['coimbatore'].map(city => (
                        <button
                          key={city}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeliveryCity(city);
                            setIsLocationOpen(false);
                          }}
                          className={`w-full text-left px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-button-text transition-all ${deliveryCity === city ? 'bg-primary/10 text-primary' : 'text-heading'}`}
                        >
                          {city}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Account */}
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard'}
                  className="hidden sm:flex items-center gap-3 group py-2.5 px-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-button-text transition-all">
                    <User size={18} />
                  </div>
                  <span className="hidden lg:inline text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:flex items-center gap-3 group py-2.5 px-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-button-text transition-all">
                    <User size={18} />
                  </div>
                  <span className="hidden lg:inline text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">Login</span>
                </Link>
              )}

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative flex items-center gap-3 group py-2.5 px-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all"
              >
                <div className="relative">
                  <ShoppingCart size={22} className="text-primary transition-transform group-hover:-translate-y-0.5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-navbar group-hover:scale-110 transition-transform">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">Cart</span>
              </Link>

              {/* Mobile Search & Menu Toggle */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSearchOverlayOpen(true)}
                  className="md:hidden p-3 text-primary hover:bg-primary/5 rounded-2xl transition-all"
                >
                  <Search size={20} />
                </button>
                <div className="flex items-center gap-1 sm:gap-2">
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-3 text-primary hover:bg-primary/5 rounded-2xl transition-all"
                >
                  <Menu size={24} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-footer/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[280px] bg-card z-[120] shadow-2xl p-0 flex flex-col overflow-hidden"
            >
              <div className="bg-navbar p-6 border-b border-border/10">
                <div className="flex justify-between items-center mb-6">
                  <Link to="/" onClick={() => setIsMenuOpen(false)}>
                    <Logo className="w-10 h-10 bg-card rounded-xl p-1.5 shadow-lg border border-border/50" />
                  </Link>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-button-text transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-[14px] font-black uppercase tracking-[0.2em] text-primary">The Chocolate Mine</p>
                
                {/* Mobile Location Selector */}
                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Delivery City</span>
                  </div>
                  <div className="flex gap-2">
                    {['coimbatore'].map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setDeliveryCity(city);
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryCity === city ? 'bg-primary text-button-text shadow-lg' : 'bg-background text-heading border border-border/50'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {[
                  { label: 'Shop All Cakes', icon: ShoppingBag, path: '/shop' },
                  { label: 'Custom Cake', icon: Cake, path: '/custom-cake' },
                  { label: 'My Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
                  { label: 'My Wishlist', icon: Heart, path: '/account/wishlist' },
                  { label: 'My Orders', icon: Box, path: '/account/orders' },
                  { label: 'Manage Profile', icon: User, path: '/account/profile' },
                  { label: user ? 'Logout' : 'Login / Register', icon: LogIn, path: user ? '/logout' : '/login' },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-button-text transition-all">
                        <item.icon size={18} />
                      </div>
                      <span className="font-black text-heading text-[11px] uppercase tracking-widest group-hover:text-primary transition-colors">{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="bg-accent text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
      />
    </>
  );
};

export default Navbar;
