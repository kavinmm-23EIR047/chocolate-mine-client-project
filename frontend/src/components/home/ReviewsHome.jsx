import React, { useState, useEffect } from 'react';
import { Star, StarHalf, ShieldCheck, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import { useGetLatestReviewsQuery } from '../../services/api/reviewApi';

const REVIEWS_PER_PAGE = 6;

// Neumorphic Shadow Utilities (Adapts automatically to light/dark mode if your root variables support it)
const NEUMORPHIC_OUTER = "shadow-[8px_8px_16px_rgba(0,0,0,0.06),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.04)]";
const NEUMORPHIC_INNER = "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.06),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.04)]";

// Google G Logo SVG
const GoogleLogo = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const ReviewsHome = () => {
  const [page, setPage] = useState(1);
  const [displayedReviews, setDisplayedReviews] = useState([]);

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
    : '5.0';

  // Stars rendered with a distinct Google Gold color for authenticity
  const RenderStars = ({ rating }) => {
    const stars = [];
    const starColor = "#FBBC04";

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} size={15} fill={starColor} stroke="none" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} size={15} fill={starColor} stroke="none" />);
      } else {
        stars.push(<Star key={i} size={15} fill="none" stroke={starColor} strokeWidth={1.5} className="opacity-30" />);
      }
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`bg-[var(--surface)] rounded-3xl p-8 h-56 animate-pulse ${NEUMORPHIC_OUTER}`}>
          <div className="flex justify-between mb-4">
            <div className="h-4 bg-[var(--border)] rounded w-1/3" />
            <div className="h-6 w-6 bg-[var(--border)] rounded-full" />
          </div>
          <div className="h-3 bg-[var(--border-muted)] rounded w-3/4 mb-3" />
          <div className="h-3 bg-[var(--border-muted)] rounded w-full mb-3" />
          <div className="h-3 bg-[var(--border-muted)] rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 bg-[var(--background)] font-['Outfit',sans-serif] relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Panel */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-10">

          <div className="text-center lg:text-left">
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--surface)] mb-6 transition-transform hover:scale-105 cursor-default ${NEUMORPHIC_OUTER}`}>
              <GoogleLogo size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--heading)]">
                Google Reviews
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--heading)] leading-tight">
              Loved by <br /> <span className="text-[var(--primary)]">Our Customers</span>
            </h2>
            <p className="text-sm font-medium text-[var(--muted)] tracking-wide mt-4 max-w-md mx-auto lg:mx-0">
              Discover why people choose us. Authentic stories and experiences from our wonderful community.
            </p>
          </div>

          {/* Neumorphic Stats Scoreboard */}
          <div className={`flex flex-col sm:flex-row items-center gap-6 px-10 py-8 rounded-[2rem] bg-[var(--surface)] border border-[var(--border)]/30 ${NEUMORPHIC_OUTER}`}>
            <div className="text-center">
              <span className="text-6xl font-black tracking-tighter text-[var(--heading)]">{avgRating}</span>
              <div className="flex gap-1 mt-2 justify-center">
                <RenderStars rating={parseFloat(avgRating)} />
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-3 font-bold uppercase tracking-[0.2em]">
                {allReviews.length}+ verified reviews
              </p>
            </div>

            <div className="hidden sm:block w-px h-24 bg-[var(--border)] opacity-60 rounded-full" />
            <div className="sm:hidden h-px w-24 bg-[var(--border)] opacity-60 rounded-full my-2" />

            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Excellent</p>
              <p className="text-2xl font-black text-[var(--heading)] tracking-tight my-1">Trust & Quality</p>
              <div className="inline-flex items-center gap-1.5 mt-1">
                <ShieldCheck size={14} className="text-[var(--primary)]" />
                <p className="text-[11px] font-semibold text-[var(--foreground)]">100% Authentic</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stream Area */}
        {error ? (
          <div className={`text-center py-12 rounded-3xl bg-[var(--surface)] ${NEUMORPHIC_INNER}`}>
            <p className="text-[var(--error)] font-semibold mb-3">Failed to load Google testimonials.</p>
            <button onClick={() => refetch()} className="text-[var(--primary)] font-bold underline decoration-2 text-sm">
              Try again
            </button>
          </div>
        ) : isLoading && allReviews.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <div className="relative">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={32}
              slidesPerView={1}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              pagination={{
                el: '.custom-swiper-pagination',
                clickable: true,
                bulletClass: 'neumorphic-bullet',
                bulletActiveClass: 'neumorphic-bullet-active',
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 }
              }}
              className="!py-6 !px-2"
            >
              {displayedReviews.map((review, idx) => (
                <SwiperSlide key={review._id || idx} className="h-auto !flex">
                  {/* Neumorphic Review Card */}
                  <div className={`w-full bg-[var(--surface)] rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-300 relative group border border-white/10 dark:border-white/5 ${NEUMORPHIC_OUTER} hover:-translate-y-2`}>

                    <Quote size={80} className="absolute -bottom-4 -right-4 opacity-[0.04] transform -rotate-12 pointer-events-none text-[var(--foreground)]" />

                    <div>
                      <div className="mb-6 flex items-center justify-between">
                        <RenderStars rating={review.rating} />
                        <GoogleLogo size={20} />
                      </div>

                      <p className="text-[15px] font-medium leading-relaxed text-[var(--foreground)] opacity-80 mb-8 line-clamp-4">
                        "{review.comment}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mt-auto w-full pt-4">
                      {/* Pressed/Inset Avatar */}
                      <div className={`w-11 h-11 rounded-full bg-[var(--surface)] flex items-center justify-center font-black text-sm shrink-0 uppercase text-[var(--primary)] ${NEUMORPHIC_INNER}`}>
                        {review.userName?.charAt(0) || 'U'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black truncate text-[var(--heading)]">
                          {review.userName}
                        </p>
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--muted)] mt-0.5">
                          Verified User
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Neumorphic Pagination */}
            <div className="custom-swiper-pagination flex justify-center items-center gap-4 mt-10 z-20"></div>

            {/* Neumorphic Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className={`px-10 py-4 rounded-full bg-[var(--surface)] text-[var(--heading)] text-xs font-black uppercase tracking-[0.2em] transition-all duration-200 border border-[var(--border)]/30 
                    ${NEUMORPHIC_OUTER} hover:text-[var(--primary)] active:shadow-none active:${NEUMORPHIC_INNER} disabled:opacity-50`}
                >
                  {isFetching ? 'Loading...' : 'Read More Reviews'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styled Inline Neumorphic Swiper Dots */}
      <style>{`
        .neumorphic-bullet {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--surface);
          box-shadow: 3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        @media (prefers-color-scheme: dark) {
          .neumorphic-bullet {
            box-shadow: 3px 3px 6px rgba(0,0,0,0.5), -3px -3px 6px rgba(255,255,255,0.05);
          }
        }
        .neumorphic-bullet-active {
          background-color: var(--primary);
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.2);
          transform: scale(1.2);
        }
      `}</style>
    </section>
  );
};

export default ReviewsHome;