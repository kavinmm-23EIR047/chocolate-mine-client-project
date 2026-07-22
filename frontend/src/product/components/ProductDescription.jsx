import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ProductDescription = ({ product, isMobile = false }) => {
  // Combine custom occasions with key quality guarantees to ensure rich highlights
  const qualityHighlights = [
    'Freshly Baked Daily',
    '100% Eggless Option',
    'Handcrafted Quality',
    'No Artificial Preservatives',
  ];

  const occasions = Array.isArray(product?.occasion) && product.occasion.length > 0
    ? product.occasion.map(o => o.toUpperCase().endsWith('GIFT') || o.toUpperCase().endsWith('GIFTS') ? o : `${o} Special`)
    : [];

  const allHighlights = [...new Set([...occasions, ...qualityHighlights])];

  if (isMobile) {
    return (
      <div className="space-y-4 block lg:hidden">
        {/* Description Card */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-3.5 bg-primary rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-heading">Description</h3>
          </div>
          <p className="text-xs sm:text-sm text-heading/90 font-medium leading-relaxed italic pl-3 border-l-2 border-primary/30">
            "{product?.description || 'Made with love and the finest ingredients.'}"
          </p>
        </div>

        {/* Highlights Card */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="w-1.5 h-3.5 bg-primary rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-heading">Highlights</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {allHighlights.map(item => (
              <div key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card-soft/60 border border-border/30">
                <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-heading truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2 hidden lg:block">
      {/* Description Card */}
      <div className="bg-card rounded-[2.2rem] border border-border/50 p-7 lg:p-8 shadow-sm transition-all duration-300 hover:border-border/80 min-h-[140px] flex flex-col justify-center">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-2 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-heading">Description</h3>
        </div>
        <p className="text-base text-heading/90 font-medium leading-relaxed tracking-wide italic pl-4 border-l-2 border-primary/30 my-1">
          "{product?.description || 'Made with love and the finest artisan ingredients.'}"
        </p>
      </div>

      {/* Highlights Card */}
      <div className="bg-card rounded-[2.2rem] border border-border/50 p-7 lg:p-8 shadow-sm transition-all duration-300 hover:border-border/80">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-2 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-heading">Highlights</h3>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {allHighlights.map(item => (
            <div key={item} className="flex items-center gap-3 p-3 rounded-2xl bg-card-soft/50 border border-border/30 hover:border-primary/20 transition-all">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-heading">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;