import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Star,
  Search,
  MapPin,
  Clock,
  Tag,
  Truck,
  ShieldCheck,
  Phone,
  Zap,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  BadgeCheck,
  Leaf,
  EggFried,
  Globe,
  Heart
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';

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
import WhatsAppButton from '../components/WhatsAppButton';
import ScooterLightImg from '../assets/scooter-light.png';
import ScooterDarkImg from '../assets/scooter-dark.png';
import CakeImg from '../assets/cake.png';

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
  { icon: <Sparkles size={16} />, label: '100% Handcrafted Artisanal Quality' },
  { icon: <MapPin size={16} />, label: 'Coimbatore · Pan India Delivery' },
  { icon: <Leaf size={16} />, label: '100% Pure Veg · Eggless' },
  { icon: <ShieldCheck size={16} />, label: 'RazorPay secure checkout' },
  { icon: <Phone size={16} />, label: '24×7 WhatsApp support' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

// ✅ FIX 1: Clean delivery features - no duplicate
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
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const productsPerPage = 4;

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const trustTimer = setInterval(() => setActiveTrustIndex(s => (s + 1) % TRUST.length), 4000);
    return () => clearInterval(trustTimer);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories');
        const backendCategories = response.data?.data || [];
        const allCategory = {
          name: 'All',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
        };
        setCategories([allCategory, ...backendCategories]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
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

  useEffect(() => {
    const fetchFeaturedProduct = async () => {
      try {
        const res = await api.get('/products?limit=1&sort=popular');
        const product = res.data?.data?.[0];
        if (product) setFeaturedProduct(product);
      } catch (err) {
        console.error('Featured product fetch failed:', err);
      }
    };
    fetchFeaturedProduct();
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    const el = document.getElementById('main-catalog');
    if (el) {
      const offset = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [activeCategory, query, sortBy]);

  const handleSort = (val) => { setSortBy(val); setPage(1); };

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

      <h1 className="sr-only">The Chocolate Mine - Premium Handcrafted Artisan Chocolates, Cakes & Custom Desserts in Coimbatore | Pan India Delivery | Pure Veg & Eggless Cakes</h1>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        <div className="max-w-[1400px] mx-auto space-y-10 sm:space-y-12">
          {!query ? (
            <>
              {/* Mobile Trust Ticker */}
              <div className="lg:hidden relative px-4 mb-6">
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
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                          {TRUST[activeTrustIndex].icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap">
                          {TRUST[activeTrustIndex].label}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
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

              {/* Home Banner */}
              <section className="mb-3">
                <HomeBanner />
              </section>

              {/* Desktop Trust Bar */}
              <div className="hidden lg:block bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden mb-8">
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between gap-4">
                    {TRUST.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 whitespace-nowrap shrink-0 group">
                        <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                          {t.icon}
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors">
                          {t.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Circles */}
              <section className="py-4">
                {categoriesLoading ? (
                  <div className="flex flex-wrap justify-center gap-6 sm:gap-10 px-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-muted/10 animate-pulse" />
                        <div className="w-14 h-3 bg-muted/10 rounded-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-6 sm:gap-10 lg:gap-14 px-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        className="flex flex-col items-center gap-3 group outline-none shrink-0"
                      >
                        <div className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-2 p-1.5 transition-all duration-500 overflow-hidden shadow-md ${activeCategory === cat.name
                          ? 'border-primary ring-4 ring-primary/10 shadow-primary/20 scale-110'
                          : 'border-border/30 group-hover:border-primary/40 group-hover:scale-105'
                          }`}>
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'; }}
                          />
                        </div>
                        <span className={`text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeCategory === cat.name ? 'text-primary' : 'text-muted/70 group-hover:text-primary'
                          }`}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Delivery Hero Section */}
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

                  {/* ✅ FIX: Better grid ratio for merging content + scooter */}
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

                      {/* ✅ FIX: Simplified CTAs */}
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

                    {/* ✅ FIX: Scooter image - larger, overlapping layout */}
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

                    {/* ✅ FIX: Visual separator for STATS */}
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

                  {/* Cake Image */}
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

                  {/* Custom Cake Features */}
                  <div className="flex flex-col gap-2.5 px-5 py-3 flex-1">
                    {[
                      { icon: <Sparkles size={14} />, label: 'Custom Flavors', sub: 'Choose your favorite flavors' },
                      { icon: <BadgeCheck size={14} />, label: 'Personalized Design', sub: 'Tailored to your special moments' },
                      { icon: <PackageCheck size={14} />, label: 'Premium Ingredients', sub: 'Made with the finest ingredients' },
                      { icon: <Heart size={14} />, label: 'Pure Veg & Eggless', sub: '100% vegetarian, eggless options' },
                    ].map(({ icon, label, sub }) => (
                      <div key={label} className="flex items-start gap-3 group cursor-default">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                          style={{ background: 'var(--background)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight leading-tight" style={{ color: 'var(--heading)' }}>{label}</p>
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

              {/* Mini Ads Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {MINI_ADS.map((ad, i) => {
                  const card = (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      custom={i}
                      className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-700 bg-white dark:bg-card h-52"
                    >
                      <img
                        src={ad.img}
                        alt={ad.label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div
                        className="absolute inset-0 flex flex-col justify-end p-5"
                        style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.8) 0%,transparent 60%)' }}
                      >
                        <p className="font-bold text-lg text-white drop-shadow-sm">{ad.label}</p>
                        <p className="text-[11px] mt-1 text-white/70 font-semibold uppercase tracking-wider">{ad.sub}</p>
                      </div>
                    </motion.div>
                  );
                  return ad.to ? (
                    <Link key={i} to={ad.to} className="block">
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

          {/* Product Grid */}
          <section className="pt-6" id="main-catalog">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase">Our Collections</h2>
                <div className="h-1 w-12 bg-primary rounded-full" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
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
                  <div className="col-span-full py-32 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
                    <Search size={48} className="mx-auto mb-6 text-primary/20" />
                    <p className="text-2xl font-black text-heading">No delicacies found</p>
                    <p className="text-xs font-semibold text-muted mt-2 uppercase tracking-wider">Adjust your filters</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  to="/shop"
                  className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] bg-primary text-button-text px-10 py-3.5 rounded-full hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                  View All Collections
                </Link>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          {!query && reviews.length > 0 && (
            <section className="rounded-3xl border border-border/30 p-6 sm:p-10 shadow-xl relative overflow-hidden group bg-card">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] -ml-36 -mb-36" />

              <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-8 relative z-10">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Testimonials</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-heading">
                    Customer <br /> <span className="text-primary">Stories</span>
                  </h2>
                  <p className="text-xs font-bold opacity-50 uppercase tracking-[0.3em] mt-4">Voices of our community</p>
                </div>

                <div className="flex items-center gap-6 px-8 py-5 rounded-2xl bg-background/50 border border-border/30">
                  <div className="text-center">
                    <span className="text-5xl font-black text-primary">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
                    </span>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="var(--primary)" className="text-primary" />
                      ))}
                    </div>
                    <p className="text-[9px] text-muted mt-1 font-semibold">{reviews.length}+ reviews</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-xs font-semibold text-heading">Trusted by</p>
                    <p className="text-2xl font-black text-primary">12K+</p>
                    <p className="text-[9px] text-muted">customers</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <Swiper
                  modules={[Pagination, Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
                  className="pb-10"
                >
                  {reviews.slice(0, 6).map((r, i) => (
                    <SwiperSlide key={i} className="h-auto">
                      <div className="bg-background/50 rounded-xl p-5 h-full border border-border/20">
                        <div className="flex gap-0.5 mb-3">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={14} fill={j < r.rating ? 'var(--primary)' : 'none'} className={j < r.rating ? 'text-primary' : 'text-border'} />
                          ))}
                        </div>
                        <p className="text-sm text-muted italic line-clamp-3 mb-4">"{r.comment}"</p>
                        <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {r.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-heading">{r.userName}</p>
                            <p className="text-[9px] text-muted">Verified Buyer</p>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </section>
          )}

          {/* Bottom Banner */}
          {!query && (
            <section className="rounded-2xl overflow-hidden relative shadow-lg border border-border/20 h-44 sm:h-52">
              <img
                src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1400&q=80"
                alt="The Chocolate Mine"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tighter">
                  Freshly Baked. Securely Paid.
                </h3>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
                  Coimbatore · Pan India Delivery · Pure Veg & Eggless
                </p>
                <Link
                  to="/shop"
                  className="mt-4 px-6 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-all"
                >
                  Shop Now →
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default Home;