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
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-text pt-16 sm:pt-24 pb-8 sm:pb-12 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -ml-64 -mb-64" />

      <div className="w-full mx-auto px-4 sm:px-12 lg:px-20 relative z-10">
        
        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 mb-12 sm:mb-20 items-center">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <Logo className="w-20 h-20 bg-surface rounded-2xl p-1 shadow-premium border border-border/10 backdrop-blur-md" />
              <div className="flex flex-col">
                <span className="text-lg xs:text-xl sm:text-3xl font-black text-footer-text tracking-tighter leading-none uppercase transition-colors">THE CHOCOLATE</span>
                <span className="text-[10px] sm:text-sm font-black text-secondary tracking-[0.4em] uppercase mt-1 transition-colors">Mine</span>
              </div>
            </Link>
            <p className="text-xl font-bold text-footer-text/60 max-w-md leading-relaxed italic">
              "Handcrafting premium moments of joy. From artisanal truffles to bespoke celebration cakes, we redefine the luxury of desserts."
            </p>
            <div className="flex gap-6">
               {[InstagramIcon, Facebook, Twitter, Youtube].map((Icon, i) => (
                 <a key={i} href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-secondary hover:text-button-text transition-all hover:-translate-y-1 shadow-lg border border-white/5">
                   <Icon size={20} />
                 </a>
               ))}
            </div>
          </div>

          <div className="bg-white/5 border border-footer-text/10 p-6 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Whatsapp size={80} className="-rotate-12" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-2 text-footer-text uppercase tracking-tighter">Join our WhatsApp Group</h3>
            <p className="text-footer-text/50 font-bold text-[9px] sm:text-[10px] mb-6 sm:mb-8 uppercase tracking-widest">Join our WhatsApp group and get exciting offers</p>
            <form 
              className="flex flex-col sm:flex-row gap-4"
              onSubmit={(e) => { 
                e.preventDefault(); 
                // Redirect to WhatsApp group invite link
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

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-20">
          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-8">Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: 'Home', path: '/' },
                { name: 'Shop All', path: '/shop' },
                { name: 'Bestsellers', path: '/shop?search=bestseller' },
                { name: 'Gifting', path: '/shop?search=gift' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-8">Support</h4>
            <ul className="space-y-4">
              {[
                { name: 'My Account', path: '/account/dashboard' },
                { name: 'My Orders', path: '/account/orders' },
                { name: 'Wishlist', path: '/account/wishlist' },
                { name: 'Contact Us', path: '/' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-8">Quick Shop</h4>
            <ul className="space-y-4">
              {[
                { name: 'Birthday', path: '/occasion/birthday' },
                { name: 'Anniversary', path: '/occasion/anniversary' },
                { name: 'Wedding', path: '/occasion/wedding' },
                { name: 'Congratulations', path: '/occasion/congratulations' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-footer-text/50 hover:text-secondary font-bold transition-colors flex items-center gap-2 group text-sm uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-8">Experience Us</h4>
            <ul className="space-y-6">
              <li className="flex gap-4 group">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-secondary/10 transition-colors">
                  <MapPin size={20} className="text-secondary" />
                </div>
                <a 
                  href="https://www.google.com/maps?gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIHCAEQABiABDIHCAIQABiABDIHCAMQABiABDIHCAQQABiABDIHCAUQABiABDIHCAYQABiABDIHCAcQABiABDIHCAgQABiABDIHCAkQABiABNIBCDUxMDZqMGo3qAIAsAIA&um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KQM_M1MdWag7MfxgOlN9Q_nQ&daddr=No.7,+3,+Race+Course+Rd,+near+Codissia+Office+Building,+Anna+Silai,+Gopalapuram,+Coimbatore,+Tamil+Nadu+641018" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-footer-text/60 leading-relaxed hover:text-secondary transition-colors"
                >
                  No.7, 3, Race Course Rd, <br />
                  <span className="text-footer-text">Gopalapuram, Coimbatore 641018</span>
                </a>
              </li>
              <li className="flex gap-4 group">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-secondary/10 transition-colors">
                  <Phone size={20} className="text-secondary" />
                </div>
                <div className="text-xs font-bold text-footer-text/60 leading-relaxed">
                  <a href="tel:+919150670077" className="hover:text-secondary transition-colors">+91 91506 70077</a>
                  <div className="mt-2 space-y-0.5 text-[10px] text-footer-text/40 uppercase tracking-wider">
                    <p><span className="text-footer-text/70">Sun:</span> 10 AM – 10 PM</p>
                    <p><span className="text-footer-text/70">Mon – Sat:</span> 10 AM – 10:30 PM</p>
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
            &copy; 2026 THE CHOCOLATE MINE. CRAFTED BY <a href="https://akwebflairtechnologies.vercel.app" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline transition-all">AKWEBFLAIR TECHNOLOGIES</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
