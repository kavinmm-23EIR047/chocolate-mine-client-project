import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useGetProductsQuery } from '../../services/api/productApi';
import ProductCard from '../ProductCard';
import { CardSkeleton } from '../ui/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const Features = ({ location }) => {
  const { data: productRes, isLoading } = useGetProductsQuery({
    featured: 'true',
    location,
    limit: 4,
  });

  const products = productRes?.data || [];

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 border-b border-border/20">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10 text-[9px] font-black uppercase tracking-wider dark:bg-primary/10">
              <Sparkles size={10} fill="currentColor" /> Featured
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-heading uppercase">
              Featured Creations
            </h2>
            <p className="text-[11px] sm:text-xs text-muted font-medium uppercase tracking-wider">
              Handcrafted specialties & chef recommendations
            </p>
          </div>
          
          {!isLoading && products.length > 0 && (
            <Link
              to="/shop?featured=true"
              className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary-hover uppercase tracking-widest border-b-2 border-primary/20 pb-0.5 transition-all hover:gap-2.5"
            >
              View All <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <CardSkeleton key={`featured-skeleton-${i}`} />)
          ) : (
            products.map((p, i) => (
              <motion.div
                key={p._id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
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

export default Features;
