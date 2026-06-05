import React from 'react';
import { Link } from 'react-router-dom';

const BottomBanner = () => {
  return (
    <section className="rounded-2xl overflow-hidden relative shadow-lg border border-border/20 h-44 sm:h-52">
      <img
        src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1400&q=80"
        alt="The Chocolate Mine"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tighter">
          Freshly Baked. Securely Paid.
        </h3>
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          Coimbatore · Pan India Delivery · Pure Veg & Eggless
        </p>
        <Link
          to="/shop"
          className="mt-4 px-6 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-all"
        >
          Shop Now →
        </Link>
      </div>
    </section>
  );
};

export default BottomBanner;
