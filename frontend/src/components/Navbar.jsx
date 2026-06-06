import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, Menu, X, MapPin, Heart, ChevronDown, ShoppingBag, LogIn,
  Cake, Mic, Bell
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryLocation } from '../context/LocationContext';
import SearchOverlay from './search/SearchOverlay';
import ThemeToggle from './ui/ThemeToggle';

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

  // Shared SVG Logo Markup - Added controlled top padding & margin adjustments
  const LogoMark = ({ containerClass = "w-[105px] sm:w-[125px] lg:w-[135px]" }) => (
    <div className={`flex flex-col items-center text-heading font-sans py-1 my-auto ${containerClass}`}>

      {/* "THE CHOCOLATE" - Flush alignment layout */}
      <div className="w-full flex justify-between text-[5px] sm:text-[6.5px] lg:text-[7.5px] font-bold uppercase leading-none select-none text-heading/90 tracking-normal mb-1 px-[0.5px]">
        <span>T</span><span>H</span><span>E</span>
        <span className="w-[8%]"></span>
        <span>C</span><span>H</span><span>O</span><span>C</span><span>O</span><span>L</span><span>A</span><span>T</span><span>E</span>
      </div>

      {/* "MINE" - Pure Geometric Vector Blueprint */}
      <svg
        viewBox="0 0 325 90"
        className="w-full h-auto fill-current text-heading transition-colors"
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
      <nav className={`sticky top-0 left-0 right-0 z-[100] bg-navbar transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="w-full px-4 sm:px-6 lg:px-10">

          {/* MAIN ROW - flex items-center ensures clean mid-row alignment */}
          <div className="relative flex items-center justify-between gap-4 py-3 min-h-[65px]">

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary/8 transition-colors shrink-0"
            >
              <Menu size={22} className="text-heading" />
            </button>

            {/* Left Block: Logo + Location Selector grouped neatly on the left side */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0 static">
              <Link to="/" className="shrink-0 block select-none group pr-1">
                <LogoMark />
              </Link>

              {/* Location Selector – Desktop */}
              <div className="hidden lg:block relative shrink-0" ref={locationDropdownRef}>
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-surface hover:border-primary/30 transition-all duration-200 min-w-[140px]"
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

            {/* Search Bar – Desktop */}
            <div
              className="hidden lg:flex flex-1 max-w-md xl:max-w-xl mx-auto cursor-pointer px-2"
              onClick={() => setIsSearchOverlayOpen(true)}
            >
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-heading/70 dark:text-foreground/80" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search for cakes, desserts and more..."
                  className="w-full bg-surface border border-border/60 text-foreground pl-10 pr-10 py-2.5 rounded-full outline-none placeholder:text-muted/50 text-xs cursor-pointer hover:border-primary/40 transition-all duration-200"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-heading/60 dark:text-foreground/70 hover:text-primary transition-colors">
                  <Mic size={14} />
                </button>
              </div>
            </div>

            {/* Right Action Icons Panel (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              {/* Notification Bell */}
              <button 
                onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[64px]"
              >
                <div className="relative">
                  <Bell size={19} className={`text-heading group-hover:text-primary transition-colors ${user?.fcmToken ? 'fill-primary text-primary' : ''}`} />
                </div>
                <span className="text-[9px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Alerts</span>
              </button>
              {[
                user
                  ? { icon: User, label: user.name.split(' ')[0], to: user.role === 'admin' ? '/admin/dashboard' : '/account/dashboard' }
                  : { icon: LogIn, label: 'Sign In', to: '/login' },
              ].map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-primary/8 group transition-colors min-w-[64px]">
                  <Icon size={19} className="text-heading group-hover:text-primary transition-colors" />
                  <span className="text-[9px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">{label}</span>
                </Link>
              ))}

              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-primary/8 group transition-colors relative min-w-[64px]">
                <div className="relative">
                  <ShoppingCart size={19} className="text-heading group-hover:text-primary transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-accent text-[#120807] text-[9px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full leading-none px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-muted group-hover:text-primary uppercase tracking-wide transition-colors">Cart</span>
              </Link>

              {/* Theme Toggle – Desktop */}
              <ThemeToggle />
            </div>

            {/* Mobile View – Right Side Icons */}
            <div className="lg:hidden ml-auto flex items-center gap-1">
              <button 
                onClick={() => window.dispatchEvent(new Event('openNotificationPrompt'))}
                className="p-2 rounded-lg hover:bg-primary/8 transition-colors shrink-0"
              >
                <Bell size={20} className={`text-heading ${user?.fcmToken ? 'fill-primary text-primary' : ''}`} />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Search Bar + Location Selector (Secondary Row) */}
          <div className="lg:hidden pb-3 space-y-2">
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

            {/* Mobile Search Input */}
            <div className="relative mx-auto max-w-sm" onClick={() => setIsSearchOverlayOpen(true)}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-heading/70 dark:text-foreground/80" />
              <input
                type="text"
                readOnly
                placeholder="Search cakes, desserts and more..."
                className="w-full bg-surface border border-border/60 text-foreground pl-9 pr-9 py-2.5 rounded-full outline-none placeholder:text-muted/50 text-sm cursor-pointer"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-heading/60 dark:text-foreground/70">
                <Mic size={15} />
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM DESKTOP NAVIGATION ROW */}
        <div className="hidden lg:flex items-center justify-start gap-10 py-2.5 px-4 sm:px-6 lg:px-10 border-t border-border/10 bg-navbar max-w-[1400px] mx-auto w-full">
          <Link to="/shop" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors">All</Link>
          <Link to="/custom-cake" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors">Custom Cakes</Link>
          <Link to="/occasion/anniversary" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors">Anniversary</Link>
          <Link to="/shop?bestseller=true" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors">Bestseller</Link>
          <Link to="/shop?featured=true" className="text-xs font-black uppercase tracking-widest text-heading hover:text-primary transition-colors">Features</Link>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation Drawer */}
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
                  <LogoMark containerClass="w-[115px]" />
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
                      <span className="font-bold text-[11px] uppercase tracking-wide text-heading">{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="bg-accent text-[#120807] text-[9px] font-black px-1.5 py-0.5 rounded-md">{item.badge}</span>
                    )}
                  </Link>
                ))}
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