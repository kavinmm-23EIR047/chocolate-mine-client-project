import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, ShieldCheck, CreditCard, Truck,
  Cake, Cookie, Candy, Flower2, Flame, IceCream, ChevronDown
} from 'lucide-react';
import {
  FaInstagram as InstagramIcon,
  FaWhatsapp as Whatsapp
} from 'react-icons/fa';
import Button from './ui/Button';
import PureVegBadge from './ui/PureVegBadge';
import Logo from './Logo';
import api from '../utils/api';

const Footer = () => {
  const [quickShopItems, setQuickShopItems] = useState([]);
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchQuickShopData = async () => {
      try {
        const [catRes, occRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/occasions').catch(() => ({ data: [] }))
        ]);

        const rawCats = catRes.data?.data || catRes.data || [];
        const rawOccs = occRes.data?.data || occRes.data || [];

        let items = [];
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          items = rawCats
            .filter(c => (c.name || c.label) && (c.name || c.label).toLowerCase() !== 'all')
            .map(c => ({
              name: c.name || c.label,
              path: `/shop?category=${encodeURIComponent(c.name || c.label)}`
            }));
        } else if (Array.isArray(rawOccs) && rawOccs.length > 0) {
          items = rawOccs.map(o => ({
            name: o.name || o.title,
            path: `/shop?occasion=${encodeURIComponent(o.name || o.title)}`
          }));
        }

        if (items.length > 0) {
          setQuickShopItems(items.slice(0, 6));
        }
      } catch (err) {
        console.error('Error fetching backend categories for footer:', err);
      }
    };

    fetchQuickShopData();
  }, []);
  return (
    <footer id="site-footer" className="dark bg-footer text-footer-text pt-8 sm:pt-12 pb-8 sm:pb-12 overflow-hidden relative transition-colors duration-300">

      {/* ─── AMBIENT BACKGROUND WATERMARKS & BLURS ─── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

      {/* Floating Scattered Icons - Animated */}
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 15, 0], rotate: [-12, -2, -12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-[8%] opacity-15 pointer-events-none text-amber-500"
      >
        <Cake size={90} strokeWidth={1.5} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 25, 0], x: [0, -20, 0], rotate: [45, 60, 45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 right-[8%] opacity-15 pointer-events-none text-yellow-600"
      >
        <Cookie size={80} strokeWidth={1.5} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, -30, 0], x: [0, 25, 0], rotate: [-45, -30, -45] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] left-[45%] opacity-10 pointer-events-none text-pink-500"
      >
        <Candy size={120} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0], x: [0, 30, 0], rotate: [12, 25, 12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-16 right-[20%] opacity-15 pointer-events-none text-rose-400"
      >
        <Flower2 size={85} strokeWidth={1.5} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, -25, 0], x: [0, -15, 0], rotate: [-6, 10, -6] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-20 left-[25%] opacity-15 pointer-events-none text-orange-500"
      >
        <Flame size={65} strokeWidth={1.5} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 35, 0], x: [0, -25, 0], rotate: [-12, 5, -12] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute top-[20%] right-[3%] opacity-15 pointer-events-none text-purple-400"
      >
        <IceCream size={100} strokeWidth={1.5} />
      </motion.div>

      <div className="responsive-container relative z-10">

        {/* ─── TOP BLOCK: BRANDING & WHATSAPP ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 tv:gap-24 mb-16 sm:mb-24 tv:mb-32 items-center">

          {/* Left Side Layout */}
          <div className="space-y-6 text-left flex flex-col items-start w-full lg:col-span-6 xl:col-span-5">

            {/* Logo */}
            <Link to="/" className="block select-none group">
              <Logo className="w-[140px] sm:w-[170px] h-auto object-contain" variant="dark" />
            </Link>

            <p className="text-sm sm:text-base font-medium opacity-80 max-w-md leading-relaxed italic">
              "Handcrafting premium moments of joy. From artisanal truffles to bespoke celebration cakes, we redefine the luxury of desserts."
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-start gap-3 max-w-md text-left">
              <div className="flex items-center gap-2.5">
                <PureVegBadge size={24} hideText={true} />
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                  100% Pure Veg & Eggless
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75 block w-full mt-0.5 leading-relaxed">
                Artisanal desserts, masterfully crafted for every celebration.
              </span>
            </div>

            {/* Social Icons - Neumorphic Style */}
            <div className="flex justify-start gap-4 w-full pt-1">
              {[
                { Icon: InstagramIcon, href: 'https://www.instagram.com/thechocolatemine/' },
                { Icon: Whatsapp, href: 'https://wa.me/919150670077' }
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target={item.href !== '#' ? '_blank' : undefined}
                  rel={item.href !== '#' ? 'noopener noreferrer' : undefined}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 bg-card border border-border shadow-card hover:shadow-sm hover:scale-105"
                >
                  <item.Icon size={18} className="text-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Side - WhatsApp Join Section */}
          <div className="lg:col-span-6 xl:col-span-7 w-full flex flex-col justify-center items-start lg:items-end">
            <div className="w-full max-w-xl text-left lg:text-right mb-4">
              <h3 className="text-2xl sm:text-4xl tv:text-5xl font-black text-heading uppercase mb-2 flex flex-wrap items-center lg:justify-end gap-3">
                <Whatsapp className="text-[#25D366]" size={36} />
                Join the Club
              </h3>
              <p className="text-muted text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                Unlock secret menus, flash sales, and sweet daily drops.
              </p>
            </div>

            {/* Animated Gradient Border Form Framework */}
            <div className="w-full max-w-xl relative overflow-hidden p-[3px] rounded-[2.5rem_0.75rem_2.5rem_0.75rem] shadow-lg group">

              {/* Animated Accent Gradient Edge Line */}
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ec4899_0%,var(--accent)_33%,#25D366_66%,#ec4899_100%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Form Base — Clear Layout Free of Neumorphism */}
              <form
                className="relative flex flex-col sm:flex-row items-stretch bg-card rounded-[2.4rem_0.65rem_2.4rem_0.65rem] overflow-hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Action 1: Open WhatsApp group invite in new tab
                  window.open('https://chat.whatsapp.com/CvU1DhuAhIuJo8Xzbh9Mz4', '_blank');
                  // Action 2: Send "Hi" to admin in another new tab
                  window.open('https://wa.me/919150670077?text=Hi', '_blank');
                }}
              >
                <div className="relative flex-1 flex items-center px-6 py-2 bg-transparent">
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp Number"
                    required
                    pattern="[0-9]{10}"
                    className="w-full !bg-transparent text-foreground outline-none border-none focus:outline-none focus:ring-0 font-bold placeholder:text-muted/40 text-sm sm:text-base py-3 !shadow-none !border-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#25D366] text-white hover:bg-[#20ba56] font-black tracking-widest text-xs uppercase px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto"
                >
                  <span>JOIN NOW</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ─── MIDDLE LINKS: DESKTOP GRID ─── */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 tv:gap-x-16 gap-y-12 mb-16 sm:mb-20 tv:mb-28 text-left border-t border-border pt-12 tv:pt-16">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Navigation</h4>
            <ul className="space-y-3.5">
              {[
                { name: 'Home', path: '/' },
                { name: 'Shop All', path: '/shop' },
                { name: 'Bestsellers', path: '/shop?bestseller=true' },
                { name: 'Special Cakes', path: '/custom-cake' },
                { name: 'Offer Cakes', path: '/shop?offers=true' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-muted hover:text-primary transition-all text-xs uppercase tracking-wider block font-medium hover:translate-x-1 duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Support</h4>
            <ul className="space-y-3.5">
              {[
                { name: 'My Account', path: '/account/dashboard' },
                { name: 'My Orders', path: '/account/orders' },
                { name: 'Contact Us', path: '/contact' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms & Conditions', path: '/terms' },
                { name: 'Refund Policy', path: '/refund' },
                { name: 'Delivery Policy', path: '/delivery' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-muted hover:text-primary transition-all text-xs uppercase tracking-wider block font-medium hover:translate-x-1 duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Quick Shop</h4>
            <ul className="space-y-3.5">
              {(quickShopItems.length > 0 ? quickShopItems : [
                { name: 'Bento Cakes', path: '/shop?category=Bento%20Cakes' },
                { name: 'Birthday Cakes', path: '/shop?category=Birthday%20Cakes' },
                { name: 'Chocolates', path: '/shop?category=Chocolates' },
                { name: 'Desserts', path: '/shop?category=Desserts' }
              ]).map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-muted hover:text-primary transition-all text-xs uppercase tracking-wider block font-medium hover:translate-x-1 duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Experience Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center shrink-0 border border-border shadow-sm">
                  <MapPin size={15} className="text-primary" />
                </div>
                <a href="https://maps.app.goo.gl/1aPW7FVjAmLBnwxc7" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-muted hover:text-primary leading-normal pt-0.5 transition-colors">
                  No.7, 3, Race Course Rd, <br />
                  <span className="font-bold text-foreground">Gopalapuram, Coimbatore 641018</span>
                </a>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center shrink-0 border border-border shadow-sm">
                  <Phone size={15} className="text-primary" />
                </div>
                <div className="text-xs font-semibold text-muted leading-normal pt-0.5">
                  <a href="tel:+919150670077" className="hover:text-primary transition-colors block text-sm font-black tracking-tight text-foreground">
                    +91 91506 70077
                  </a>
                  <div className="mt-1.5 space-y-0.5 text-[10px] font-bold uppercase tracking-wide">
                    <p>Sun: 10 AM – 10 PM</p>
                    <p>Mon – Sat: 10 AM – 10:30 PM</p>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center shrink-0 border border-border shadow-sm">
                  <Mail size={15} className="text-primary" />
                </div>
                <div className="text-xs font-semibold text-muted leading-normal pt-0.5 space-y-1">
                  <a href="mailto:chocolatemine.care@gmail.com" className="hover:text-primary transition-colors block text-xs font-bold break-all">
                    chocolatemine.care@gmail.com
                  </a>
                  <a href="mailto:thechocolateminetcm@gmail.com" className="hover:text-primary transition-colors block text-xs font-bold break-all">
                    thechocolateminetcm@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── MIDDLE LINKS: MOBILE DROPDOWNS ─── */}
        <div className="sm:hidden mb-10 border-t border-border pt-4 space-y-2 text-left">
          {/* Navigation Dropdown */}
          <div className="border-b border-border/20 py-1">
            <button
              onClick={() => toggleSection('nav')}
              className="w-full flex items-center justify-between py-2.5 text-left text-xs font-black uppercase tracking-wider text-accent"
            >
              <span>Navigation</span>
              <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['nav'] ? 'rotate-180' : ''}`} />
            </button>
            {openSections['nav'] && (
              <ul className="py-2 space-y-2.5 pl-2 text-xs">
                {[
                  { name: 'Home', path: '/' },
                  { name: 'Shop All', path: '/shop' },
                  { name: 'Bestsellers', path: '/shop?bestseller=true' },
                  { name: 'Special Cakes', path: '/custom-cake' },
                  { name: 'Offer Cakes', path: '/shop?offers=true' }
                ].map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="text-muted hover:text-primary transition-all uppercase tracking-wider block font-medium">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Support Dropdown */}
          <div className="border-b border-border/20 py-1">
            <button
              onClick={() => toggleSection('support')}
              className="w-full flex items-center justify-between py-2.5 text-left text-xs font-black uppercase tracking-wider text-accent"
            >
              <span>Support</span>
              <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['support'] ? 'rotate-180' : ''}`} />
            </button>
            {openSections['support'] && (
              <ul className="py-2 space-y-2.5 pl-2 text-xs">
                {[
                  { name: 'My Account', path: '/account/dashboard' },
                  { name: 'My Orders', path: '/account/orders' },
                  { name: 'Contact Us', path: '/contact' },
                  { name: 'Privacy Policy', path: '/privacy' },
                  { name: 'Terms & Conditions', path: '/terms' },
                  { name: 'Refund Policy', path: '/refund' },
                  { name: 'Delivery Policy', path: '/delivery' }
                ].map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="text-muted hover:text-primary transition-all uppercase tracking-wider block font-medium">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Shop Dropdown */}
          <div className="border-b border-border/20 py-1">
            <button
              onClick={() => toggleSection('quickshop')}
              className="w-full flex items-center justify-between py-2.5 text-left text-xs font-black uppercase tracking-wider text-accent"
            >
              <span>Quick Shop</span>
              <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['quickshop'] ? 'rotate-180' : ''}`} />
            </button>
            {openSections['quickshop'] && (
              <ul className="py-2 space-y-2.5 pl-2 text-xs">
                {(quickShopItems.length > 0 ? quickShopItems : [
                  { name: 'Bento Cakes', path: '/shop?category=Bento%20Cakes' },
                  { name: 'Birthday Cakes', path: '/shop?category=Birthday%20Cakes' },
                  { name: 'Chocolates', path: '/shop?category=Chocolates' },
                  { name: 'Desserts', path: '/shop?category=Desserts' }
                ]).map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="text-muted hover:text-primary transition-all uppercase tracking-wider block font-medium">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Experience Us Dropdown */}
          <div className="border-b border-border/20 py-1">
            <button
              onClick={() => toggleSection('experience')}
              className="w-full flex items-center justify-between py-2.5 text-left text-xs font-black uppercase tracking-wider text-accent"
            >
              <span>Experience Us</span>
              <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['experience'] ? 'rotate-180' : ''}`} />
            </button>
            {openSections['experience'] && (
              <div className="py-3 space-y-4 pl-1 text-xs text-muted">
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                  <a href="https://maps.app.goo.gl/1aPW7FVjAmLBnwxc7" target="_blank" rel="noopener noreferrer" className="hover:text-primary leading-normal transition-colors">
                    No.7, 3, Race Course Rd, Gopalapuram, Coimbatore 641018
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <a href="tel:+919150670077" className="hover:text-primary transition-colors font-bold text-foreground block">
                      +91 91506 70077
                    </a>
                    <span className="text-[10px]">Sun: 10AM–10PM | Mon–Sat: 10AM–10:30PM</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <a href="mailto:chocolatemine.care@gmail.com" className="hover:text-primary transition-colors block break-all">
                      chocolatemine.care@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── SEO KEYWORDS & POPULAR SEARCHES DIRECTORY ─── */}
        <div className="border-t border-border pt-8 pb-6 text-left">
          <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-3 text-accent">
            Popular Cake Searches in Coimbatore | The Chocolate Mine
          </h4>
          <p className="text-[11px] text-muted leading-relaxed mb-4">
            Looking for the <strong className="text-foreground">best custom cakes in Coimbatore</strong> or <strong className="text-foreground">100% pure veg and eggless cakes in Coimbatore</strong>? The Chocolate Mine is Coimbatore’s <strong className="text-foreground">#1 trusted online ordering cake shop</strong>. Explore our top searched cake categories:
          </p>

          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-[11px] text-muted leading-relaxed">
            <div>
              <p className="font-bold text-foreground mb-2 uppercase tracking-wider text-[10px]">Custom Cakes Coimbatore</p>
              <ul className="space-y-1">
                <li><Link to="/custom-cake" className="hover:text-primary transition-colors">Best Custom Cakes in Coimbatore</Link></li>
                <li><Link to="/custom-cake" className="hover:text-primary transition-colors">Designer Birthday Cakes</Link></li>
                <li><Link to="/custom-cake" className="hover:text-primary transition-colors">2-Tier & 3-Tier Wedding Cakes</Link></li>
                <li><Link to="/custom-cake" className="hover:text-primary transition-colors">Theme & Fondant Cakes</Link></li>
                <li><Link to="/custom-cake" className="hover:text-primary transition-colors">Custom Photo Cakes Coimbatore</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-foreground mb-2 uppercase tracking-wider text-[10px]">Veg & Eggless Cakes</p>
              <ul className="space-y-1">
                <li><Link to="/shop" className="hover:text-primary transition-colors">Best Veg and Eggless Cakes in Coimbatore</Link></li>
                <li><Link to="/shop?category=Chocolates" className="hover:text-primary transition-colors">100% Pure Veg Chocolate Cakes</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Eggless Dark Chocolate Truffle</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Eggless Red Velvet & Fruit Cakes</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Eggless Gourmet Brownies</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-foreground mb-2 uppercase tracking-wider text-[10px]">Online Cake Delivery</p>
              <ul className="space-y-1">
                <li><Link to="/shop" className="hover:text-primary transition-colors">#1 Trusted Online Ordering Shop</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Same Day Cake Delivery Coimbatore</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Midnight Birthday Cake Delivery</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Express 2-3 Hour Delivery</Link></li>
                <li><Link to="/stores" className="hover:text-primary transition-colors">Bakery in Race Course Coimbatore</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-foreground mb-2 uppercase tracking-wider text-[10px]">Delivery Locations</p>
              <p className="text-[10px] leading-relaxed">
                Race Course, RS Puram, Gandhipuram, Saibaba Colony, Peelamedu, Saravanampatti, Singanallur, Ramanathapuram, Vadavalli, Kovaipudur, Hopes College, Ganapathy, Kuniyamuthur, and all areas across Coimbatore.
              </p>
            </div>
          </div>

          {/* Mobile SEO Dropdowns */}
          <div className="sm:hidden space-y-1 text-left">
            {/* Custom Cakes Dropdown */}
            <div className="border-b border-border/20 py-1.5">
              <button
                onClick={() => toggleSection('seo_custom')}
                className="w-full flex items-center justify-between py-2 text-left font-bold text-foreground text-xs uppercase tracking-wider"
              >
                <span>Custom Cakes Coimbatore</span>
                <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['seo_custom'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['seo_custom'] && (
                <ul className="py-2 pl-2 space-y-1.5 text-[11px] text-muted">
                  <li><Link to="/custom-cake" className="hover:text-primary transition-colors block py-0.5">Best Custom Cakes in Coimbatore</Link></li>
                  <li><Link to="/custom-cake" className="hover:text-primary transition-colors block py-0.5">Designer Birthday Cakes</Link></li>
                  <li><Link to="/custom-cake" className="hover:text-primary transition-colors block py-0.5">2-Tier & 3-Tier Wedding Cakes</Link></li>
                  <li><Link to="/custom-cake" className="hover:text-primary transition-colors block py-0.5">Theme & Fondant Cakes</Link></li>
                  <li><Link to="/custom-cake" className="hover:text-primary transition-colors block py-0.5">Custom Photo Cakes Coimbatore</Link></li>
                </ul>
              )}
            </div>

            {/* Veg & Eggless Dropdown */}
            <div className="border-b border-border/20 py-1.5">
              <button
                onClick={() => toggleSection('seo_veg')}
                className="w-full flex items-center justify-between py-2 text-left font-bold text-foreground text-xs uppercase tracking-wider"
              >
                <span>Veg & Eggless Cakes</span>
                <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['seo_veg'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['seo_veg'] && (
                <ul className="py-2 pl-2 space-y-1.5 text-[11px] text-muted">
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Best Veg and Eggless Cakes in Coimbatore</Link></li>
                  <li><Link to="/shop?category=Chocolates" className="hover:text-primary transition-colors block py-0.5">100% Pure Veg Chocolate Cakes</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Eggless Dark Chocolate Truffle</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Eggless Red Velvet & Fruit Cakes</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Eggless Gourmet Brownies</Link></li>
                </ul>
              )}
            </div>

            {/* Online Cake Delivery Dropdown */}
            <div className="border-b border-border/20 py-1.5">
              <button
                onClick={() => toggleSection('seo_delivery')}
                className="w-full flex items-center justify-between py-2 text-left font-bold text-foreground text-xs uppercase tracking-wider"
              >
                <span>Online Cake Delivery</span>
                <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['seo_delivery'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['seo_delivery'] && (
                <ul className="py-2 pl-2 space-y-1.5 text-[11px] text-muted">
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">#1 Trusted Online Ordering Shop</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Same Day Cake Delivery Coimbatore</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Midnight Birthday Cake Delivery</Link></li>
                  <li><Link to="/shop" className="hover:text-primary transition-colors block py-0.5">Express 2-3 Hour Delivery</Link></li>
                  <li><Link to="/stores" className="hover:text-primary transition-colors block py-0.5">Bakery in Race Course Coimbatore</Link></li>
                </ul>
              )}
            </div>

            {/* Delivery Locations Dropdown */}
            <div className="border-b border-border/20 py-1.5">
              <button
                onClick={() => toggleSection('seo_locations')}
                className="w-full flex items-center justify-between py-2 text-left font-bold text-foreground text-xs uppercase tracking-wider"
              >
                <span>Delivery Locations</span>
                <ChevronDown size={15} className={`text-primary transition-transform duration-300 ${openSections['seo_locations'] ? 'rotate-180' : ''}`} />
              </button>
              {openSections['seo_locations'] && (
                <p className="py-2 pl-2 text-[10px] text-muted leading-relaxed">
                  Race Course, RS Puram, Gandhipuram, Saibaba Colony, Peelamedu, Saravanampatti, Singanallur, Ramanathapuram, Vadavalli, Kovaipudur, Hopes College, Ganapathy, Kuniyamuthur, and all areas across Coimbatore.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM UTILITY AREA ─── */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">100% Secure</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <CreditCard size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">Razorpay</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Truck size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">Fast Delivery</span>
            </div>
          </div>
          <p className="text-muted text-[9px] font-black uppercase tracking-[0.25em] text-center">
            © 2026 THE CHOCOLATE MINE. CRAFTED BY{' '}
            <a
              href="https://akwebflairtechnologies.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition"
            >
              AKWEBFLAIR TECHNOLOGIES
            </a>
          </p>
        </div>

      </div>

      {/* Animation Keyframes for spinning border */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
