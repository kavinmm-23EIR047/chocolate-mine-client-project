import React, { useState, useEffect } from 'react';
import { Star, StarHalf, MessageSquare, ExternalLink, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';
import bakeryImage from '../../assets/bakery.png';

const timeAgo = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return ''; // Invalid date
  
  const seconds = Math.floor((new Date() - parsedDate) / 1000);
  if (seconds < 0) return 'Recent';
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");
  
  interval = seconds / 604800;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " week ago" : " weeks ago");
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " min ago" : " mins ago");
  
  return "Just now";
};

const formatReviewDate = (review) => {
  const dateStr = review.reviewDateStr;
  const timeVal = review.time;

  // Try time field first
  if (timeVal) {
    const formatted = timeAgo(timeVal);
    if (formatted) return formatted;
  }

  // Fallback to reviewDateStr
  if (dateStr) {
    const isIso = dateStr.includes('T') && dateStr.endsWith('Z');
    const isNumberTimestamp = !isNaN(Date.parse(dateStr));
    
    if (isIso || isNumberTimestamp) {
      const formatted = timeAgo(dateStr);
      if (formatted) return formatted;
    }
    
    return dateStr;
  }

  return 'Recent';
};

const REVIEWS_LIMIT = 6;

const GOOGLE_MAPS_LINK = "https://www.google.com/maps/place/The+Chocolate+Mine+(Cakes+%26+Cafe)/@11.0040194,76.9724333,17z/data=!4m18!1m9!3m8!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!2sThe+Chocolate+Mine+(Cakes+%26+Cafe)!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth!3m7!1s0x3ba8591d53333f03:0xd0f9437d533a60fc!8m2!3d11.0043294!4d76.9745302!9m1!1b1!16s%2Fg%2F11vjy0ffth?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_SHARE_EXPERIENCE_LINK = "https://www.google.com/search?q=chocolate+mine&oq=chocolate+mine&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIKCAEQLhixAxiABDINCAIQLhixAxiABDINCAIQLhixAxiABBiKBTIHCAMQLhiABDIKCAQQABixAxiABDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDQ0MzJqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8#lrd=0x3ba8591d53333f03:0xd0f9437d533a60fc,3,,,,";

const DEFAULT_REVIEWS = [
  {
    _id: "default-1", authorName: "Jeevu Gayu", rating: 5,
    text: "Ordered a chocolate truffle cake which was delicious & loved by all and customised designed was too cute as expected! Staffs are polite and helpful.",
    reviewDateStr: "2 days ago"
  },
  {
    _id: "default-2", authorName: "Indhu Sravan Official", rating: 5,
    text: "Despite the short notice, the order was handled well. The 1.5 kg almond honey cake had a good taste, and the staff was polite and receptive to our inputs.",
    reviewDateStr: "a week ago"
  },
  {
    _id: "default-3", authorName: "Jaffar Jafa", rating: 5,
    text: "Thank you for making our special day even more special with your wonderful cake. It was absolutely fabulous, and everyone in my family loved it. The birthday girl especially was very happy.",
    reviewDateStr: "3 weeks ago"
  },
  {
    _id: "default-4", authorName: "Aishwarya Balan", rating: 5,
    text: "Thank you so much for the delicious cake. Everyone complements the look and taste of this cake on my son's 1st birthday party.",
    reviewDateStr: "a month ago"
  },
  {
    _id: "default-5", authorName: "Hashella Banu", rating: 5,
    text: "Cake serious ah romba super ah irunthuchu and really worth for Money and more over I really cannot forget how it was so perfectly baked and the softness is it was top notch. Really satisfied.",
    reviewDateStr: "2 months ago"
  },
  {
    _id: "default-6", authorName: "Saravana Kumar", rating: 5,
    text: "Good taste, beautiful designs, and quick response. The chocolate mousse and red velvet pastries are incredibly rich and fresh.",
    reviewDateStr: "3 months ago"
  }
];

const GoogleLogo = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const RenderStars = ({ rating, size = 16 }) => {
  const stars = [];
  const starFillColor = "#E2A829";
  const starStrokeColor = "#C6901D";

  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} size={size} fill={starFillColor} stroke={starStrokeColor} strokeWidth={1.5} />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarHalf key={i} size={size} fill={starFillColor} stroke={starStrokeColor} strokeWidth={1.5} />);
    } else {
      stars.push(<Star key={i} size={size} fill="none" stroke="#C6901D" strokeWidth={1.2} className="opacity-25" />);
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

const ReviewCard = ({ review, index }) => {
  const isLongText = review.text && review.text.length > 180;
  const [isExpanded, setIsExpanded] = useState(false);

  let avatarImg = review.profilePhotoUrl;
  if (review.reviewImageUrls && Array.isArray(review.reviewImageUrls)) {
    review.reviewImageUrls.forEach(img => {
      if (img.includes('/a/') || img.includes('/a-/') || img.match(/=s\d+-c/)) {
        if (!avatarImg) avatarImg = img;
      }
    });
  }

  return (
    <div className="bg-card dark:bg-[#1E0F0C] rounded-[2rem] p-6 md:p-8 border border-border/40 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between w-full h-[260px] md:h-[280px] relative select-none">
      {/* Background Watermark Quote */}
      <span className="absolute right-6 top-3 text-[5.5rem] font-serif font-black text-primary/5 dark:text-white/5 pointer-events-none select-none leading-none">“</span>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <RenderStars rating={review.rating} size={14} />
          <div className="flex items-center gap-1.5 opacity-90">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Google</span>
            <GoogleLogo size={14} />
          </div>
        </div>

        {/* Testimonial Text */}
        <div className="text-xs md:text-sm font-medium leading-relaxed text-foreground/80 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          <p className={isLongText && !isExpanded ? "line-clamp-4" : ""}>
            "{review.text}"
          </p>
          
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[9px] font-black tracking-widest uppercase text-primary hover:text-primary-hover transition-colors border-none bg-transparent cursor-pointer"
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="flex items-center gap-3.5 pt-4 border-t border-border/20 mt-4 shrink-0 font-sans">
        {avatarImg ? (
          <img src={avatarImg} alt={review.authorName} className="w-10 h-10 rounded-full shrink-0 object-cover border border-border/30" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center font-bold text-sm text-primary dark:text-[#E8D3CB] shrink-0 border border-primary/20">
            {review.authorName?.charAt(0) || 'U'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-heading truncate leading-tight mb-1">{review.authorName}</h4>
          <div className="flex items-center gap-2 mt-0.5 leading-none flex-wrap">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-success/15 text-success shrink-0">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Verified</span>
            <span className="text-[10px] text-muted/30">•</span>
            <span className="text-[10px] sm:text-xs font-medium text-muted/90 tracking-wide truncate">{formatReviewDate(review)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewsHome = () => {
  const [displayedReviews, setDisplayedReviews] = useState([]);
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

  return (
    <section className="py-16 md:py-24 w-full overflow-hidden relative bg-[#FAF5F2] dark:bg-[#120705] border-y border-[#E6D4CE] dark:border-[#2D1612] transition-colors duration-300">
      
      {/* ─── BACKGROUND AMBIENT GLOWS ─── */}
      <div className="absolute top-12 left-1/4 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[450px] h-[450px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── DECORATIVE SIDE BAKERY ILLUSTRATION (IN FRONT OVERLAY WITH LIGHT OPACITY) ─── */}
      <img
        src={bakeryImage}
        alt="Bakery Illustration"
        className="absolute top-1/2 -translate-y-1/2 right-0 w-64 md:w-80 lg:w-[480px] opacity-[0.12] md:opacity-[0.20] pointer-events-none z-30 drop-shadow-sm object-contain"
      />

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 max-w-[1440px] mx-auto relative z-10">
        
        {/* ─── CENTERED HEADER SECTION ─── */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card dark:bg-[#1E0F0C] border border-border/50 shadow-sm mb-4">
            <GoogleLogo size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              Official Google Reviews
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-heading leading-tight mb-4">
            Loved By Dessert Lovers
          </h2>

          <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed mb-6">
            Read real feedback from our customers visiting our Race Course Road Cafe in Coimbatore.
          </p>

          {/* Symmetrical Rating Summary Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-card dark:bg-[#1E0F0C] px-6 py-3 rounded-full border border-border/40 shadow-sm">
            <div className="flex items-center gap-1.5 border-r border-border/30 pr-4">
              <span className="text-xl md:text-2xl font-black text-heading leading-none">{avgRating}</span>
              <span className="text-[10px] font-bold text-muted">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center">
              <RenderStars rating={parseFloat(avgRating)} size={14} />
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold text-muted uppercase tracking-widest border-l border-border/30 pl-4 whitespace-nowrap">
              {totalReviews}+ verified ratings
            </span>
          </div>
        </div>

        {/* ─── FULL-WIDTH SWIPER SLIDER SECTION ─── */}
        <div className="relative group w-full">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            spaceBetween={24}
            slidesPerView={1.1}
            navigation={{
              prevEl: '.swiper-button-prev-reviews',
              nextEl: '.swiper-button-next-reviews'
            }}
            pagination={{ clickable: true, el: '.swiper-pagination-reviews' }}
            breakpoints={{
              640: { slidesPerView: 1.5, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 24 }
            }}
            className="!pb-12 !px-1"
          >
            {displayedReviews.map((review, idx) => (
              <SwiperSlide key={review._id || `slide-${idx}`} className="flex !h-auto">
                <ReviewCard review={review} index={idx} />
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Custom Navigation buttons (Desktop only) */}
          <button className="swiper-button-prev-reviews absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-card dark:bg-[#1E0F0C] hover:bg-primary/5 text-heading flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md border border-border/40 disabled:opacity-30 cursor-pointer hidden lg:flex">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button className="swiper-button-next-reviews absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-card dark:bg-[#1E0F0C] hover:bg-primary/5 text-heading flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md border border-border/40 disabled:opacity-30 cursor-pointer hidden lg:flex">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div className="swiper-pagination-reviews flex justify-center gap-1.5 mt-4" />
        </div>

        {/* ─── ACTION BUTTONS AT THE BOTTOM ─── */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 w-full max-w-md mx-auto px-4">
          <a
            href={GOOGLE_SHARE_EXPERIENCE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-button-text font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-primary/10 hover:brightness-110 active:scale-[0.98] select-none text-center cursor-pointer"
            style={{ backgroundColor: 'var(--button-bg)' }}
          >
            <MessageSquare size={14} />
            <span>Write a Review</span>
          </a>
          
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-primary/20 hover:border-primary text-heading font-black text-xs uppercase tracking-wider transition-all duration-300 hover:bg-primary/5 bg-card dark:bg-[#1E0F0C] shadow-sm active:scale-[0.98] select-none text-center cursor-pointer"
          >
            <ExternalLink size={14} className="text-muted" />
            <span>All Google Reviews</span>
          </a>
        </div>

      </div>

      <style>{`
        /* Swiper Bullet Customized Style */
        .swiper-pagination-reviews .swiper-pagination-bullet {
          background: var(--muted, #8B6B63);
          opacity: 0.25;
          width: 7px;
          height: 7px;
          transition: all 0.3s;
        }
        .swiper-pagination-reviews .swiper-pagination-bullet-active {
          opacity: 1;
          width: 18px;
          border-radius: 4px;
          background: var(--primary, #3D1F1A);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--muted, #8B6B63);
          border-radius: 4px;
        }
      `}</style>
    </section>
  );
};

export default ReviewsHome;