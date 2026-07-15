import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeliveryLocation } from '../../context/LocationContext';
import api from '../../utils/api';
import { Gift, Heart, Sparkles, Star, ArrowRight, PartyPopper } from 'lucide-react';

// Array of dynamic icons to give each card a unique feel
const CARD_ICONS = [Gift, Heart, PartyPopper, Star, Sparkles];

const OccasionSection = () => {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location: deliveryCity } = useDeliveryLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const occasionRes = await api.get('/occasions?activeOnly=true');
        setOccasions(occasionRes.data.data || []);
      } catch (error) {
        console.error('Error fetching occasion data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deliveryCity]);

  const handleOccasionClick = (occasionName) => {
    const slug = occasionName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/shop?occasion=${slug}`);
  };

  return (
    <section className="relative py-12 sm:py-20 overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Premium Heading Section */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4"
          >
            <Sparkles size={14} className="w-3 h-3 sm:w-4 sm:h-4" /> Celebrations
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-heading mb-3 sm:mb-4 tracking-tighter uppercase"
          >
            Shop By Occasion
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[11px] sm:text-sm text-muted font-medium max-w-xl mx-auto"
          >
            Make every milestone unforgettable. Discover handcrafted treats perfectly tailored for your special moments.
          </motion.p>
        </div>

        {/* UPDATED: Changed grid-cols-1 to grid-cols-2 for mobile grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse aspect-[4/5] sm:aspect-[3/4]">
                <div className="w-full h-full bg-muted/20" />
              </div>
            ))
          ) : (
            occasions.map((occ, idx) => {
              const DynamicIcon = CARD_ICONS[idx % CARD_ICONS.length];

              return (
                <motion.div
                  key={occ._id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => handleOccasionClick(occ.label || occ.name)}
                  // Slightly reduced corner rounding (rounded-2xl) on mobile
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] cursor-pointer"
                  style={{
                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Background Image */}
                  <img
                    src={occ.image}
                    alt={occ.label || occ.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />

                  {/* Rich Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />

                  {/* Top Right Floating Icon Badge (Scaled down for mobile) */}
                  <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all duration-500 group-hover:bg-primary group-hover:text-button-text group-hover:border-primary group-hover:scale-110 group-hover:-rotate-12 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]">
                    <DynamicIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>

                  {/* Bottom Text Content (Reduced padding on mobile) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-8 flex flex-col justify-end h-full">
                    <div className="transform sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      {/* Reduced text size for mobile grid */}
                      <h3 className="text-sm sm:text-2xl font-black text-white uppercase tracking-wider mb-1 sm:mb-2 leading-tight drop-shadow-md">
                        {occ.label || occ.name}
                      </h3>

                      {/* Hidden Explore Action */}
                      <div className="hidden sm:flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        Explore Collection
                        <ArrowRight size={14} className="transform -translate-x-4 group-hover:translate-x-0 transition-transform duration-500 delay-100" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* View All Button */}
        {occasions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10 sm:mt-16"
          >
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full border-2 border-border/50 text-heading font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] hover:border-primary hover:bg-primary hover:text-button-text transition-all duration-300 active:scale-95 group"
            >
              View All Occasions
              <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default OccasionSection;