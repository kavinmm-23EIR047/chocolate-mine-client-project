import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, Sun, Moon,
  MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
  Box, Cake, MoreVertical
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
            ? 'bg-white/95 backdrop-blur-xl shadow-premium border-b border-border/10'
            : 'bg-white'
          }`}
>
        <div className="w-full px-4 sm:px-12 lg:px-20">
          {/* ROW 1: MAIN HEADER */}
          <div className={`flex items-center justify-between gap-6 transition-all duration-500 ${isScrolled ? 'py-2' : 'py-4'} border-b border-border/5`}>
            
            {/* 1. LOGO */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <Logo className={`bg-card rounded-2xl p-1.5 shadow-lg border border-border/50 group-hover:scale-105 transition-all duration-500 ${isScrolled ? 'w-8 h-8 sm:w-12 sm:h-12' : 'w-10 h-10 sm:w-16 sm:h-16'}`} />
              <div className="flex flex-col">
                <span className={`font-black text-primary tracking-tighter leading-none uppercase transition-all ${isScrolled ? 'text-[12px] sm:text-[20px]' : 'text-[14px] sm:text-[24px]'}`}>Chocolate Mine</span>
                <span className={`font-black text-primary/40 tracking-[0.4em] uppercase mt-1 leading-none transition-all ${isScrolled ? 'text-[6px] sm:text-[10px]' : 'text-[8px] sm:text-[12px]'}`}>Artisan Deli</span>
              </div>
            </Link>

            {/* 2. LOCATION SELECTOR (Desktop Only) */}
            <div className={`hidden lg:flex items-center gap-4 cursor-pointer group px-6 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all duration-500 min-w-[200px] ${isScrolled ? 'py-1.5' : 'py-2.5'}`}
              onClick={() => setIsLocationOpen(!isLocationOpen)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-5 bg-primary/20 rounded flex items-center justify-center overflow-hidden">
                   <MapPin size={14} className="text-primary" />
                </div>
                <div className="flex flex-col flex-grow">
                   <span className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">Deliver to</span>
                   <span className="text-xs font-black text-heading flex items-center justify-between gap-2 uppercase tracking-tight">
                     {deliveryCity || 'Select City'} <ChevronDown size={14} className={`transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                   </span>
                </div>
              </div>
            </div>

            {/* 3. SEARCH BAR (Desktop Only) */}
            <div
              className="hidden md:flex flex-1 max-w-3xl cursor-pointer mx-8"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <div className="relative group w-full">
                <input
                  type="text"
                  readOnly
                  placeholder="Search for cakes, desserts and more..."
                  className={`w-full bg-surface/90 border border-border/50 text-foreground pl-8 pr-14 rounded-2xl outline-none placeholder:text-muted/50 font-semibold text-sm transition-all group-hover:bg-surface group-hover:border-primary/30 group-hover:shadow-md ${isScrolled ? 'py-2.5' : 'py-4'}`}
                />
                <div className="absolute right-0 top-0 h-full px-6 flex items-center bg-transparent">
                  <Search size={isScrolled ? 18 : 22} className="text-primary/50 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* 4. ACTION ICONS */}
            <div className={`flex items-center gap-4 sm:gap-8 lg:gap-10 transition-all duration-500 ${isScrolled ? 'scale-90 origin-right' : ''}`}>
              
              <Link to="/account/orders" className="hidden lg:flex flex-col items-center gap-2 group">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                   <Box size={20} className="text-primary/80 group-hover:text-primary" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary leading-none">Track Order</span>
              </Link>

              {/* Account/User (Desktop Only) */}
              {user ? (
                <Link to={user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard'} className="hidden lg:flex flex-col items-center gap-2 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <User size={20} className="text-primary/80 group-hover:text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary leading-none">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className="hidden lg:flex flex-col items-center gap-2 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <LogIn size={20} className="text-primary/80 group-hover:text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary leading-none">Sign In</span>
                </Link>
              )}

              {/* Cart (Desktop Only) */}
              <Link to="/cart" className="hidden lg:flex flex-col items-center gap-2 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <ShoppingCart size={20} className="text-primary/80 group-hover:text-primary" />
                  </div>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-navbar group-hover:scale-110 transition-transform">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary leading-none">Cart</span>
              </Link>

              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsSearchOverlayOpen(true)}
                className="lg:hidden p-2 text-primary hover:bg-primary/5 rounded-2xl transition-all"
              >
                <Search size={22} />
              </button>

              {/* Theme Toggle (Mobile & Desktop) */}
              <div className="flex">
                 <ThemeToggle />
              </div>

              {/* Mobile Menu Icon (3 Dots / MoreVertical) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-primary hover:bg-primary/5 rounded-2xl transition-all"
              >
                <MoreVertical size={24} />
              </button>
            </div>
          </div>

          {/* ROW 2: NAVIGATION LINKS (Full width & Balanced) */}
          <div className={`hidden lg:flex transition-all duration-500 overflow-hidden ${isScrolled ? 'h-0 opacity-0 pointer-events-none' : 'h-14 opacity-100'}`}>
            <div className="flex items-center justify-center py-4 gap-12 overflow-x-auto no-scrollbar">
            {[
              { label: 'Home', path: '/' },
              { label: 'Shop All', path: '/shop' },
              { label: 'Custom cake', path: '/custom-cake' },
              { label: 'Bestsellers', path: '/shop?bestseller=true' },
              { label: 'Flowers', path: '/shop?category=flowers' },
              { label: 'Birthday', path: '/occasion/birthday' },
              { label: 'Anniversary', path: '/occasion/anniversary' },
              { label: 'Gifts', path: '/shop?category=gifts' },
              { label: 'Chocolates', path: '/shop?category=chocolates' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`text-[13px] font-black uppercase tracking-[0.15em] transition-all hover:text-primary relative group pb-1 whitespace-nowrap ${location.pathname === link.path ? 'text-primary' : 'text-heading/60'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
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
