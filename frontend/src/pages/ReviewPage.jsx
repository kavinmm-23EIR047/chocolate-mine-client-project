import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const ReviewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card p-8 sm:p-10 rounded-3xl shadow-2xl text-center border border-border/50"
      >
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-sm">
          <Star size={40} className="fill-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-heading uppercase tracking-tighter mb-3">Product Reviews Disabled</h2>
        <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed mb-8">
          Internal product reviews are disabled. We value transparent feedback and rely exclusively on official Google Reviews!
        </p>
        <div className="flex flex-col gap-3">
          <Button className="w-full py-4" onClick={() => navigate('/account/orders')} icon={ArrowLeft}>
            BACK TO MY ORDERS
          </Button>
          <Button variant="outline" className="w-full py-4" onClick={() => navigate('/')}>
            GO TO HOMEPAGE
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewPage;