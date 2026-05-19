import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Star, Search, SlidersHorizontal,
  MapPin, Clock, Tag, Truck, ShieldCheck, Phone, ChevronLeft,
  Zap, PackageCheck, ShoppingCart, Sparkles
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useGetProductsQuery } from '../services/api/productApi';
import { useGetLatestReviewsQuery } from '../services/api/reviewApi';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import OccasionSection from '../components/home/OccasionSection';
import { useDeliveryLocation } from '../context/LocationContext';
import HomeBanner from '../components/home/HomeBanner';
import api from '../utils/api';
import HomeLoader from '../components/home/HomeLoader';



const MINI_ADS = [
  {
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
    label: 'Same Day Delivery',
    sub: 'Same day delivery',
  },
  {
    img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&q=80',
    label: 'Custom Cakes',
    sub: 'Your design, our craft',
    to: '/custom-cake',
  },
  {
    img: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&q=80',
    label: 'Fresh Daily',
    sub: 'Baked every morning',
  },
];

const TRUST = [
  { icon: <Sparkles size={15} />, label: '100% Handcrafted Artisanal Quality' },
  { icon: <MapPin size={15} />, label: 'Coimbatore only · Fresh & local' },
  { icon: <Clock size={15} />, label: 'Same-day delivery available' },
  { icon: <ShieldCheck size={15} />, label: 'RazorPay secure checkout' },
  { icon: <Phone size={15} />, label: '24×7 WhatsApp support' },
];

const ADS = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80',
    title: 'Pure Belgian Chocolate Cakes',
    tag: 'NEW ARRIVAL',
    sub: 'Experience the rich, velvety texture of authentic Belgian chocolate in every bite.',
    cta: 'Order Now',
    code: 'CHOCO20'
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1400&q=80',
    title: 'Artisan Truffle Collection',
    tag: 'BESTSELLER',
    sub: 'Handcrafted truffles made with organic ingredients and premium cocoa.',
    cta: 'View Collection',
    code: 'MINE10'
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1400&q=80',
    title: 'Celebrate with Custom Cakes',
    tag: 'CELEBRATION',
    sub: 'Make your special moments unforgettable with our personalized cake designs.',
    cta: 'Customize Now',
    code: 'PARTY15',
    ctaLink: '/custom-cake',
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════ */
const Home = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search') || '';

  const [showHomeLoader, setShowHomeLoader] = useState(() => {
    try {
      return !localStorage.getItem('tcm_home_loader_done');
    } catch {
      return true;
    }
  });

  const handleLoaderFinish = React.useCallback(() => {
    try {
      localStorage.setItem('tcm_home_loader_done', '1');
    } catch {
      /* ignore */
    }
    setShowHomeLoader(false);
  }, []);

  const [sortBy, setSortBy] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedCode, setCopiedCode] = useState('');
  const { location: deliveryCity } = useDeliveryLocation();
  const [activeTrustIndex, setActiveTrustIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const productsPerPage = 4;

  // RTK Query for Products
  const { data: productRes, isLoading: loading, isFetching } = useGetProductsQuery({
    q: query,
    category: activeCategory !== 'All' ? activeCategory.toLowerCase() : '',
    location: deliveryCity,
    limit: productsPerPage,
    page,
    sort: sortBy
  });

  const products = productRes?.data || [];
  const totalProducts = productRes?.total || 0;

  const { data: reviewRes } = useGetLatestReviewsQuery();
  const reviews = reviewRes?.data?.reviews || [];

  const timerRef = useRef(null);

  /* Responsive Listeners */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* auto-rotate ticker */
  useEffect(() => {
    const trustTimer = setInterval(() => setActiveTrustIndex(s => (s + 1) % TRUST.length), 4000);
    return () => {
      clearInterval(trustTimer);
    };
  }, []);

  /* Fetch categories from backend */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories');
        const backendCategories = response.data?.data || [];

        // Add "All" category at the beginning with a default image
        const allCategory = {
          name: 'All',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
        };

        setCategories([allCategory, ...backendCategories]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default "All" category only
        setCategories([{
          name: 'All',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
        }]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /* load reviews (optional: move to RTK query later) */
  useEffect(() => {
    // Handled by RTK Query
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, sortBy, activeCategory]);

  const categoryRef = useRef(null);
  const reviewsRef = useRef(null);

  const scrollX = (ref, dir) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setPage(1);
    const el = document.getElementById('main-catalog');
    if (el) {
      const offset = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  const handleSort = (val) => {
    setSortBy(val);
    setPage(1);
  };

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied!`, {
      style: { background: 'var(--primary)', color: 'var(--button-text)', fontWeight: 'bold' }
    });
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="min-h-screen bg-background text-body">
      <HomeLoader show={showHomeLoader} onFinish={handleLoaderFinish} />

      {/* ── SEO HIDDEN H1 ─────────────────────────────────────────── */}
      <h1 className="sr-only">The Chocolate Mine - Premium Handcrafted Artisan Chocolates, Cakes & Custom Desserts in Coimbatore</h1>

      <main className="w-full mx-auto px-4 sm:px-8 lg:px-16 py-6 pb-32 space-y-12 sm:space-y-16">
        {!query ? (
          <>
            {/* ── MOBILE PROMO STRIP SLIDER ───────────────────────────── */}
            <div className="lg:hidden relative px-4 mb-8">
              <div className="relative overflow-hidden">
                {/* Content Area */}
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
                      <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                        {TRUST[activeTrustIndex].icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                        {TRUST[activeTrustIndex].label}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-1.5 mt-2">
                  {TRUST.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTrustIndex(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${activeTrustIndex === i ? 'w-5 bg-primary' : 'w-1 bg-primary/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <section className="mb-4">
              <HomeBanner />
            </section>

            {/* ── TRUST TICKER (Desktop Only now) ────────────────────── */}
            <div className="hidden lg:block bg-card/50 backdrop-blur-sm border-y border-border/30 rounded-3xl overflow-hidden mb-12">
              <div className="max-w-[1800px] mx-auto px-4 py-4 sm:px-12">
                <div className="flex items-center justify-between gap-8">
                  {TRUST.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 whitespace-nowrap shrink-0 group">
                      <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary transition-all duration-500">
                        {t.icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted group-hover:text-primary transition-colors">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DYNAMIC CATEGORY CIRCLES FROM BACKEND ────────────────── */}
            <section className="py-10">
              {categoriesLoading ? (
                <div className="flex flex-wrap justify-center gap-4 sm:gap-12 px-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-3xl bg-muted/10 animate-pulse" />
                      <div className="w-12 h-3 bg-muted/10 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4 sm:gap-12 px-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategory(cat.name)}
                      className="flex flex-col items-center gap-4 group outline-none shrink-0"
                    >
                      <div className={`w-16 h-16 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] border-2 p-1 transition-all duration-500 overflow-hidden shadow-xl ${activeCategory === cat.name
                        ? 'border-primary ring-4 sm:ring-8 ring-primary/5 shadow-primary/20 scale-110'
                        : 'border-border/40 group-hover:border-primary/40 group-hover:scale-105'
                        }`}>
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className={`w-full h-full object-cover rounded-[1.3rem] sm:rounded-[1.8rem] transition-transform duration-700 ${activeCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'
                            }`}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80';
                          }}
                        />
                      </div>
                      <span className={`text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeCategory === cat.name ? 'text-primary' : 'text-muted/60 group-hover:text-primary group-hover:tracking-[0.3em]'
                        }`}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* ── DELIVERY STRIP ───────────────────────────────────────── */}
            <section
              className="rounded-[2.5rem] sm:rounded-[3rem] p-5 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 relative overflow-hidden group cutting-edge-border shadow-premium"
              style={{ background: 'var(--card)' }}
            >
              {/* Background Glows */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-primary/10 transition-colors duration-1000" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] -ml-24 -mb-24 group-hover:bg-accent/10 transition-colors duration-1000" />

              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 text-center md:text-left">
                {/* Icon Container */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center rounded-[2.5rem] bg-heading dark:bg-black/40 border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                    <Truck size={48} className="text-white opacity-80" strokeWidth={1.5} />
                    <div className="absolute -bottom-2 -right-2 bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20">
                      <Zap size={20} className="text-button-text" fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                    <PackageCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Service</span>
                  </div>
                  <h3 className="font-black text-2xl sm:text-4xl md:text-6xl tracking-tighter uppercase leading-[0.95] mb-6 text-heading">
                    Exclusive <br /> <span className="text-primary">Local Delivery</span>
                  </h3>
                  <p className="text-sm sm:text-lg font-medium opacity-60 leading-relaxed text-heading/80">
                    We bake fresh every morning and hand-deliver straight to your door to guarantee the luxury quality you deserve. Same-day delivery available across <span className="text-primary font-black uppercase tracking-widest">{deliveryCity}</span>.
                  </p>
                </div>
              </div>

              {/* Active Zone Badge */}
              <div className="flex items-center gap-4 sm:gap-6 shrink-0 px-6 sm:px-10 py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/40 shadow-premium relative z-10 group-hover:border-primary/30 transition-all duration-500 w-full lg:w-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-success/10 flex items-center justify-center text-success shadow-inner border border-success/20">
                  <MapPin size={24} className="animate-pulse sm:w-8 sm:h-8" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Active Zone</span>
                  <span className="text-xl sm:text-2xl font-black uppercase tracking-[0.05em] text-success capitalize leading-none">{deliveryCity}</span>
                  <div className="h-0.5 w-6 sm:w-8 bg-success/30 mt-2 sm:mt-3 rounded-full" />
                </div>
              </div>
            </section>

            {/* ── MINI ADS GRID ────────────────────────────────────────── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {MINI_ADS.map((ad, i) => {
                const card = (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={i}
                    className="relative rounded-3xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-700 bg-white dark:bg-card"
                  >
                    <img
                      src={ad.img}
                      alt={ad.label}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-6"
                      style={{ background: 'linear-gradient(0deg,rgba(21,10,8,0.9) 0%,transparent 70%)' }}
                    >
                      <p className="font-black text-lg leading-tight text-[#FDE8E4] drop-shadow-sm">{ad.label}</p>
                      <p className="text-[11px] mt-1 text-[#FDE8E4]/70 font-bold uppercase tracking-widest">{ad.sub}</p>
                    </div>
                  </motion.div>
                );
                return ad.to ? (
                  <Link key={i} to={ad.to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl">
                    {card}
                  </Link>
                ) : (
                  <div key={i}>{card}</div>
                );
              })}
            </section>

            <OccasionSection />

          </>
        ) : null}

        {/* ── MAIN PRODUCT GRID (Full Width Floweraura Style) ──────── */}
        <section className="pt-8" id="main-catalog">
          <div className="flex flex-col gap-10">

            {/* Header Box */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-4xl font-black tracking-tighter uppercase leading-none whitespace-nowrap">Our Collections</h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 lg:gap-8">
              {loading && products.length === 0 ? (
                Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
              ) : products.length > 0 ? (
                products.map((p, i) => (
                  <motion.div
                    key={p._id}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={i % 4}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-40 text-center bg-card rounded-[3rem] border-2 border-dashed border-border/50 shadow-inner">
                  <Search size={64} className="mx-auto mb-8 text-primary/10" />
                  <p className="text-3xl font-black uppercase tracking-tighter text-heading">No delicacies found</p>
                  <p className="text-[11px] font-bold text-muted mt-4 uppercase tracking-[0.3em]">Adjust your filters or try a different search</p>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-center">
              <Link to="/shop" className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] bg-primary text-button-text px-12 py-4 rounded-full hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95">
                View All Collections
              </Link>
            </div>
          </div>
        </section>

        {/* ── REVIEWS with Swiper Controls ─────────────────────────── */}
        {!query && (
          <section
            className="rounded-[3.5rem] border border-border/40 p-6 sm:p-16 shadow-2xl relative overflow-hidden group"
            style={{ background: 'var(--card)' }}
          >
            <style>{`
              .reviews-swiper-wrapper .swiper-pagination {
                bottom: 0px !important;
              }
              .reviews-swiper-wrapper .swiper-pagination-bullet {
                width: 8px;
                height: 8px;
                background: var(--primary);
                opacity: 0.25;
                transition: all 0.3s ease;
              }
              .reviews-swiper-wrapper .swiper-pagination-bullet-active {
                opacity: 1;
                width: 28px;
                border-radius: 4px;
              }
            `}</style>
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-primary/10 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -ml-48 -mb-48 group-hover:bg-accent/10 transition-colors duration-1000" />
            <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-10 relative z-10">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Testimonials</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-tight text-heading">
                  Customer <br /> <span className="text-primary">Stories</span>
                </h2>
                <p className="text-sm font-bold opacity-40 uppercase tracking-[0.4em] mt-6">Voices of the sweet community</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-10 px-10 py-8 rounded-[3rem] shadow-2xl relative overflow-hidden group/rating cutting-edge-border">
                <div className="absolute inset-0 bg-gradient-to-br from-card/40 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-center">
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter text-primary">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < Math.floor((reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1))) ? "var(--primary)" : "none"}
                          className={i < Math.floor((reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1))) ? "text-primary" : "text-border"}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary/60">
                      {reviews.length} Verified Reviews
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block w-[1px] h-16 bg-primary/10" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40 max-w-[180px] leading-relaxed relative z-10">
                  Exceptional taste, verified by our premium members
                </p>
              </div>
            </div>

            <div className="relative z-10 reviews-swiper-wrapper">
              <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1280: { slidesPerView: 3 },
                }}
                className="pb-16"
              >
                {reviews.map((r, i) => (
                  <SwiperSlide key={i} className="h-auto pb-4">
                    <motion.div
                      className="rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col h-full transition-all duration-700 group/card relative overflow-hidden cutting-edge-border hover:shadow-premium"
                    >
                      <div className="absolute top-4 right-6 opacity-[0.04] group-hover/card:opacity-[0.08] transition-opacity duration-700">
                        <Star size={120} />
                      </div>

                      <div className="flex gap-1 mb-6 relative z-10">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={16}
                            fill={j < r.rating ? 'var(--primary)' : 'none'}
                            className={j < r.rating ? 'text-primary' : 'text-border'}
                          />
                        ))}
                      </div>

                      <div className="relative flex-1 mb-8">
                        <span className="absolute -top-6 -left-2 text-6xl font-serif text-primary/10 leading-none">"</span>
                        <p className="text-base sm:text-lg leading-relaxed font-semibold italic text-heading/90 relative z-10 px-2">
                          {r.comment}
                        </p>
                      </div>

                      <div className="flex items-center gap-5 pt-8 border-t border-border/40">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-xl font-black text-button-text shadow-xl shadow-primary/20 ring-4 ring-primary/5">
                            {r.userName?.charAt(0) || 'U'}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-4 border-background flex items-center justify-center">
                            <ShieldCheck size={10} className="text-button-text" />
                          </div>
                        </div>
                        <div>
                          <p className="text-base font-black tracking-tight text-heading">{r.userName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Verified Order</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>



          </section>
        )}

        {/* ── BOTTOM BANNER ────────────────────────────────────────── */}
        {!query && (
          <section className="rounded-[3rem] overflow-hidden relative shadow-2xl border border-border/20" style={{ height: 200 }}>
            <img
              src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1400&q=80"
              alt="The Chocolate Mine"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              style={{ background: 'rgb(var(--footer-rgb) / 0.85)' }}
            >
              <h3 className="font-black text-2xl sm:text-4xl mb-3 text-footer-text tracking-tighter uppercase">
                Freshly Baked. Securely Paid.
              </h3>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.4em] text-footer-text/50">
                Coimbatore · RazorPay · Fresh Daily
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default Home;