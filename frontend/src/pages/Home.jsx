import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useGetProductsQuery } from '../product/productApi';
import toast from 'react-hot-toast';
import ProductCard from '../product/ProductCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import OccasionSection from '../components/home/OccasionSection';
import Bestseller from '../components/home/bestseller';
import Features from '../components/home/features';
import DeliveryHero from '../components/home/DeliveryHero';
import { useDeliveryLocation } from '../context/LocationContext';
import HomeBanner from '../components/home/HomeBanner';
import api from '../utils/api';
import HomeLoader from '../components/home/HomeLoader';
import WhatsAppButton from '../components/WhatsAppButton';
import TrustBar from '../components/home/TrustBar';
import { CategoryCircles } from '../components/home/Category';

import ReviewsHome from '../components/home/ReviewsHome';
import BottomBanner from '../components/home/BottomBanner';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Grid, Heart, Package, Star, TrendingUp, Filter, Sparkles, Cake } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [page, setPage] = useState(1);
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const productsPerPage = 4;

  const { data: productRes, isLoading: loading } = useGetProductsQuery({
    q: query,
    category: activeCategory !== 'All' ? activeCategory.toLowerCase() : '',
    location: deliveryCity,
    limit: productsPerPage,
    page,
    sort: sortBy
  });

  const products = productRes?.data || [];
  const totalProducts = productRes?.total || 0;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <div className="min-h-screen bg-background text-body">
      <HomeLoader show={showHomeLoader} onFinish={handleLoaderFinish} />

      <h1 className="sr-only">The Chocolate Mine - Premium Handcrafted Artisan Chocolates, Cakes & Custom Desserts in Coimbatore | Pan India Delivery | Pure Veg & Eggless Cakes</h1>

      {/* 1. TrustBar (Top-most element) */}
      {!query && (
        <div className="w-full overflow-hidden">
          <TrustBar />
        </div>
      )}

      {/* 2. Home Banner */}
      {!query && (
        <div className="responsive-container pt-4 pb-6">
          <HomeBanner />
        </div>
      )}

      {/* 3. CategoryCircles */}
      {!query && (
        <CategoryCircles activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      )}

      <main className="responsive-container py-6 pb-32">
        <div className="mx-auto space-y-10 sm:space-y-12 tv:space-y-16">
          {!query ? (
            <>
              {/* Bestseller Section */}
              <Bestseller location={deliveryCity} />

              {/* Featured Section */}
              <Features location={deliveryCity} />

              {/* Delivery Hero Section */}
              <DeliveryHero />

              <OccasionSection />
            </>
          ) : null}

          {/* Product Grid / Our Collections */}
          <section className="pt-6 tv:pt-10 border-b border-border/20 overflow-hidden" id="main-catalog">
            <div className="flex flex-col gap-5 lg:gap-8">

              <div className="flex flex-row items-center justify-between gap-4 w-full px-4 sm:px-0 mb-6 lg:mb-8">

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Cake className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase text-heading">
                    Our Collections
                  </h2>
                </div>

                {!loading && products.length > 0 && (
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm font-black text-primary hover:text-primary-hover uppercase tracking-widest border-b-2 border-primary/20 pb-0.5 transition-all hover:gap-2 whitespace-nowrap mb-1"
                  >
                    View All
                  </Link>
                )}
              </div>

              {loading && products.length === 0 ? (
                <div className="flex overflow-x-hidden gap-3 sm:gap-4 lg:gap-6 tv:gap-8 pb-4 lg:pb-6 px-4 sm:px-0">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={`col-skel-${i}`} className="shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px] tv:w-[360px]">
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="px-4 sm:px-0 pb-2">
                  <Swiper
                    modules={[FreeMode]}
                    freeMode={true}
                    slidesPerView={'auto'}
                    spaceBetween={16}
                    className="!pb-2 !overflow-visible"
                    breakpoints={{
                      640: { spaceBetween: 16 },
                      1024: { spaceBetween: 24 },
                      1536: { spaceBetween: 32 }
                    }}
                  >
                    {products.map((p, i) => (
                      <SwiperSlide key={p._id} className="!w-[180px] sm:!w-[220px] md:!w-[260px] lg:!w-[300px] tv:!w-[360px] !h-auto flex flex-col">
                        <motion.div
                          variants={fadeUp}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true }}
                          custom={i % 4}
                          className="h-full flex flex-col"
                        >
                          <ProductCard product={p} />
                        </motion.div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="mx-4 sm:mx-0 py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
                  <Search size={48} className="mx-auto mb-6 text-primary/20" />
                  <p className="text-2xl font-black text-heading">No delicacies found</p>
                  <p className="text-xs font-semibold text-muted mt-2 uppercase tracking-wider">Adjust your filters</p>
                </div>
              )}

              <div className="mt-2 mb-6 flex justify-center">
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
          {!query && <ReviewsHome />}

          {/* Bottom Banner */}
          {!query && <BottomBanner />}
        </div>
      </main>

      <WhatsAppButton />
    </div>
  );
};

export default Home;