import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ProductDescription = ({ product, isMobile = false }) => {
  if (isMobile) {
    return (
      <div className="space-y-4 block lg:hidden">
        <div className="bg-card rounded-3xl sm:rounded-[2rem] border border-border/50 p-5 sm:p-6 shadow-card">
          <h3 className="text-xs font-black uppercase tracking-widest text-heading mb-3">Description</h3>
          <p className="text-sm text-muted font-medium leading-relaxed tracking-wide italic">"{product?.description}"</p>
        </div>
        <div className="bg-card rounded-3xl sm:rounded-[2rem] border border-border/50 p-5 sm:p-6 shadow-card">
          <h3 className="text-xs font-black uppercase tracking-widest text-heading mb-4">Highlights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
            {['Freshly Baked', 'Premium Quality', 'Eggless Available', 'No Preservatives', 'Secure Packing', 'Fast Delivery'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center border border-success/10 flex-shrink-0">
                  <CheckCircle2 size={12} className="text-success" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-heading">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 hidden lg:block">
      <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-heading mb-4">Description</h3>
        <p className="text-base text-muted font-medium leading-relaxed tracking-wide italic">"{product?.description}"</p>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-heading mb-6">Highlights</h3>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-y-5 gap-x-6">
          {(product?.occasion?.length > 0 ? product.occasion : ['Freshly Baked', 'Premium Quality', 'Eggless Available']).map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center border border-success/10 flex-shrink-0">
                <CheckCircle2 size={14} className="text-success" />
              </div>
              <span className="text-xs xl:text-sm font-bold uppercase tracking-wider text-heading">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;