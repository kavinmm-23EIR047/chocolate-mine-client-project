import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Grid } from 'lucide-react';
import { useGetProductsQuery } from '../../product/productApi';
import ProductCard from '../../product/ProductCard';
import { CardSkeleton } from '../ui/Skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const ProductGrid = ({ query, activeCategory, deliveryCity }) => {
  const { data: productRes, isLoading: loading } = useGetProductsQuery({
    q: query,
    category: activeCategory !== 'All' ? activeCategory.toLowerCase() : '',
    location: deliveryCity,
    limit: 10, // High limit so there are enough items to swipe through
  });

  const products = productRes?.data || [];

  return (
    <section className="responsive-section !py-6 lg:!py-10 border-b border-border/20 overflow-hidden" id="main-catalog">
      <div className="flex flex-col gap-5 lg:gap-8">
        
        <div className="flex flex-col mobile-lg:flex-row mobile-lg:items-end justify-between gap-3 w-full">
          <div className="space-y-1 lg:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] lg:text-xs font-black uppercase tracking-wider">
              <Grid size={10} className="lg:w-3 lg:h-3" /> Our Collections
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-heading uppercase">
              Main Catalog
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

        {loading ? (
          <div 
            className="flex overflow-x-hidden gap-3 sm:gap-4 lg:gap-6 tv:gap-8 pb-4 lg:pb-6"
          >
            {Array(4).fill(0).map((_, i) => (
              <div key={`col-skel-${i}`} className="shrink-0 w-[min(78vw,220px)] md:w-[260px] lg:w-[300px] tv:w-[360px]">
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="pb-2">
            <Swiper
              modules={[FreeMode, Pagination, Autoplay]}
              freeMode={true}
              slidesPerView={'auto'}
              spaceBetween={16}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              pagination={{ clickable: true, dynamicBullets: true }}
              className="!pb-12 !overflow-visible"
              breakpoints={{
                640: { spaceBetween: 16 },
                1024: { spaceBetween: 24 },
                1536: { spaceBetween: 32 }
              }}
            >
              {products.map((p, i) => (
                <SwiperSlide key={p._id} className="!w-[min(78vw,220px)] md:!w-[260px] lg:!w-[300px] tv:!w-[360px] !h-auto flex flex-col">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={i}
                    className="h-full flex flex-col"
                  >
                    <ProductCard product={p} />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
            <Search size={48} className="mx-auto mb-6 text-primary/20" />
            <p className="text-2xl font-black text-heading">No delicacies found</p>
            <p className="text-xs font-semibold text-muted mt-2 uppercase tracking-wider">Adjust your filters</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;