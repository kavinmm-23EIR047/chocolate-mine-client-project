import React from 'react';
import { Star, Quote, ThumbsUp } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

const NEUMORPHIC_INNER = "shadow-[inset_6px_6px_12px_rgba(56,26,20,0.08),inset_-6px_-6px_12px_rgba(232,220,216,0.8)] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.4),inset_-6px_-6px_12px_rgba(56,26,20,0.2)]";
const NEUMORPHIC_CARD = "shadow-[8px_8px_16px_rgba(56,26,20,0.1),-8px_-8px_16px_rgba(232,220,216,0.85)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.45),-8px_-8px_16px_rgba(56,26,20,0.2)]";

const dummyReviews = [
  {
    _id: 'd1',
    authorName: 'Priya Sharma',
    rating: 5,
    text: 'Absolutely the best chocolate cake I have ever had! The truffle was incredibly rich and moist. Everyone at the party asked where it was from.',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'd2',
    authorName: 'Rahul Verma',
    rating: 5,
    text: 'Ordered a custom theme cake for my son\'s 5th birthday. The attention to detail was amazing and it tasted as good as it looked! Highly recommended.',
    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'd3',
    authorName: 'Anita Menon',
    rating: 4,
    text: 'Great ambiance in the cafe and the pastries are fresh. The black forest slice is my go-to order. Service could be a tiny bit faster on weekends.',
    time: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'd4',
    authorName: 'Vikram Singh',
    rating: 5,
    text: 'The premium hampers make excellent corporate gifts. I ordered 50 boxes for Diwali and the packaging was super elegant.',
    time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'd5',
    authorName: 'Meera Reddy',
    rating: 5,
    text: 'Their eggless options are surprisingly good! Usually eggless cakes are dense, but theirs are incredibly light and fluffy.',
    time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const GoogleLogo = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--accent, #D4A017)" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--muted, #8B6B63)" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--accent-hover, #C4901A)" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--border-dark, #9A7A72)" />
  </svg>
);

const DummyReviewsPlaceholder = () => {
  const RenderStars = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            fill={i < rating ? "var(--accent, #D4A017)" : "none"} 
            stroke={i < rating ? "none" : "var(--accent, #D4A017)"} 
            strokeWidth={1.5}
            className={i >= rating ? "opacity-30" : ""}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative mt-8">
      <div className="mb-4 text-center">
        <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold inline-block border border-amber-200">
          Sample Reviews (Awaiting Google Sync)
        </span>
      </div>
      
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
        {dummyReviews.map((review) => (
          <SwiperSlide key={review._id} className="h-auto">
            <div className={`bg-card rounded-2xl p-6 flex flex-col justify-between h-full ${NEUMORPHIC_CARD} transition-all duration-300 opacity-90`}>
              <Quote size={64} className="absolute bottom-3 right-3 opacity-5 text-foreground pointer-events-none" />

              <div>
                <div className="mb-5 flex items-center justify-between">
                  <RenderStars rating={review.rating} />
                  <GoogleLogo size={20} />
                </div>

                <p className="text-base font-medium leading-relaxed text-foreground/80 mb-6 line-clamp-4">
                  "{review.text}"
                </p>
              </div>

              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/30">
                <div className={`w-11 h-11 rounded-full bg-card flex items-center justify-center font-black text-base uppercase text-primary shrink-0 ${NEUMORPHIC_INNER}`}>
                  {review.authorName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-heading truncate">
                    {review.authorName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ThumbsUp size={10} className="text-primary" />
                    <p className="text-[9px] font-bold tracking-wide uppercase text-muted">
                      Verified Reviewer
                    </p>
                    <span className="text-[9px] text-muted/40">•</span>
                    <p className="text-[9px] font-medium text-muted">
                      {new Date(review.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <div className="custom-swiper-pagination flex justify-center items-center gap-3 mt-10"></div>
    </div>
  );
};

export default DummyReviewsPlaceholder;
