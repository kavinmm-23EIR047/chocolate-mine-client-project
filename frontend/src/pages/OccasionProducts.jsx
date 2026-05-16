import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift } from 'lucide-react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const OccasionProducts = () => {
  const { name } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Convert slug back to readable occasion name
        const occasionName = name?.replace(/-/g, ' ') || '';
        
        const response = await productService.getAll({
          occasion: occasionName,
        });

        setProducts(response?.data?.data || []);
        
        if (response?.data?.data?.length === 0) {
          toast('No products found for this occasion', { icon: '🎁' });
        }
      } catch (error) {
        console.error('Error loading occasion products:', error);
        toast.error('Failed to load occasion products');
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      loadProducts();
    }
  }, [name]);

  // Format display name (convert slug to readable format)
  const getDisplayName = () => {
    if (!name) return 'Occasion';
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="w-full mx-auto px-4 sm:px-12 lg:px-16">
        
        {/* Cinematic Header */}
        <div className="relative mb-16 overflow-hidden rounded-[3rem] bg-footer p-8 sm:p-16 border border-white/5 shadow-2xl">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <nav className="flex items-center gap-2 mb-4">
                  <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                  </button>
                  <span className="text-white/20">/</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Occasion</span>
                </nav>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                  {getDisplayName()}
                </h1>
                <p className="text-xs sm:text-base text-white/50 font-medium max-w-xl">
                   Explore our hand-picked selection of gourmet chocolates and treats, perfectly curated for your special {getDisplayName().toLowerCase()} celebration.
                </p>
              </div>

              <div className="flex flex-col items-end gap-4">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-inner">
                     <Gift size={24} />
                   </div>
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                     {products.length} {products.length === 1 ? 'Delicacy' : 'Delicacies'} Found
                   </span>
                 </div>
              </div>
           </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-footer/40 rounded-[3rem] border border-white/5">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Gift size={48} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">No Products Found</h3>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8">
              We couldn't find any products for {getDisplayName()}
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-4 bg-primary text-button-text rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OccasionProducts;