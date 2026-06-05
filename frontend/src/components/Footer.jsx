import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, ShieldCheck, CreditCard, Truck,
  Cake, Cookie, Candy
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
    /* EXACT THEME CONFIGURATION MAPPING:
      - Default Light Mode: Background Dark Chocolate (#120806) | Text Cream (#DED0CC)
      - Dark Mode active: Background Cream (#DED0CC) | Text Deep Chocolate (#381A14)
    */
    <footer className="bg-[#120806] text-[#DED0CC] dark:bg-[#DED0CC] dark:text-[#381A14] pt-16 sm:pt-24 pb-8 sm:pb-12 overflow-hidden relative transition-colors duration-300 font-['Outfit',sans-serif] border-t border-white/5 dark:border-[#381A14]/10">

      {/* ─── AMBIENT BACKGROUND WATERMARKS & BLURS ─── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

      {/* Safe Floating Watermarks */}
      <div className="absolute top-6 left-[5%] opacity-[0.03] dark:opacity-[0.06] pointer-events-none text-current transform -rotate-12 hidden xl:block">
        <Cake size={110} />
      </div>
      <div className="absolute bottom-24 right-[5%] opacity-[0.03] dark:opacity-[0.06] pointer-events-none text-current transform rotate-45 hidden xl:block">
        <Cookie size={90} />
      </div>

      <div className="w-full mx-auto px-6 sm:px-12 lg:px-20 relative z-10">

        {/* ─── TOP BLOCK: BRANDING & WHATSAPP ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 sm:mb-20 items-center">

          {/* Left Side Layout (5 Columns) */}
          <div className="space-y-6 text-left flex flex-col items-start w-full lg:col-span-5">

            {/* Logo Wrapper */}
            <Link to="/" className="block select-none group w-[150px] sm:w-[170px]">
              <div className="flex flex-col items-center font-sans w-full text-current">
                <div className="w-full flex justify-between text-[7px] sm:text-[8px] font-black uppercase leading-none select-none tracking-normal mb-1.5 px-[0.5px]">
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

            <p className="text-sm sm:text-base font-medium opacity-80 max-w-md leading-relaxed italic text-left font-['Inter',sans-serif]">
              "Handcrafting premium moments of joy. From artisanal truffles to bespoke celebration cakes, we redefine the luxury of desserts."
            </p>

            {/* Badges Layout */}
            <div className="flex flex-wrap items-center justify-start gap-3 max-w-md text-left">
              <div className="flex gap-2">
                <PureVegBadge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-700 font-extrabold shrink-0" />
                <EgglessBadge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-700 font-extrabold shrink-0" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block w-full mt-1 font-['Inter',sans-serif]">
                Delicious Pure Veg & Eggless cakes made for every celebration.
              </span>
            </div>

            {/* Social Icons Container (As shown in image_7e3cdd.png, configured to swap colors cleanly in dark mode) */}
            <div className="flex justify-start gap-4 w-full pt-1">
              {[InstagramIcon, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 border shadow-sm
                    bg-[#120806] border-[#DED0CC]/20 text-[#DED0CC] 
                    dark:bg-[#DED0CC] dark:border-[#381A14]/20 dark:text-[#381A14]
                    hover:scale-105"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Right Side Layout - WhatsApp Card Container */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-current/[0.03] dark:bg-[#381A14]/5 border border-current/15 p-6 sm:p-8 rounded-2xl relative overflow-hidden text-left w-full transition-all duration-300">

              <div className="absolute -top-4 -right-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none text-current">
                <Whatsapp size={140} className="-rotate-12" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-current uppercase tracking-tight mb-1">
                Join our WhatsApp Group
              </h3>
              <p className="opacity-80 text-[#DED0CC] dark:text-[#381A14] font-bold text-[10px] uppercase tracking-widest font-['Inter',sans-serif] mb-6">
                Join our WhatsApp group and get exciting offers
              </p>

              <form
                className="flex flex-col sm:flex-row gap-3 relative z-10 w-full items-stretch"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.open('https://chat.whatsapp.com/', '_blank');
                }}
              >
                <div className="relative flex-1">
                  <input
                    type="tel"
                    placeholder="Enter number"
                    required
                    pattern="[0-9]{10}"
                    className="w-full bg-black/40 dark:bg-white text-white dark:text-[#381A14] border border-current/20 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#25D366] transition-all font-bold placeholder:text-current/40 text-sm font-['Inter',sans-serif]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#25D366] text-white hover:bg-[#20ba56] font-black tracking-widest text-xs uppercase px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Whatsapp size={16} />
                  <span>JOIN NOW</span>
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ─── MIDDLE LINKS GRID ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-16 sm:mb-20 text-left border-t border-current/10 pt-12">

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.35em] mb-6 text-[#E6C34A] dark:text-[#381A14]">Navigation</h4>
            <ul className="space-y-3.5 font-['Inter',sans-serif]">
              {[{ name: 'Home', path: '/' }, { name: 'Shop All', path: '/shop' }, { name: 'Bestsellers', path: '/shop?search=bestseller' }, { name: 'Gifting', path: '/shop?search=gift' }].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="opacity-70 hover:opacity-100 transition-all text-xs uppercase tracking-wider block">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.35em] mb-6 text-[#E6C34A] dark:text-[#381A14]">Support</h4>
            <ul className="space-y-3.5 font-['Inter',sans-serif]">
              {[{ name: 'My Account', path: '/account/dashboard' }, { name: 'My Orders', path: '/account/orders' }, { name: 'Wishlist', path: '/account/wishlist' }, { name: 'Contact Us', path: '/' }].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="opacity-70 hover:opacity-100 transition-all text-xs uppercase tracking-wider block">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.35em] mb-6 text-[#E6C34A] dark:text-[#381A14]">Quick Shop</h4>
            <ul className="space-y-3.5 font-['Inter',sans-serif]">
              {[{ name: 'Birthday', path: '/occasion/birthday' }, { name: 'Anniversary', path: '/occasion/anniversary' }, { name: 'Wedding', path: '/occasion/wedding' }, { name: 'Congratulations', path: '/occasion/congratulations' }].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="opacity-70 hover:opacity-100 transition-all text-xs uppercase tracking-wider block">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.35em] mb-6 text-[#E6C34A] dark:text-[#381A14]">Experience Us</h4>
            <ul className="space-y-5 font-['Inter',sans-serif]">
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-current/5 rounded-lg flex items-center justify-center shrink-0 border border-current/10">
                  <MapPin size={15} className="text-current" />
                </div>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold opacity-80 leading-normal hover:underline pt-0.5">
                  No.7, 3, Race Course Rd, <br />
                  <span className="font-extrabold text-current">Gopalapuram, Coimbatore 641018</span>
                </a>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-current/5 rounded-lg flex items-center justify-center shrink-0 border border-current/10">
                  <Phone size={15} className="text-current" />
                </div>
                <div className="text-xs font-bold opacity-80 leading-normal pt-0.5">
                  <a href="tel:+919150670077" className="hover:underline block text-sm font-black tracking-tight">+91 91506 70077</a>
                  <div className="mt-1.5 space-y-0.5 text-[10px] opacity-70 uppercase tracking-wide font-bold">
                    <p>Sun: 10 AM – 10 PM</p>
                    <p>Mon – Sat: 10 AM – 10:30 PM</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM UTILITY AREA ─── */}
        <div className="pt-8 border-t border-current/10 flex flex-col md:flex-row items-center justify-between gap-6 font-['Inter',sans-serif]">
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-70">
            <div className="flex items-center gap-2"><ShieldCheck size={14} /><span className="text-[10px] font-black uppercase tracking-wider">100% Secure</span></div>
            <div className="flex items-center gap-2"><CreditCard size={14} /><span className="text-[10px] font-black uppercase tracking-wider">Razorpay</span></div>
            <div className="flex items-center gap-2"><Truck size={14} /><span className="text-[10px] font-black uppercase tracking-wider">Fast Delivery</span></div>
          </div>
          <p className="opacity-50 text-[9px] font-black uppercase tracking-[0.25em] text-center">
            © 2026 THE CHOCOLATE MINE. CRAFTED BY <a href="https://akwebflairtechnologies.vercel.app" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100">AKWEBFLAIR TECHNOLOGIES</a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;