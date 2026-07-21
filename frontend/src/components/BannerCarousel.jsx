import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import Button from './ui/Button';
import ImageWithSkeleton from './ui/ImageWithSkeleton';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const BannerCarousel = () => {
  const banners = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600&h=600&fit=crop",
      title: "Indulge in Luxury Belgian Truffles",
      subtitle: "Handcrafted with the finest cacao for your special moments.",
      tag: "Limited Edition"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=1600&h=600&fit=crop",
      title: "Bespoke Cakes for Every Occasion",
      subtitle: "Customized to your vision, baked to perfection.",
      tag: "Freshly Baked"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?q=80&w=1600&h=600&fit=crop",
      title: "Midnight Surprises, Delivered.",
      subtitle: "Surprise your loved ones with a sweet treat at 12 AM.",
      tag: "24/7 Delivery"
    }
  ];

  return (
    <div className="w-full">
      <Swiper
        effect="fade"
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        className="h-[500px] sm:h-[600px] lg:h-[700px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full h-full">
              <ImageWithSkeleton
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-footer/70 via-footer/30 to-transparent flex flex-col justify-center px-6 sm:px-16 lg:px-24">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-2xl"
                >
                  <span className="bg-secondary/80 backdrop-blur-md text-button-text text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl mb-6 inline-block uppercase tracking-[0.3em]">
                    {banner.tag}
                  </span>
                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-footer-text mb-6 leading-tight tracking-tighter">
                    {banner.title}
                  </h2>
                  <p className="text-sm sm:text-xl text-footer-text/80 mb-10 font-medium leading-relaxed max-w-lg">
                    {banner.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="bg-primary text-button-text hover:bg-primary-hover transition-all shadow-2xl">
                      SHOP COLLECTION
                    </Button>
                    <Button variant="outline" size="lg" className="border-footer-text/30 text-footer-text hover:bg-footer-text/10 backdrop-blur-sm">
                      LEARN MORE
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BannerCarousel;
