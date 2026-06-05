import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Star,
  ShieldCheck,
  Phone,
  PackageCheck,
  Truck,
  ChevronRight,
  Zap,
  Tag,
  BadgeCheck,
  Leaf,
  Sparkles
} from 'lucide-react';

import ScooterLightImg from '../../assets/scooter-light.png';
import ScooterDarkImg from '../../assets/scooter-dark.png';
import CakeImg from '../../assets/cake.png';

const DELIVERY_FEATURES = [
  { icon: <Clock size={20} />, label: 'Same-Day', sub: 'Delivery' },
  { icon: <Star size={20} />, label: 'Fresh Baked', sub: 'Everyday' },
  { icon: <ShieldCheck size={20} />, label: 'Secure', sub: 'Packaging' },
  { icon: <Phone size={20} />, label: '24/7 Support', sub: "We're here" },
];

const STATS = [
  { icon: <PackageCheck size={20} />, stat: '12K+', label: 'Orders Delivered' },
  { icon: <Star size={20} />, stat: '4.9★', label: 'Customer Rating' },
  { icon: <Clock size={20} />, stat: '30 mins', label: 'Avg. Delivery Time' },
  { icon: <ShieldCheck size={20} />, stat: '100%', label: 'Fresh & Safe' },
  { icon: <Phone size={20} />, stat: '24/7', label: 'Customer Support' },
];

const DeliveryHero = () => {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-5">
      {/* MAIN CARD */}
      <section
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/20 flex-1 min-w-0"
        style={{
          background: 'var(--card)',
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] opacity-[0.04]" style={{ background: 'var(--primary)' }} />
          <div className="absolute right-1/4 bottom-0 w-64 h-64 rounded-full blur-[80px] opacity-[0.03]" style={{ background: 'var(--accent)' }} />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center">
          {/* LEFT TEXT CONTENT */}
          <div className="flex flex-col justify-center px-6 sm:px-8 lg:pl-10 lg:pr-4 xl:pl-12 xl:pr-6 
                        py-8 sm:py-10 lg:py-8 order-2 lg:order-1 z-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center lg:justify-start gap-2 mb-4"
            >
              <Truck size={14} style={{ color: 'var(--primary)' }} />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>
                Priority Service
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-black leading-[1.2] tracking-[-0.02em] mb-4"
              style={{ color: 'var(--heading)' }}
            >
              Exclusive<br />
              <span style={{ color: 'var(--accent)' }}>Local</span> Delivery<br />
              Made for You
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.13 }}
              className="text-sm sm:text-base font-medium leading-relaxed mb-5 max-w-md mx-auto lg:mx-0"
              style={{ color: 'var(--muted)' }}
            >
              From our kitchen to your doorstep — fast, fresh and handled with care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 mb-6"
            >
              {DELIVERY_FEATURES.map(({ icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl min-w-[70px] sm:min-w-[80px] transition-all duration-300 hover:scale-105 cursor-default group"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="group-hover:scale-110 transition-transform duration-300" style={{ color: 'var(--primary)' }}>{icon}</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-tight" style={{ color: 'var(--heading)' }}>{label}</span>
                  <span className="text-[8px] sm:text-[9px] font-medium text-center leading-none" style={{ color: 'var(--muted)' }}>{sub}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center lg:justify-start items-center gap-4"
            >
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--button-text)',
                  boxShadow: '0 8px 20px rgba(var(--primary-rgb),0.25)',
                }}
              >
                Order Now <ChevronRight size={14} />
              </Link>
              <Link
                to="/track"
                className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] underline-offset-4 hover:underline transition-all"
                style={{ color: 'var(--muted)' }}
              >
                Track your order →
              </Link>
            </motion.div>
          </div>

          {/* Scooter image */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center 
                        min-h-[320px] sm:min-h-[420px] lg:min-h-0 lg:h-full
                        py-4 lg:py-0 px-4 lg:-ml-12 xl:-ml-20 z-20">
            <motion.img
              src={ScooterLightImg}
              alt="Chocolate Mine Delivery"
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[130%] xl:max-w-[140%] h-auto object-contain dark:hidden scale-110 lg:scale-125 xl:scale-135"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(61,31,26,0.15))',
                marginRight: '-30px'
              }}
              draggable={false}
            />
            <motion.img
              src={ScooterDarkImg}
              alt="Chocolate Mine Delivery"
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[130%] xl:max-w-[140%] h-auto object-contain hidden dark:block scale-110 lg:scale-125 xl:scale-135"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                marginRight: '-30px'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="relative border-t border-border/20"
          style={{ background: 'rgba(var(--primary-rgb), 0.02)' }}
        >
          <div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 px-5 sm:px-6 py-3"
            style={{ background: 'var(--background)' }}
          >
            <div className="flex flex-col gap-0.5 shrink-0 text-center lg:text-left">
              <span className="text-[8px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                Pay securely with
              </span>
              <div className="flex items-center gap-1.5">
                <Zap size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-black tracking-tight" style={{ color: 'var(--heading)' }}>Razorpay</span>
              </div>
            </div>
            <div className="hidden lg:block w-px h-6 shrink-0" style={{ background: 'var(--border)' }} />
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: <ShieldCheck size={12} />, label: '100% Secure', sub: 'Payments' },
                { icon: <Tag size={12} />, label: 'Multiple', sub: 'Options' },
                { icon: <Zap size={12} />, label: 'Instant', sub: 'Confirm' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--accent)' }}>{icon}</span>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight leading-none mb-0.5" style={{ color: 'var(--heading)' }}>{label}</p>
                    <p className="text-[8px] sm:text-[9px] leading-tight" style={{ color: 'var(--muted)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/20" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border/20 bg-primary/5">
            {STATS.map(({ icon, stat, label }) => (
              <div
                key={label}
                className="flex items-center justify-center lg:justify-start gap-2 px-3 sm:px-4 py-3 group hover:bg-primary/10 transition-colors duration-300 cursor-default text-center lg:text-left"
              >
                <span className="shrink-0 opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110" style={{ color: 'var(--primary)' }}>
                  {icon}
                </span>
                <div>
                  <p className="text-sm sm:text-base font-black leading-none" style={{ color: 'var(--heading)' }}>{stat}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Custom Cakes Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/20 flex flex-col lg:w-[320px] xl:w-[360px] shrink-0"
        style={{
          background: 'var(--card)',
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
        }}
      >
        <div className="px-6 pt-6 pb-2 text-center lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1.5" style={{ color: 'var(--accent)' }}>
            Custom Cakes
          </p>
          <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight mb-2" style={{ color: 'var(--heading)' }}>
            Made Just for You
          </h3>
          <p className="text-[11px] sm:text-xs font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>
            Celebrate every moment with a cake as unique as your story.
          </p>
        </div>

        <div className="flex justify-center px-5 py-2">
          <div className="shrink-0 w-[150px] sm:w-[170px] lg:w-[190px]">
            <img
              src={CakeImg}
              alt="Custom Cake"
              className="w-full h-auto object-contain transition-transform duration-700 hover:scale-105"
              style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.3))' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-3 flex-1">
          {[
            { icon: <Sparkles size={14} />, label: 'Custom Flavors', sub: 'Choose your favorite flavors' },
            { icon: <BadgeCheck size={14} />, label: 'Personalized Design', sub: 'Tailored to your special moments' },
            { icon: <PackageCheck size={14} />, label: 'Premium Ingredients', sub: 'Made with the finest ingredients' },
            { icon: <Leaf size={14} />, label: 'Pure Veg & Eggless', sub: '100% vegetarian, eggless options', highlight: true },
          ].map(({ icon, label, sub, highlight }) => (
            <div key={label} className="flex items-start gap-3 group cursor-default">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${
                  highlight
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-background text-accent border-border'
                }`}
              >
                {icon}
              </div>
              <div className="flex-1">
                <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight leading-tight ${highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-heading'}`}>
                  {label}
                </p>
                <p className="text-[9px] sm:text-[10px] font-medium leading-snug mt-0.5 text-muted">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2 mt-auto">
          <Link
            to="/custom-cake"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'var(--primary)',
              color: 'var(--button-text)',
              boxShadow: '0 8px 20px rgba(var(--primary-rgb),0.25)',
            }}
          >
            Order Custom Cake <ChevronRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryHero;
