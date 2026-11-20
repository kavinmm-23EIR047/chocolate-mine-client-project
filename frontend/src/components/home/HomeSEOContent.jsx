import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Heart, Award, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

const SEO_PILLARS = [
  {
    id: 'custom-cakes',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    badge: 'Artisanal Design',
    title: 'Best Custom Cakes in Coimbatore',
    summary: 'Turn your celebration dreams into reality with handcrafted designer & bespoke theme cakes in Coimbatore.',
    details: [
      'Bespoke Themed Cakes: Superhero, anime, and fairy-tale birthday cakes, chic vintage piping, and bento cakes.',
      'Wedding & Multi-Tier Spectacles: Stunning 2-tier and 3-tier handcrafted wedding cakes with edible florals.',
      'Photo & Personalized Cakes: HD edible printed photo cakes and custom name-monogrammed centerpieces.',
      'Signature Flavours: Belgian dark chocolate truffle, lotus biscoff, and red velvet cream cheese.'
    ],
    ctaText: 'Design Your Custom Cake',
    ctaLink: '/custom-cake'
  },
  {
    id: 'eggless-cakes',
    icon: <Heart className="w-5 h-5 text-emerald-500" />,
    badge: '100% Pure Vegetarian',
    title: 'Best Veg & Eggless Cakes in Coimbatore',
    summary: 'Indulge without compromise. Every delicacy from The Chocolate Mine is strictly 100% pure vegetarian and eggless.',
    details: [
      'Zero Egg, Zero Gelatine Guarantee: Certified pure vegetarian bakery adhering to strict hygienic standards.',
      'Ultra-Soft & Melt-in-Mouth Sponge: Specially perfected egg-free sponge recipes that are moist and fluffy.',
      'Premium Couverture Chocolate: Pure cocoa butter and authentic cocoa rather than compound fat.',
      'Crowd-Pleasing Flavours: Dutch chocolate, Ferrero Rocher indulgence, Hazelnut praline, and Butterscotch.'
    ],
    ctaText: 'Explore Eggless Cakes',
    ctaLink: '/shop'
  },
  {
    id: 'trusted-delivery',
    icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
    badge: '#1 Trusted Bakery',
    title: '#1 Trusted Online Ordering Cake Shop in Coimbatore',
    summary: 'Rated 4.9 stars by 12,000+ Coimbatore dessert lovers with seamless online ordering and guaranteed safe delivery.',
    details: [
      'Express Same-Day Delivery: Fresh cakes delivered to your doorstep within 2 to 3 hours across Coimbatore.',
      'Midnight Birthday Surprises: Guaranteed timely midnight deliveries in temperature-controlled boxes.',
      'Citywide Coverage: Race Course, RS Puram, Gandhipuram, Saibaba Colony, Peelamedu, Saravanampatti, Singanallur, Ramanathapuram & Vadavalli.',
      '100% Safe Payments: Secure checkout via Razorpay, UPI, cards, and live WhatsApp/SMS order tracking.'
    ],
    ctaText: 'Order Online Now',
    ctaLink: '/shop'
  }
];

const LOCALITY_TAGS = [
  'Race Course', 'RS Puram', 'Gandhipuram', 'Saibaba Colony', 'Peelamedu',
  'Saravanampatti', 'Singanallur', 'Ramanathapuram', 'Vadavalli', 'Kovaipudur',
  'Hopes College', 'Ganapathy', 'Kuniyamuthur', 'Sundarapuram', 'Perur'
];

const PillarCard = ({ pillar, isExpanded, onToggle }) => (
  <div className="rounded-2xl bg-card/60 dark:bg-card/40 backdrop-blur-sm shadow-sm transition-all duration-300 flex flex-col justify-between h-full overflow-hidden">
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {pillar.icon}
        </div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/80">
          {pillar.badge}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-black text-heading mb-2 leading-snug">
        {pillar.title}
      </h3>

      <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3">
        {pillar.summary}
      </p>

      <button
        onClick={onToggle}
        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline focus:outline-none mb-2"
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? 'Show less' : 'Read more benefits'}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden pt-2 mt-1 border-t border-foreground/5"
          >
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-muted leading-relaxed">
              {pillar.details.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="p-5 sm:p-6 pt-0">
      <Link
        to={pillar.ctaLink}
        className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-button-text hover:brightness-105 active:scale-95 transition-all duration-200 shadow-md"
      >
        {pillar.ctaText}
      </Link>
    </div>
  </div>
);

const HomeSEOContent = () => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [showAllLocations, setShowAllLocations] = useState(false);

  const handleToggle = (id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden" aria-labelledby="seo-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2.5">
            <Award size={13} />
            <span>Coimbatore's #1 Rated Cake Destination</span>
          </div>

          <h2 id="seo-heading" className="text-lg sm:text-2xl lg:text-3xl font-black text-heading uppercase tracking-tight leading-snug">
            Order Cakes Online in Coimbatore | Best Custom & 100% Veg Eggless Cakes
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Welcome to <strong className="text-foreground">The Chocolate Mine</strong> — Coimbatore’s most trusted online cake shop. 
            We handcraft pure indulgence with 100% pure veg & eggless cakes, bespoke custom birthday and wedding cakes, and artisanal chocolates delivered fresh across the city.
          </p>
        </div>

        {/* Mobile View: Auto-sliding Swiper with Pagination */}
        <div className="block lg:hidden mb-8">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            pagination={{
              clickable: true,
              bulletClass: 'seo-bullet',
              bulletActiveClass: 'seo-bullet-active',
            }}
            slidesPerView={1.08}
            spaceBetween={14}
            centeredSlides={true}
            className="seo-swiper !pb-9"
          >
            {SEO_PILLARS.map((pillar) => (
              <SwiperSlide
                key={pillar.id}
                className="!h-auto flex flex-col"
              >
                <PillarCard
                  pillar={pillar}
                  isExpanded={expandedCard === pillar.id}
                  onToggle={() => handleToggle(pillar.id)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop View: 3-Pillar Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-10">
          {SEO_PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              isExpanded={expandedCard === pillar.id}
              onToggle={() => handleToggle(pillar.id)}
            />
          ))}
        </div>

        {/* Locality Coverage - Clean Borderless Design */}
        <div className="p-5 sm:p-7 rounded-2xl bg-card/40 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <MapPin className="text-primary w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-black text-heading uppercase tracking-wide">
                  Express Online Cake Delivery Across Coimbatore
                </h4>
                <p className="text-[11px] sm:text-xs text-muted">
                  Fresh 100% eggless cakes delivered within 2–3 hours across these locations:
                </p>
              </div>
            </div>
            <Link
              to="/shop"
              className="text-xs font-black text-primary uppercase tracking-wider hover:underline shrink-0"
            >
              Order for Delivery →
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 items-center">
            {(showAllLocations ? LOCALITY_TAGS : LOCALITY_TAGS.slice(0, 6)).map((area, idx) => (
              <span
                key={idx}
                className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-foreground/5 text-muted hover:text-foreground transition-colors cursor-default"
              >
                Cakes in {area}
              </span>
            ))}

            <button
              onClick={() => setShowAllLocations(!showAllLocations)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline px-2 py-1 transition-colors focus:outline-none"
            >
              <span>{showAllLocations ? 'Show Less' : `+${LOCALITY_TAGS.length - 6} More Areas`}</span>
              {showAllLocations ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

      </div>

      {/* Custom Styles for Swiper Pagination */}
      <style>{`
        .seo-swiper .swiper-pagination {
          bottom: 2px !important;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        .seo-bullet {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background-color: var(--primary);
          opacity: 0.3;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .seo-bullet-active {
          width: 22px;
          border-radius: 999px;
          background-color: var(--primary);
          opacity: 1;
        }
      `}</style>
    </section>
  );
};

export default HomeSEOContent;
