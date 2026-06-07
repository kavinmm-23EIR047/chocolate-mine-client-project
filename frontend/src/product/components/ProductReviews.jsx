import React from 'react';
import { Star, CheckCircle2, Info } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const ProductReviews = ({ product, productReviews }) => {
  return (
    <div className="mt-10 lg:mt-16 bg-card rounded-3xl sm:rounded-[2.5rem] border border-border/50 p-5 sm:p-8 lg:p-10 shadow-sm mx-4 sm:mx-6 lg:mx-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-heading mb-1.5 sm:mb-2 uppercase tracking-tight">Ratings & Reviews</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 bg-success text-button-text px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-base sm:text-lg font-black shadow-sm">
              {product?.ratingsAverage || 0} <Star size={16} fill="currentColor" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-muted uppercase tracking-widest">{product?.ratingsCount || 0} Verified Reviews</span>
          </div>
        </div>
      </div>

      {productReviews && productReviews.length > 0 ? (
        <div className="relative reviews-swiper-wrapper">
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
              width: 24px;
              border-radius: 4px;
            }
          `}</style>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="pb-12 sm:pb-16"
          >
            {productReviews.map((rev, i) => (
              <SwiperSlide key={i}>
                <div className="rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 h-full flex flex-col transition-all duration-500 border border-border/40 hover:border-primary/20 bg-card hover:shadow-premium">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={14} fill={idx < rev.rating ? "var(--star)" : "none"} className={idx < rev.rating ? "text-star" : "text-muted/20"} />
                      ))}
                    </div>
                    {rev.rating >= 4 && (
                      <span className="text-[10px] sm:text-xs font-black text-success-text bg-success-light border border-success/10 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-heading font-medium italic leading-relaxed line-clamp-4 mb-6 flex-1 opacity-90">
                    "{rev.comment}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/20 mt-auto">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                      {rev.userName?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-heading capitalize truncate">{rev.userName || 'Verified Customer'}</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                        {(() => {
                          if (!rev.createdAt) return 'Verified Purchase';
                          const diffTime = Math.abs(new Date() - new Date(rev.createdAt));
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const dateStr = new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          return diffDays <= 7 ? `Purchased recently · ${dateStr}` : `Verified Purchase · ${dateStr}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="text-center py-16 sm:py-20 bg-surface/5 rounded-3xl sm:rounded-[2.5rem] border border-dashed border-border/50">
          <Info className="mx-auto text-muted/30 mb-4" size={40} />
          <p className="text-base sm:text-lg font-black text-heading uppercase tracking-widest opacity-30">No reviews yet</p>
          <p className="text-xs sm:text-sm text-muted mt-2">Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;