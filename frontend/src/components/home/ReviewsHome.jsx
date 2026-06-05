import React, { useState, useEffect } from 'react';
import { Star, StarHalf, ShieldCheck, MessageSquare, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import { useGetLatestReviewsQuery } from '../../services/api/reviewApi';

const REVIEWS_PER_PAGE = 6;

const ReviewsHome = () => {
  const [page, setPage] = useState(1);
  const [displayedReviews, setDisplayedReviews] = useState([]);

  // Fetch all reviews at once
  const { data: reviewRes, isLoading, isFetching, error, refetch } = useGetLatestReviewsQuery();
  const allReviews = reviewRes?.data?.reviews || [];

  useEffect(() => {
    const start = 0;
    const end = page * REVIEWS_PER_PAGE;
    setDisplayedReviews(allReviews.slice(start, end));
  }, [allReviews, page]);

  const hasMore = displayedReviews.length < allReviews.length;

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (!isLoading && allReviews.length === 0) return null;

  const avgRating = allReviews.length
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)
    : '0.0';

  // Component-driven star renderer supporting 0.5 fractions cleanly
  const RenderStars = ({ rating, isDarkThemeActive }) => {
    const stars = [];
    // Absolute color declarations pulled straight from your theme.css specs
    const activeColor = isDarkThemeActive ? '#381A14' : '#F4E8DA';
    const mutedColor = isDarkThemeActive ? 'rgba(56, 26, 20, 0.15)' : 'rgba(244, 232, 218, 0.15)';

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} size={14} fill={activeColor} stroke="none" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} size={14} fill={activeColor} stroke="none" />);
      } else {
        stars.push(<Star key={i} size={14} fill="none" stroke={activeColor} strokeWidth={1.5} className="opacity-30" />);
      }
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[var(--foreground)]/5 rounded-2xl p-6 h-52 animate-pulse border border-[var(--border)]">
          <div className="h-4 bg-[var(--border-muted)] rounded w-1/3 mb-4" />
          <div className="h-4 bg-[var(--border-muted)] rounded w-3/4 mb-3" />
          <div className="h-4 bg-[var(--border-muted)] rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="rounded-3xl border border-[var(--border)] p-6 sm:p-10 shadow-2xl relative overflow-hidden group bg-[var(--surface)] transition-all duration-300 font-['Outfit',sans-serif]">

      {/* Structural Background Accents */}
      <div className="absolute -top-12 -right-12 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-8 relative z-10">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--border)] mb-4 backdrop-blur-sm">
            <MessageSquare size={12} className="text-[var(--heading)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--heading)] font-['Inter',sans-serif]">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-[var(--heading)] leading-none">
            Customer <br /> <span className="opacity-75 font-light">Stories</span>
          </h2>
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-[0.3em] mt-4 font-['Inter',sans-serif]">Voices of our community</p>
        </div>

        {/* Brand Rating Scoreboard */}
        <div className="flex items-center gap-6 px-8 py-5 rounded-2xl bg-[var(--card-soft)] border border-[var(--border)] shadow-xl relative overflow-hidden group/stats">
          <div className="text-center relative z-10">
            <span className="text-5xl font-black tracking-tight text-[var(--foreground)]">{avgRating}</span>
            <div className="flex gap-0.5 mt-1.5 justify-center">
              {/* Outer container tracker fallback */}
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--primary)" className="text-[var(--primary)]" />
              ))}
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-2 font-bold font-['Inter',sans-serif] uppercase tracking-wider">{allReviews.length}+ reviews</p>
          </div>
          <div className="w-px h-14 bg-[var(--border-muted)] opacity-50" />
          <div className="relative z-10 font-['Inter',sans-serif]">
            <p className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider">Trusted by</p>
            <p className="text-3xl font-black text-[var(--primary)] tracking-tight my-0.5">12K+</p>
            <p className="text-[10px] font-medium text-[var(--muted)]">connoisseurs globally</p>
          </div>
        </div>
      </div>

      {/* Main Stream Area */}
      {error ? (
        <div className="text-center py-12 relative z-10">
          <p className="text-[var(--error)] font-semibold mb-2">Failed to load brand testimonials.</p>
          <button onClick={() => refetch()} className="text-[var(--primary)] font-bold underline text-sm">
            Try again
          </button>
        </div>
      ) : isLoading && allReviews.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="relative z-10 px-0.5">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={28}
              slidesPerView={1}
              autoplay={{ delay: 5500, disableOnInteraction: false }}
              pagination={{
                el: '.custom-swiper-pagination',
                clickable: true,
                bulletClass: 'custom-bullet',
                bulletActiveClass: 'custom-bullet-active',
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
              }}
              className="w-full !overflow-visible"
            >
              {displayedReviews.map((review, idx) => (
                <SwiperSlide key={review._id || idx} className="h-auto !flex">

                  {/* 
                    INVERSION STRUCTURAL DEFINITION:
                    Light Mode Surface Base -> Card Background: Creamy Dark Chocolate (#381A14)
                    Dark Mode Surface Base  -> Card Background: Soft Milky Cream (#F4E8DA)
                  */}
                  <div className="w-full bg-[#381A14] dark:bg-[#F4E8DA] text-[#F4E8DA] dark:text-[#381A14] rounded-2xl p-6 border border-[#52271E] dark:border-[#E8D8C7] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden group/card">

                    {/* Tiny Decorative Quote watermarking card backgrounds gracefully */}
                    <Quote size={48} className="absolute -top-2 -right-2 opacity-[0.03] transform rotate-180 pointer-events-none text-current" />

                    <div>
                      {/* Dynamic Injected Rating Row Layer */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="dark:hidden">
                          <RenderStars rating={review.rating} isDarkThemeActive={false} />
                        </div>
                        <div className="hidden dark:block">
                          <RenderStars rating={review.rating} isDarkThemeActive={true} />
                        </div>
                      </div>

                      {/* Clean Body Text */}
                      <p className="text-sm font-medium leading-relaxed italic line-clamp-4 mb-6 opacity-90 font-['Inter',sans-serif]">
                        "{review.comment}"
                      </p>
                    </div>

                    {/* Footer Details Layer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-[#52271E] dark:border-[#E8D8C7] mt-auto w-full">

                      {/* Avatar Node */}
                      <div className="w-9 h-9 rounded-full bg-[#F4E8DA] dark:bg-[#381A14] text-[#381A14] dark:text-[#F4E8DA] flex items-center justify-center font-black text-xs shrink-0 uppercase tracking-widest shadow-inner">
                        {review.userName?.charAt(0) || 'U'}
                      </div>

                      <div className="min-w-0 flex-1 font-['Inter',sans-serif]">
                        <p className="text-xs font-black truncate tracking-wide font-['Outfit',sans-serif]">
                          {review.userName}
                        </p>

                        {/* Luxury Premium Verified Badge Icon Wrapper */}
                        <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-[#F4E8DA]/10 dark:bg-[#381A14]/5 text-[#F4E8DA]/70 dark:text-[#381A14]/70 border border-[#F4E8DA]/5 dark:border-[#381A14]/5">
                          <ShieldCheck size={10} className="shrink-0 text-current" />
                          <span className="text-[9px] font-extrabold tracking-wider uppercase">Verified Buyer</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </SwiperSlide>
              ))}
            </Swiper>

            {/* Pagination Controls */}
            <div className="custom-swiper-pagination flex justify-center items-center gap-2.5 mt-12 mb-2 z-20"></div>
          </div>

          {/* Bottom Trigger Button */}
          {hasMore && (
            <div className="flex justify-center mt-6 pt-6 border-t border-[var(--border)] relative z-20">
              <button
                onClick={loadMore}
                disabled={isFetching}
                className="px-8 py-3.5 rounded-full bg-[var(--button-bg)] text-[var(--button-text)] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition active:scale-95 duration-200 shadow-md font-['Outfit',sans-serif]"
              >
                {isFetching ? 'Loading tokens...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Styled Inline Extenders */}
      <style>{`
        .custom-bullet {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--border-muted);
          opacity: 0.5;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-bullet-active {
          width: 24px;
          border-radius: 9999px;
          background-color: var(--primary);
          opacity: 1;
        }
      `}</style>
    </section>
  );
};

export default ReviewsHome;