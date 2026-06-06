import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useGetProductsQuery } from '../../product/productApi';
import ProductCard from '../../product/ProductCard';
import { CardSkeleton } from '../ui/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

const ProductGrid = ({ query, activeCategory, deliveryCity }) => {
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const productsPerPage = 4;

  const { data: productRes, isLoading: loading } = useGetProductsQuery({
    q: query,
    category: activeCategory !== 'All' ? activeCategory.toLowerCase() : '',
    location: deliveryCity,
    limit: productsPerPage,
    page,
    sort: sortBy
  });

  const products = productRes?.data || [];
  const totalProducts = productRes?.total || 0;

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    const el = document.getElementById('main-catalog');
    if (el) {
      const offset = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [activeCategory, query, sortBy]);

  return (
    <section className="pt-6" id="main-catalog">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase">Our Collections</h2>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
          {loading && products.length === 0 ? (
            Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((p, i) => (
              <motion.div
                key={p._id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i % 4}
              >
                <ProductCard product={p} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
              <Search size={48} className="mx-auto mb-6 text-primary/20" />
              <p className="text-2xl font-black text-heading">No delicacies found</p>
              <p className="text-xs font-semibold text-muted mt-2 uppercase tracking-wider">Adjust your filters</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/shop"
            className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] bg-primary text-button-text px-10 py-3.5 rounded-full hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
