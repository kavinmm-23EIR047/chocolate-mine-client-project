import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Send,
  ArrowRight, ShieldCheck, CreditCard, Truck
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
    <footer className="bg-footer text-footer-text pt-16 sm:pt-24 pb-8 sm:pb-12 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -ml-64 -mb-64" />

      <div className="w-full mx-auto px-4 sm:px-12 lg:px-20 relative z-10">

        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 mb-12 sm:mb-20 items-center">

          {/* Brand Left Column - Left-aligned cleanly across all screens */}
          <div className="space-y-8 text-left flex flex-col items-start">

            {/* Brand Link containing the unified vector design */}
            <Link to="/" className="block select-none group w-[140px] sm:w-[170px]">
              <div className="flex flex-col items-center text-footer-text font-sans w-full">

                {/* "THE CHOCOLATE" - Perfectly flush flex row layout */}
                <div className="w-full flex justify-between text-[6.5px] sm:text-[8px] font-bold uppercase leading-none select-none text-footer-text tracking-normal mb-1.5 px-[0.5px]">
                  <span>T</span><span>H</span><span>E</span>
                  <span className="w-[8%]"></span>
                  <span>C</span><span>H</span><span>O</span><span>C</span><span>O</span><span>L</span><span>A</span><span>T</span><span>E</span>
                </div>

                {/* "MINE" - Geometric Vector Blueprint */}
                <svg
                  viewBox="0 0 325 90"
                  className="w-full h-auto fill-current text-footer-text transition-colors"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 86V0h25.5l29.5 45L84.5 0H110v86H87V32L61.5 71h-13L23 32v54H0z" />
                  <path d="M131 0h24v86h-24V0z" />
                  <path d="M176 86V0h24.5l37.5 56V0h24v86h-23.5L200 29v57h-24z" />
                  <path d="M283 0h42v21h-18v12h14v20h-14v12h18v21h-42V0z" />
                </svg>
              </div>
            </Link>

            <p className="text-base sm:text-xl font-bold text-footer-text/60 max-w-md leading-relaxed italic text-left">
              "Handcrafting premium moments of joy. From artisanal truffles to bespoke celebration cakes, we redefine the luxury of desserts."
            </p>

            <div className="flex flex-wrap items-center justify-start gap-3 max-w-md text-left">
              <PureVegBadge className="bg-success/5 border-success/20 text-success shrink-0" />
              <EgglessBadge className="bg-success/5 border-success/20 text-success shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-footer-text/50 block w-full mt-1">Delicious Pure Veg & Eggless cakes made for every celebration.</span>
            </div>

            <div className="flex justify-start gap-6 w-full">
              {[InstagramIcon, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-secondary hover:text-button-text transition-all hover:-translate-y-1 shadow-lg border border-white/5">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: WhatsApp Card */}
          <div className="bg-white/5 border border-footer-text/10 p-6 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden group text-left w-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Whatsapp size={80} className="-rotate-12" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-2 text-footer-text uppercase tracking-tighter">Join our WhatsApp Group</h3>
            <p className="text-footer-text/50 font-bold text-[9px] sm:text-[10px] mb-6 sm:mb-8 uppercase tracking-widest">Join our WhatsApp group and get exciting offers</p>
            <form
              className="flex flex-col sm:flex-row gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                window.open('https://chat.whatsapp.com/', '_blank');
              }}
            >
              <input
                type="tel"
                placeholder="Enter number"
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                className="flex-1 bg-white/5 border border-footer-text/10 rounded-xl px-4 py-3 outline-none focus:border-[#25D366] transition-all font-bold placeholder:text-footer-text/30 text-sm"
              />
              <Button type="submit" className="py-3 px-6 rounded-xl shadow-xl font-black tracking-widest text-xs" style={{ background: '#25D366', color: '#ffffff' }} icon={Whatsapp}>JOIN NOW</Button>
            </form>
          </div>
        </div>

        {/* Middle Section: Links Grid - Strictly Left Aligned on Mobile and Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 sm:gap-12 mb-12 sm:mb-20 text-left">

          {/* Navigation Column */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-5 sm:mb-8">Navigation</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: 'Home', path: '/' },
                { name: 'Shop All', path: '/shop' },
                { name: 'Bestsellers', path: '/shop?search=bestseller' },
                { name: 'Gifting', path: '/shop?search=gift' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-0 md:gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all hidden md:block shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-5 sm:mb-8">Support</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: 'My Account', path: '/account/dashboard' },
                { name: 'My Orders', path: '/account/orders' },
                { name: 'Wishlist', path: '/account/wishlist' },
                { name: 'Contact Us', path: '/' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-0 md:gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all hidden md:block shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Shop Column */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-5 sm:mb-8">Quick Shop</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: 'Birthday', path: '/occasion/birthday' },
                { name: 'Anniversary', path: '/occasion/anniversary' },
                { name: 'Wedding', path: '/occasion/wedding' },
                { name: 'Congratulations', path: '/occasion/congratulations' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-0 md:gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all hidden md:block shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Experience Us Column - Fixed alignments for address block */}
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-5 sm:mb-8">Experience Us</h4>
            <ul className="space-y-5 sm:space-y-6">

              {/* Address Row */}
              <li className="flex items-start gap-3 sm:gap-4 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-secondary/10 transition-colors">
                  <MapPin size={18} className="text-secondary" />
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-footer-text/60 leading-normal hover:text-secondary transition-colors pt-1"
                >
                  No.7, 3, Race Course Rd, <br />
                  <span className="text-footer-text">Gopalapuram, Coimbatore 641018</span>
                </a>
              </li>

              {/* Phone Row */}
              <li className="flex items-start gap-3 sm:gap-4 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-secondary/10 transition-colors">
                  <Phone size={18} className="text-secondary" />
                </div>
                <div className="text-xs font-bold text-footer-text/60 leading-normal pt-1">
                  <a href="tel:+919150670077" className="hover:text-secondary transition-colors block text-sm sm:text-xs">+91 91506 70077</a>
                  <div className="mt-2 space-y-1 text-[9px] sm:text-[10px] text-footer-text/40 uppercase tracking-wider font-medium">
                    <p><span className="text-footer-text/60 font-bold">Sun:</span> 10 AM – 10 PM</p>
                    <p><span className="text-footer-text/60 font-bold">Mon – Sat:</span> 10 AM – 10:30 PM</p>
                  </div>
                </div>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom Section: Payment & Copyright */}
        <div className="pt-8 sm:pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Fast Delivery</span>
            </div>
          </div>

          <p className="text-footer-text/30 text-[9px] font-black uppercase tracking-[0.3em] text-center">
            © 2026 THE CHOCOLATE MINE. CRAFTED BY <a href="https://akwebflairtechnologies.vercel.app" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline transition-all">AKWEBFLAIR TECHNOLOGIES</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;