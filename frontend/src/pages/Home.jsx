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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
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

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        <div className="max-w-[1400px] mx-auto space-y-10 sm:space-y-12">
          {!query ? (
            <>
              <TrustBar />

              {/* Home Banner */}
              <section className="mb-3">
                <HomeBanner />
              </section>

              <CategoryCircles activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

              {/* Bestseller Section */}
              <Bestseller location={deliveryCity} />

              {/* Featured Section */}
              <Features location={deliveryCity} />

              {/* Delivery Hero Section */}
              <DeliveryHero />



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