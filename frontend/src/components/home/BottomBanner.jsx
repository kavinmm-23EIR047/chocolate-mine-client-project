import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Cake, Star, ShieldCheck, Leaf } from 'lucide-react';

const BottomBanner = () => (
  <section className="relative w-full rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl group border border-white/10 my-6 sm:my-10">
    {/* Background Image with better aspect ratio on mobile */}
    <div className="relative w-full pt-[60%] sm:pt-[40%] md:pt-[30%]">
      <img
        src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1400"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        alt="Fresh baked goods"
      />
    </div>

    {/* Gradient Overlay - improved for text readability */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 flex flex-col justify-center px-5 sm:px-10">

      {/* Decorative Icons in Corners (cakes side corner style) */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 opacity-60 group-hover:opacity-100 transition-opacity">
        <Cake size={24} className="text-white/80 drop-shadow-md sm:w-8 sm:h-8" />
      </div>
      <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 opacity-60 group-hover:opacity-100 transition-opacity rotate-12">
        <Star size={20} className="text-yellow-300/80 drop-shadow-md sm:w-6 sm:h-6" />
      </div>
      <div className="absolute top-1/2 left-2 -translate-y-1/2 hidden sm:block opacity-40">
        <Leaf size={28} className="text-white/50" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit mb-3 sm:mb-6">
          <Sparkles size={12} className="text-yellow-400 sm:w-3 sm:h-3" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase text-white tracking-[0.2em] sm:tracking-[0.25em]">
            Premium Quality
          </span>
        </div>

        {/* Heading - responsive font sizes */}
        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight sm:leading-[1.2] mb-3 sm:mb-6">
          Freshly Baked.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">
            Securely Delivered.
          </span>
        </h3>

        {/* CTA Button - touch friendly on mobile */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-8 sm:py-4 bg-white text-black rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:gap-3 sm:hover:gap-4 transition-all shadow-lg active:scale-95"
        >
          Explore Collection
          <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
        </Link>
      </div>
    </div>
  </section>
);

export default BottomBanner;