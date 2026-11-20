import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Leaf, ShieldCheck, Phone } from 'lucide-react';

const TRUST = [
  { icon: <Sparkles size={16} />, label: 'Best Custom Cakes in Coimbatore' },
  { icon: <Leaf size={16} />, label: '100% Pure Veg & Eggless Cakes' },
  { icon: <ShieldCheck size={16} />, label: '#1 Trusted Online Cake Shop' },
  { icon: <MapPin size={16} />, label: 'Express 2-3 Hr Delivery Across Coimbatore' },
  { icon: <Phone size={16} />, label: '4.9★ Rated · 12K+ Happy Customers' },
];

const TrustBar = () => {
  const [activeTrustIndex, setActiveTrustIndex] = useState(0);

  useEffect(() => {
    const trustTimer = setInterval(() => setActiveTrustIndex(s => (s + 1) % TRUST.length), 4000);
    return () => clearInterval(trustTimer);
  }, []);

  return (
    <>
      {/* Mobile Trust Ticker */}
      <div className="lg:hidden relative px-4 mb-6 rounded-none">
        <div className="relative overflow-hidden">
          <div className="py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrustIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[#27190e] dark:text-[#F5E6D3] shrink-0">
                  {TRUST[activeTrustIndex].icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#27190e] dark:text-[#F5E6D3] whitespace-nowrap">
                  {TRUST[activeTrustIndex].label}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {TRUST.map((_, i) => (
              <button
                key={i}
                aria-label={`View slide ${i + 1}`}
                onClick={() => setActiveTrustIndex(i)}
                className={`!p-0 !m-0 !border-none !outline-none !min-w-0 !min-h-0 h-1.5 rounded-full transition-all duration-300 ${activeTrustIndex === i
                  ? 'w-6 bg-[#27190e] dark:bg-[#F5E6D3]'
                  : 'w-1.5 bg-[#27190e]/20 dark:bg-[#F5E6D3]/20'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Trust Marquee */}
      <div className="hidden lg:block bg-[var(--card)] border-y border-[var(--border)] overflow-hidden relative w-full rounded-none">
        <style>{`
          @keyframes scroll-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll-marquee {
            display: flex;
            width: max-content;
            animation: scroll-marquee 40s linear infinite;
          }
          .animate-scroll-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="py-2.5">
          <div className="animate-scroll-marquee">
            {[...TRUST, ...TRUST, ...TRUST, ...TRUST].map((t, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap shrink-0 group px-8">
                <div className="text-[#27190e] dark:text-[#F5E6D3] transition-transform duration-300 group-hover:scale-110">
                  {t.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#27190e] dark:text-[#F5E6D3]">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TrustBar;
