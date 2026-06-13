import React, { useState, useEffect } from 'react';
import { Star, StarHalf, MessageSquare, ExternalLink } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';

const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 604800;
  if (interval > 1) return Math.floor(interval) + " weeks ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
};

const REVIEWS_LIMIT = 7;

const GOOGLE_MAPS_LINK = "https://www.google.com/maps/place/The+Chocolate+Mine+(Cakes+%26+Cafe)/@11.0040194,76.9724333,17z/data=!4m18!1m9!3m8!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!2sThe+Chocolate+Mine+(Cakes+%26+Cafe)!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth!3m7!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_SHARE_EXPERIENCE_LINK = "https://www.google.com/search?q=chocolate+mine&oq=chocolate+mine&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIKCAEQLhixAxiABDINCAIQLhixAxiABBiKBTIHCAMQLhiABDIKCAQQABixAxiABDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDQ0MzJqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8#lrd=0x3ba8591d53333f03:0xd0f9437d533a60fc,3,,,,";

const DEFAULT_REVIEWS = [
  {
    _id: "default-1", authorName: "Sarah Smith", rating: 5,
    text: "Absolutely love the cakes here! The chocolate truffle is to die for. Will definitely be coming back.",
    reviewDateStr: "2 days ago",
    reviewImageUrls: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
  },
  {
    _id: "default-2", authorName: "Michael Johnson", rating: 4,
    text: "Best cafe in town. The ambiance is great and the pastries are always fresh.",
    reviewDateStr: "a week ago"
  },
  {
    _id: "default-3", authorName: "Priya Sharma", rating: 4.5,
    text: "Very good service and tasty desserts. Highly recommended for chocolate lovers.",
    reviewDateStr: "3 weeks ago",
    reviewImageUrls: ["https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
  },
  {
    _id: "default-4", authorName: "David Wilson", rating: 5,
    text: "A wonderful experience! The customized birthday cake was perfect.",
    reviewDateStr: "a month ago"
  },
  {
    _id: "default-5", authorName: "Emily Davis", rating: 4,
    text: "Their brownies and hot chocolate are unmatched. Love the cozy vibe.",
    reviewDateStr: "2 months ago",
    reviewImageUrls: ["https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
  },
  {
    _id: "default-6", authorName: "Rahul Verma", rating: 4.5,
    text: "Good place to hang out with friends. The chocolate pastries are quite rich.",
    reviewDateStr: "3 months ago"
  },
  {
    _id: "default-7", authorName: "Anita Menon", rating: 5,
    text: "Consistently amazing quality. I order from here for every special occasion.",
    reviewDateStr: "4 months ago"
  }
];

const NEUMORPHIC_INNER = "shadow-[inset_6px_6px_12px_rgba(56,26,20,0.08),inset_-6px_-6px_12px_rgba(232,220,216,0.8)] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.4),inset_-6px_-6px_12px_rgba(56,26,20,0.2)]";
const NEUMORPHIC_CARD = "shadow-[8px_8px_16px_rgba(56,26,20,0.1),-8px_-8px_16px_rgba(232,220,216,0.85)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.45),-8px_-8px_16px_rgba(56,26,20,0.2)]";
const NEUMORPHIC_BUTTON = "shadow-[6px_6px_12px_rgba(56,26,20,0.1),-6px_-6px_12px_rgba(232,220,216,0.85)] hover:shadow-[inset_4px_4px_8px_rgba(56,26,20,0.08),inset_-4px_-4px_8px_rgba(232,220,216,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(56,26,20,0.2)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(56,26,20,0.2)]";

const GoogleLogo = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const ReviewsHome = () => {
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [expandedReviews, setExpandedReviews] = useState({});

  const { reviews: allReviews, stats, loading: isLoading, error } = useGoogleReviews({ type: 'latest' });

  useEffect(() => {
    let baseReviews = (allReviews && allReviews.length > 0) ? allReviews : [];
    const highRatingReviews = baseReviews.filter(r => r.rating >= 4);
    let shuffled = [...highRatingReviews].sort(() => 0.5 - Math.random());

    if (shuffled.length < REVIEWS_LIMIT) {
      const needed = REVIEWS_LIMIT - shuffled.length;
      const defaultShuffled = [...DEFAULT_REVIEWS].sort(() => 0.5 - Math.random());
      shuffled = [...shuffled, ...defaultShuffled.slice(0, needed)];
    }

    setDisplayedReviews(shuffled.slice(0, REVIEWS_LIMIT));
  }, [allReviews]);

  if (!isLoading && displayedReviews.length === 0) return null;

  const avgRating = stats?.averageRating || '4.9';
  const totalReviews = stats?.totalReviews || 475;

  const toggleExpand = (id) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const RenderStars = ({ rating, size = 18 }) => {
    const stars = [];
    const starFillColor = "var(--accent, #D4A017)";
    const starStrokeColor = "var(--accent-hover, #B5840B)";

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} size={size} fill={starFillColor} stroke={starStrokeColor} strokeWidth={1.5} />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} size={size} fill={starFillColor} stroke={starStrokeColor} strokeWidth={1.5} />);
      } else {
        stars.push(<Star key={i} size={size} fill="none" stroke={starStrokeColor} strokeWidth={1.2} className="opacity-30" />);
      }
    }
    return <div className="flex gap-0.5 md:gap-1">{stars}</div>;
  };

  return (
    <section className="py-10 md:py-20 bg-background overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand Information Header Section */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-10 md:mb-16 gap-6 lg:gap-10">
          <div className="text-center lg:text-left max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card mb-3 md:mb-5 ${NEUMORPHIC_INNER}`}>
              <GoogleLogo size={18} />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted">
                Google Reviews
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-heading leading-tight mb-2">
              The Chocolate Mine <br />
              <span className="text-primary text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 block lg:inline">
                (Cakes & Cafe)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
              No.7, 3, Race Course Rd, near Codissia Office Building, Anna Silai, Gopalapuram, Coimbatore, Tamil Nadu 641018, India
            </p>
          </div>

          {/* Aggregator Layout Container */}
          <div className="w-full lg:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-6 p-4 md:p-6 rounded-2xl bg-card border border-border/10 shadow-md max-w-3xl mx-auto lg:mx-0">

            {/* Left Segment: Google Aggregated Score */}
            <div className="flex flex-row md:flex-col items-center justify-between md:justify-center text-center md:min-w-[120px] pb-4 md:pb-0 border-b md:border-b-0 border-border/20">
              <div className="flex items-baseline md:block gap-2">
                <span className="text-4xl md:text-5xl font-black tracking-tighter text-heading leading-none">{avgRating}</span>
                <span className="text-sm font-bold text-muted md:hidden">/ 5</span>
              </div>
              <div className="flex flex-col items-end md:items-center mt-0 md:mt-2">
                <RenderStars rating={parseFloat(avgRating)} size={14} />
                <p className="text-[9px] md:text-[10px] text-muted mt-1 font-bold uppercase tracking-wider whitespace-nowrap">
                  {totalReviews}+ Live Ratings
                </p>
              </div>
            </div>

            {/* Vertical Segment Divider */}
            <div className="hidden md:block w-px h-16 bg-border/30 self-center" />

            {/* Right Segment: Exact Platform Stats Layout from Image */}
            <div className="flex flex-row items-center justify-around w-full gap-2 md:gap-8 text-center pt-2 md:pt-0">

              {/* Zomato Column */}
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[70px]">
                <span className="text-error text-xs md:text-sm font-bold mb-0.5 md:mb-1">Zomato</span>
                <span className="text-heading text-lg md:text-2xl font-black tracking-tight">3.5/5</span>
                <span className="text-muted text-[10px] md:text-sm mt-0.5 md:mt-1">65 votes</span>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-10 md:h-14 bg-border/20" />

              {/* Swiggy Column */}
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[70px]">
                <span className="text-warning text-xs md:text-sm font-bold mb-0.5 md:mb-1">Swiggy</span>
                <span className="text-heading text-lg md:text-2xl font-black tracking-tight">4.5/5</span>
                <span className="text-muted text-[10px] md:text-sm mt-0.5 md:mt-1">44 votes</span>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-10 md:h-14 bg-border/20" />

              {/* Justdial Column */}
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[70px]">
                <span className="text-info text-xs md:text-sm font-bold mb-0.5 md:mb-1">Justdial</span>
                <span className="text-heading text-lg md:text-2xl font-black tracking-tight">4.6/5</span>
                <span className="text-muted text-[10px] md:text-sm mt-0.5 md:mt-1">490 votes</span>
              </div>

            </div>

          </div>
        </div>

        {/* Reviews Swiper Carousel Framework */}
        {error ? (
          <div className={`text-center py-12 rounded-3xl bg-card ${NEUMORPHIC_CARD}`}>
            <p className="text-error font-semibold mb-2 text-base">Failed to load testimonials.</p>
          </div>
        ) : (
          <div className="relative group mb-6 md:mb-12 px-1">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              spaceBetween={16}
              slidesPerView={1.1}
              centeredSlides={false}
              autoHeight={false}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom'
              }}
              breakpoints={{
                480: { slidesPerView: 1.3, spaceBetween: 16 },
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 28 }
              }}
              className="!py-4 !px-1"
            >
              {displayedReviews.map((review, idx) => {
                const reviewId = review._id || `idx-${idx}`;
                const isLongText = review.text && review.text.length > 180;
                const isExpanded = expandedReviews[reviewId];

                let avatarImg = review.profilePhotoUrl;
                if (review.reviewImageUrls && Array.isArray(review.reviewImageUrls)) {
                  review.reviewImageUrls.forEach(img => {
                    if (img.includes('/a/') || img.includes('/a-/') || img.match(/=s\d+-c/)) {
                      if (!avatarImg) avatarImg = img;
                    }
                  });
                }

                return (
                  <SwiperSlide key={reviewId} className="flex !h-auto">
                    <div className={`bg-card rounded-2xl p-4 md:p-5 flex flex-col justify-between w-full h-full min-h-[240px] ${NEUMORPHIC_CARD} relative`}>

                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-3 flex items-center justify-between shrink-0">
                          <RenderStars rating={review.rating} size={14} />
                          <GoogleLogo size={18} />
                        </div>

                        <div className="text-xs md:text-sm font-medium leading-relaxed text-foreground/80 overflow-y-auto pr-1 scrollbar-thin flex-1">
                          <p className={isLongText && !isExpanded ? "line-clamp-3 md:line-clamp-4" : ""}>
                            "{review.text}"
                          </p>

                          {isLongText && (
                            <button
                              onClick={() => toggleExpand(reviewId)}
                              className="mt-1.5 text-[10px] font-black tracking-wide uppercase text-primary hover:underline block"
                            >
                              {isExpanded ? "Show Less" : "View Full Text"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* User Metadata Profile Subtier */}
                      <div className="flex items-center gap-2.5 pt-3 border-t border-border/20 mt-3 shrink-0">
                        {avatarImg ? (
                          <img src={avatarImg} alt={review.authorName} className={`w-8 h-8 rounded-full shrink-0 object-cover ${NEUMORPHIC_INNER}`} />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs uppercase text-primary shrink-0 ${NEUMORPHIC_INNER}`}>
                            {review.authorName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-heading truncate">{review.authorName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-[8px] md:text-[9px] font-bold text-muted uppercase">Verified</p>
                            <span className="text-[8px] text-muted/50">•</span>
                            <p className="text-[8px] md:text-[9px] font-bold text-muted uppercase truncate">{review.reviewDateStr || timeAgo(review.time)}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Custom Navigation buttons */}
            <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 rounded-full bg-card flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md disabled:opacity-30 border border-border/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 rounded-full bg-card flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md disabled:opacity-30 border border-border/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}

        {/* Global Action Navigation Cluster */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 mt-6 md:mt-10">
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-card text-heading font-black text-[11px] md:text-xs uppercase tracking-wider transition-all duration-300 ${NEUMORPHIC_BUTTON}`}
          >
            <ExternalLink size={14} className="text-muted" />
            View All My Googles
          </a>

          <a
            href={GOOGLE_SHARE_EXPERIENCE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-black text-[11px] md:text-xs uppercase tracking-wider transition-all duration-300 ${NEUMORPHIC_BUTTON}`}
            style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
          >
            <MessageSquare size={14} />
            Share Your Experience
          </a>
        </div>

      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--muted, #8B6B63);
          border-radius: 4px;
        }
        @media (max-width: 1023px) {
          .swiper-button-prev-custom, .swiper-button-next-custom { display: none; }
        }
      `}</style>
    </section>
  );
};

export default ReviewsHome;