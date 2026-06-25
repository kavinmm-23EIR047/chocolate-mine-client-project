import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, ShieldCheck, CreditCard, Truck,
  Cake, Cookie, Candy, Flower2, Flame, IceCream
} from 'lucide-react';
import {
  FaFacebookF as Facebook,
  FaTwitter as Twitter,
  FaYoutube as Youtube,
  FaInstagram as InstagramIcon,
  FaWhatsapp as Whatsapp
} from 'react-icons/fa';
import Button from './ui/Button';
import EgglessBadge from './ui/EgglessBadge';
import PureVegBadge from './ui/PureVegBadge';

const Footer = () => {
  return (
    <footer className="dark bg-footer text-footer-text pt-16 sm:pt-24 pb-8 sm:pb-12 overflow-hidden relative transition-colors duration-300">

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
              <div className="flex flex-col items-center font-sans w-[130px] sm:w-[150px]">
                <div className="w-full flex justify-between text-[9px] sm:text-[10px] font-black uppercase leading-none tracking-normal mb-1.5 px-[0.5px] text-current">
                  <span>T</span><span>H</span><span>E</span>
                  <span className="w-[8%]"></span>
                  <span>C</span><span>H</span><span>O</span><span>C</span><span>O</span><span>L</span><span>A</span><span>T</span><span>E</span>
                </div>
                <svg
                  viewBox="0 0 325 90"
                  className="w-full h-auto fill-current transition-colors duration-300"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 86V0h25.5l29.5 45L84.5 0H110v86H87V32L61.5 71h-13L23 32v54H0z" />
                  <path d="M131 0h24v86h-24V0z" />
                  <path d="M176 86V0h24.5l37.5 56V0h24v86h-23.5L200 29v57h-24z" />
                  <path d="M283 0h42v21h-18v12h14v20h-14v12h18v21h-42V0z" />
                </svg>
              </div>
            </Link>

            <p className="text-sm sm:text-base font-medium opacity-80 max-w-md leading-relaxed italic">
              "Handcrafting premium moments of joy. From artisanal truffles to bespoke celebration cakes, we redefine the luxury of desserts."
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-start gap-3 max-w-md text-left">
              <div className="flex gap-3">
                <PureVegBadge size={28} className="bg-transparent shadow-none p-0" hideText={true} />
                <EgglessBadge size={28} className="bg-transparent shadow-none p-0" hideText={true} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block w-full mt-1.5 leading-relaxed">
                100% Pure Veg & Eggless artisanal desserts, masterfully crafted for every celebration.
              </span>
            </div>

            {/* Social Icons - Neumorphic Style */}
            <div className="flex justify-start gap-4 w-full pt-1">
              {[InstagramIcon, Whatsapp, Youtube, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 bg-card border border-border shadow-card hover:shadow-sm hover:scale-105"
                >
                  <Icon size={18} className="text-foreground" />
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
                  window.open('https://chat.whatsapp.com/', '_blank');
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

        {/* ─── MIDDLE LINKS GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 tv:gap-x-16 gap-y-12 mb-16 sm:mb-20 tv:mb-28 text-left border-t border-border pt-12 tv:pt-16">

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Navigation</h4>
            <ul className="space-y-3.5">
              {[
                { name: 'Home', path: '/' },
                { name: 'Shop All', path: '/shop' },
                { name: 'Bestsellers', path: '/shop?search=bestseller' },
                { name: 'Gifting', path: '/shop?search=gift' }
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
                { name: 'Refund Policy', path: '/refund' }
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
              {[
                { name: 'Birthday', path: '/occasion/birthday' },
                { name: 'Anniversary', path: '/occasion/anniversary' },
                { name: 'Wedding', path: '/occasion/wedding' },
                { name: 'Congratulations', path: '/occasion/congratulations' }
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
            <h4 className="text-[11px] font-black uppercase tracking-[0.35em] mb-6 text-accent">Experience Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center shrink-0 border border-border shadow-sm">
                  <MapPin size={15} className="text-primary" />
                </div>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-muted hover:text-primary leading-normal pt-0.5 transition-colors">
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
            </ul>
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
              href="https://akwebflairtechnologies.vercel.app"
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