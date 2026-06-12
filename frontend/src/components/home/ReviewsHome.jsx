import React, { useState, useEffect } from 'react';
import { Star, StarHalf, ShieldCheck, Quote, ThumbsUp, Award, Users } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';

const REVIEWS_PER_PAGE = 6;

// Neumorphic shadows using theme cream & brown colors (no white)
const NEUMORPHIC_OUTER = "shadow-[10px_10px_20px_rgba(56,26,20,0.12),-10px_-10px_20px_rgba(232,220,216,0.9)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.5),-10px_-10px_20px_rgba(56,26,20,0.25)]";
const NEUMORPHIC_INNER = "shadow-[inset_6px_6px_12px_rgba(56,26,20,0.08),inset_-6px_-6px_12px_rgba(232,220,216,0.8)] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.4),inset_-6px_-6px_12px_rgba(56,26,20,0.2)]";
const NEUMORPHIC_CARD = "shadow-[8px_8px_16px_rgba(56,26,20,0.1),-8px_-8px_16px_rgba(232,220,216,0.85)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.45),-8px_-8px_16px_rgba(56,26,20,0.2)]";
const NEUMORPHIC_BUTTON = "shadow-[6px_6px_12px_rgba(56,26,20,0.1),-6px_-6px_12px_rgba(232,220,216,0.85)] hover:shadow-[inset_4px_4px_8px_rgba(56,26,20,0.08),inset_-4px_-4px_8px_rgba(232,220,216,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(56,26,20,0.2)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(56,26,20,0.2)]";

// Google Logo - Using theme gold/brown colors
const GoogleLogo = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--accent, #D4A017)" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--muted, #8B6B63)" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--accent-hover, #C4901A)" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--border-dark, #9A7A72)" />
  </svg>
);

const ReviewsHome = () => {
  const [page, setPage] = useState(1);
  const [displayedReviews, setDisplayedReviews] = useState([]);

  const { reviews: allReviews, stats, loading: isLoading, refetch, error } = useGoogleReviews({ type: 'latest' });

  useEffect(() => {
    const start = 0;
    const end = page * REVIEWS_PER_PAGE;
    if (allReviews) {
      setDisplayedReviews(allReviews.slice(start, end));
    }
  }, [allReviews, page]);

  const hasMore = displayedReviews.length < allReviews.length;

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (!isLoading && allReviews.length === 0) return null;

  const avgRating = stats?.averageRating || '5.0';
  const totalReviews = stats?.totalReviews || 0;

  // Stars using theme accent color
  const RenderStars = ({ rating, size = 18 }) => {
    const stars = [];
    const starColor = "var(--accent, #D4A017)";

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} size={size} fill={starColor} stroke="none" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} size={size} fill={starColor} stroke="none" />);
      } else {
        stars.push(<Star key={i} size={size} fill="none" stroke={starColor} strokeWidth={1.5} className="opacity-30" />);
      }
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`bg-card rounded-2xl p-6 h-64 animate-pulse ${NEUMORPHIC_CARD}`}>
          <div className="flex justify-between mb-4">
            <div className="h-4 bg-border rounded w-1/3" />
            <div className="h-6 w-6 bg-border rounded-full" />
          </div>
          <div className="h-3 bg-border-muted rounded w-3/4 mb-3" />
          <div className="h-3 bg-border-muted rounded w-full mb-3" />
          <div className="h-3 bg-border-muted rounded w-1/2" />
          <div className="flex items-center gap-3 mt-6 pt-3 border-t border-border/30">
            <div className="w-10 h-10 rounded-full bg-border" />
            <div className="flex-1">
              <div className="h-3 bg-border rounded w-24 mb-2" />
              <div className="h-2 bg-border-muted rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-20 bg-background">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section - Larger & Clearer */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-10">

          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-card mb-6 ${NEUMORPHIC_INNER}`}>
              <GoogleLogo size={18} />
              <span className="text-xs font-black uppercase tracking-wider text-muted">
                Google Reviews
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-heading leading-tight">
              Loved by <br />
              <span className="text-primary relative inline-block">
                Our Customers
                <svg className="absolute -bottom-2 left-0 w-full h-2" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0,5 Q25,0 50,5 T100,5 T150,5 T200,5" stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.3" />
                </svg>
              </span>
            </h2>
            <p className="text-base font-medium text-muted tracking-wide mt-5 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Discover why people choose us. Authentic stories and experiences from our wonderful community.
            </p>
          </div>

          {/* Stats Card - Neumorphic */}
          <div className={`flex flex-col sm:flex-row items-center gap-8 px-10 py-8 rounded-3xl bg-card ${NEUMORPHIC_CARD}`}>
            <div className="text-center">
              <span className="text-6xl font-black tracking-tighter text-heading">{avgRating}</span>
              <div className="flex gap-1 mt-2 justify-center">
                <RenderStars rating={parseFloat(avgRating)} size={18} />
              </div>
              <p className="text-xs text-muted mt-3 font-bold uppercase tracking-wider">
                {totalReviews}+ Verified Reviews
              </p>
            </div>

            <div className="hidden sm:block w-px h-20 bg-border" />
            <div className="sm:hidden h-px w-20 bg-border my-2" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${NEUMORPHIC_INNER}`}>
                  <Award size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Rating</p>
                  <p className="text-sm font-black text-heading">Excellent 4.5+</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${NEUMORPHIC_INNER}`}>
                  <Users size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Community</p>
                  <p className="text-sm font-black text-heading">Happy Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        {error ? (
          <div className={`text-center py-16 rounded-3xl bg-card ${NEUMORPHIC_CARD}`}>
            <p className="text-error font-semibold mb-3 text-base">Failed to load testimonials.</p>
            <button
              onClick={() => refetch()}
              className="text-primary font-bold underline decoration-2 text-sm hover:no-underline transition"
            >
              Try again
            </button>
          </div>
        ) : isLoading && allReviews.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <div className="relative">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={28}
              slidesPerView={1}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{
                el: '.custom-swiper-pagination',
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
              }}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom',
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 }
              }}
              className="!py-6 !px-2"
            >
              {displayedReviews.map((review, idx) => (
                <SwiperSlide key={review._id || idx} className="h-auto">
                  {/* Neumorphic Review Card */}
                  <div className={`bg-card rounded-2xl p-6 flex flex-col justify-between h-full ${NEUMORPHIC_CARD} transition-all duration-300`}>

                    {/* Decorative Quote */}
                    <Quote size={64} className="absolute bottom-3 right-3 opacity-5 text-foreground pointer-events-none" />

                    {/* Header with Stars & Logo */}
                    <div>
                      <div className="mb-5 flex items-center justify-between">
                        <RenderStars rating={review.rating} size={16} />
                        <GoogleLogo size={20} />
                      </div>

                      {/* Review Text - Larger & Clearer */}
                      <p className="text-base font-medium leading-relaxed text-foreground/80 mb-6 line-clamp-4">
                        "{review.text}"
                      </p>
                    </div>

                    {/* User Info Section */}
                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/30">
                      {/* Avatar - Neumorphic pressed style */}
                      {review.profilePhotoUrl ? (
                        <img src={review.profilePhotoUrl} alt={review.authorName} className={`w-11 h-11 rounded-full shrink-0 ${NEUMORPHIC_INNER}`} />
                      ) : (
                        <div className={`w-11 h-11 rounded-full bg-card flex items-center justify-center font-black text-base uppercase text-primary shrink-0 ${NEUMORPHIC_INNER}`}>
                          {review.authorName?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-heading truncate">
                          {review.authorName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <ThumbsUp size={10} className="text-primary" />
                          <p className="text-[9px] font-bold tracking-wide uppercase text-muted">
                            Verified Reviewer
                          </p>
                          {review.time && (
                            <>
                              <span className="text-[9px] text-muted/40">•</span>
                              <p className="text-[9px] font-medium text-muted">
                                {new Date(review.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-card flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-heading">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-card flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-heading">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Pagination */}
            <div className="custom-swiper-pagination flex justify-center items-center gap-3 mt-10"></div>

            {/* Read More on Google Button - Neumorphic Style */}
            <div className="flex justify-center mt-12">
              <a
                href="https://www.google.com/maps/place/The+Chocolate+Mine+(Cakes+%26+Cafe)/@11.0043294,76.9719553,17z/data=!4m18!1m9!3m8!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!2sThe+Chocolate+Mine+(Cakes+%26+Cafe)!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth!3m7!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth?entry=ttu&g_ep=EgoyMDI2MDYwOS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-10 py-4 rounded-full bg-card text-heading text-sm font-black uppercase tracking-wider transition-all duration-300 ${NEUMORPHIC_BUTTON} flex items-center gap-2`}
              >
                <GoogleLogo size={16} />
                View All Reviews on Google
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Pagination & Navigation Styles - Theme Based */}
      <style>{`
        /* Pagination Bullets */
        .custom-swiper-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
        }
        
        .custom-swiper-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--border-card);
          opacity: 0.5;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: inset 2px 2px 4px rgba(56, 26, 20, 0.08), inset -2px -2px 4px rgba(232, 220, 216, 0.6);
        }
        
        .dark .custom-swiper-pagination .swiper-pagination-bullet {
          box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(56, 26, 20, 0.2);
        }
        
        .custom-swiper-pagination .swiper-pagination-bullet-active {
          width: 28px;
          border-radius: 6px;
          background-color: var(--primary);
          opacity: 1;
          box-shadow: 2px 2px 4px rgba(56, 26, 20, 0.1), -2px -2px 4px rgba(232, 220, 216, 0.7);
        }
        
        .dark .custom-swiper-pagination .swiper-pagination-bullet-active {
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), -2px -2px 4px rgba(56, 26, 20, 0.2);
        }
        
        /* Navigation Buttons */
        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          background-color: var(--card);
          box-shadow: 6px 6px 12px rgba(56, 26, 20, 0.1), -6px -6px 12px rgba(232, 220, 216, 0.85);
          transition: all 0.3s ease;
        }
        
        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          box-shadow: inset 4px 4px 8px rgba(56, 26, 20, 0.08), inset -4px -4px 8px rgba(232, 220, 216, 0.7);
          transform: scale(0.98);
        }
        
        .dark .swiper-button-prev-custom,
        .dark .swiper-button-next-custom {
          box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.4), -6px -6px 12px rgba(56, 26, 20, 0.2);
        }
        
        .dark .swiper-button-prev-custom:hover,
        .dark .swiper-button-next-custom:hover {
          box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -4px -4px 8px rgba(56, 26, 20, 0.2);
        }
        
        /* Hide navigation buttons on mobile */
        @media (max-width: 768px) {
          .swiper-button-prev-custom,
          .swiper-button-next-custom {
            display: none;
          }
        }
        
        /* Show navigation on hover of container */
        .relative:hover .swiper-button-prev-custom,
        .relative:hover .swiper-button-next-custom {
          opacity: 1;
        }
        
        .swiper-button-prev-custom {
          left: -16px;
        }
        
        .swiper-button-next-custom {
          right: -16px;
        }
      `}</style>
    </section>
  );
};

export default ReviewsHome;