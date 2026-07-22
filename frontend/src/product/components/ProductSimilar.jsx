import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import ProductCard from '../ProductCard';

const ProductSimilar = ({ relatedProducts }) => {
  if (!relatedProducts || relatedProducts.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header with View All link */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 px-4 lg:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-heading tracking-tight uppercase">
            Similar Products
          </h2>
          <p className="text-xs sm:text-sm font-bold text-muted uppercase tracking-widest mt-1 hidden sm:block">
            You might also like these artisan treats
          </p>
        </div>
        <Link
          to="/shop"
          className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.2em] hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Swiper Auto Slider */}
      <div className="relative similar-swiper-wrapper">
        <style>{`
          .similar-swiper-wrapper .swiper-pagination {
            bottom: -8px !important;
          }
          .similar-swiper-wrapper .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            background: var(--primary);
            opacity: 0.25;
            transition: all 0.3s ease;
          }
          .similar-swiper-wrapper .swiper-pagination-bullet-active {
            opacity: 1;
            width: 24px;
            border-radius: 4px;
          }
        `}</style>
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={16}
          slidesPerView={1.2}
          loop={relatedProducts.length > 2}
          autoplay={{
            delay: 3500, // Moderate delay
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          breakpoints={{
            480: { slidesPerView: 1.6, spaceBetween: 16 },
            640: { slidesPerView: 2.2, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="pb-10 !px-4 lg:!px-0"
        >
          {relatedProducts.map((product, idx) => (
            <SwiperSlide key={product._id?.$oid || product._id || idx} className="h-auto">
              <ProductCard product={product} layout="vertical" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ProductSimilar;