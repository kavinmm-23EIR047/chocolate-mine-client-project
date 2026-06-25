import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { useGetProductsQuery } from '../../product/productApi';
import ProductCard from '../../product/ProductCard';
import { CardSkeleton } from '../ui/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const Bestseller = ({ location }) => {
  const { data: productRes, isLoading } = useGetProductsQuery({
    bestseller: 'true',
    location,
    limit: 10,
  });

  const products = (productRes?.data || []).filter(p => p.bestseller === true);

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="responsive-section !py-6 lg:!py-10 border-b border-border/20 overflow-hidden">
      <div className="flex flex-col gap-5 lg:gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full px-4 sm:px-0 mb-6 lg:mb-8">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase text-heading">
              Our Bestsellers
            </h2>
          </div>

          {!isLoading && products.length > 0 && (
            <Link
              to="/shop?bestseller=true"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm font-black text-primary hover:text-primary-hover uppercase tracking-widest border-b-2 border-primary/20 pb-0.5 transition-all hover:gap-2 whitespace-nowrap mb-1"
            >
              View All <ArrowRight size={14} className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 inline ml-1" />
            </Link>
          )}
        </div>

        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 tv:gap-8 pb-4 lg:pb-6 scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={`best-skel-${i}`} className="snap-start shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px] tv:w-[360px]">
                <CardSkeleton />
              </div>
            ))
          ) : (
            products.map((p, i) => (
              <motion.div
                key={p._id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="snap-start shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px] tv:w-[360px] h-auto flex flex-col"
              >
                <ProductCard product={p} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Bestseller;
