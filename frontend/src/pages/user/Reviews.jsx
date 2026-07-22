import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyReviews = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-heading tracking-tight uppercase">My Reviews</h1>
        <p className="text-sm text-muted font-bold mt-1 uppercase tracking-widest">Customer Feedback System</p>
      </div>

      <div className="py-20 px-6 text-center bg-card rounded-[3rem] border border-border/50 shadow-premium max-w-xl mx-auto">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-sm">
          <Star size={40} className="fill-amber-500" />
        </div>
        <h3 className="text-2xl font-black text-heading uppercase tracking-tighter mb-2">Google Reviews Enabled</h3>
        <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em] leading-relaxed mb-8">
          Product reviews are disabled. We rely exclusively on official Google Reviews for customer feedback!
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-button-text font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all shadow-md"
        >
          View Google Reviews On Home <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default MyReviews;
