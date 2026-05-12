import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Zap } from 'lucide-react';
import Button from '../ui/Button';

const OfferSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-20">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative bg-primary text-button-text p-6 sm:p-10 rounded-[1.5rem] overflow-hidden group shadow-card border border-border/10"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-secondary/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-secondary mb-6">
            <Sparkles size={24} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Special Selection</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">Artisanal Box of 12</h2>
          <p className="text-sm font-bold opacity-70 mb-8 max-w-sm">Mix and match our finest truffles and pralines in a premium gold-foiled box.</p>
          <Button className="bg-secondary text-button-text border-none shadow-xl hover:translate-y-[-2px]">
            ORDER NOW - ₹1,299
          </Button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1548907040-4baa42d10919?q=80&w=300&h=300&fit=crop" 
          alt="Chocolates"
          className="absolute bottom-[-10%] right-[-10%] w-48 h-48 object-contain rotate-12 group-hover:scale-110 transition-transform duration-500 opacity-50 sm:opacity-100"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative bg-secondary text-button-text p-6 sm:p-10 rounded-[1.5rem] overflow-hidden group shadow-card border border-border/10"
      >
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-button-text/10 rounded-full blur-3xl -ml-24 -mb-24 group-hover:bg-button-text/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-button-text mb-6">
            <Zap size={24} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Flash Delivery</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">Same Day Celebration</h2>
          <p className="text-sm font-bold opacity-70 mb-8 max-w-sm">Order any cake before 2 PM and get it delivered fresh by evening.</p>
          <Button variant="outline" className="border-button-text text-button-text hover:bg-button-text/10 shadow-xl">
            CHECK DELIVERY TIME
          </Button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300&h=300&fit=crop" 
          alt="Cakes"
          className="absolute bottom-[-10%] right-[-10%] w-48 h-48 object-contain -rotate-12 group-hover:scale-110 transition-transform duration-500 opacity-50 sm:opacity-100"
        />
      </motion.div>
    </div>
  );
};

export default OfferSection;
