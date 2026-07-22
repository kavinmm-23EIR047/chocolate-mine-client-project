import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, BadgeCheck, PackageCheck, Leaf } from 'lucide-react';

const CUSTOM_FEATURES = [
  { icon: <Sparkles size={14} />, label: 'Custom Flavors', sub: 'Choose your favorites' },
  { icon: <BadgeCheck size={14} />, label: 'Personalized Design', sub: 'Tailored to your moments' },
  { icon: <PackageCheck size={14} />, label: 'Premium Ingredients', sub: 'Made with the finest' },
  { icon: <Leaf size={14} />, label: 'Pure Veg & Eggless', sub: '100% vegetarian options', highlight: true },
];

const ProductRelated = ({ isHorizontal = false }) => {
  if (isHorizontal) {
    return (
      <div className="relative w-full rounded-3xl lg:rounded-[2.5rem] overflow-hidden border border-border/40 bg-card p-6 lg:p-8 shadow-sm flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        <div className="relative w-full lg:w-72 h-44 lg:h-44 rounded-2xl overflow-hidden shrink-0">
          <img
            src="https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=1200&q=80"
            alt="Custom Cakes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 text-primary">
            Custom Cakes
          </p>
          <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight mb-2 text-heading">
            Want something unique?
          </h3>
          <p className="text-xs font-medium leading-relaxed mb-4 text-muted max-w-xl">
            Design your own dream cake with our Custom Cake creator. Celebrate every moment with a cake as unique as your story.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CUSTOM_FEATURES.map(({ icon, label, highlight }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-muted/5 text-heading border border-border/50'}`}>
                  {icon}
                </div>
                <p className={`text-[10px] font-black uppercase truncate ${highlight ? 'text-emerald-700' : 'text-heading'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-auto">
          <Link
            to="/custom-cake"
            className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-foreground text-background hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Create Custom <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border/40 flex flex-col h-full group transition-all hover:border-border/80 bg-card shadow-sm">
      {/* Fixed image section */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden shrink-0">
        <img
          src="https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=1200&q=80"
          alt="Custom Cakes"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>

      {/* Content area that takes remaining space */}
      <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between z-10 -mt-16 relative">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 drop-shadow-md text-primary">
            Custom Cakes
          </p>
          <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight mb-3 text-heading">
            Want something unique?
          </h3>
          <p className="text-[11px] sm:text-xs font-medium leading-relaxed mb-6 text-muted">
            Design your own dream cake with our Custom Cake creator. Celebrate every moment with a cake as unique as your story.
          </p>

          <div className="flex flex-col gap-4 mb-8">
            {CUSTOM_FEATURES.map(({ icon, label, sub, highlight }) => (
              <div key={label} className="flex items-center gap-3 group/feature">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-muted/5 text-heading border border-border/50'}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-black uppercase ${highlight ? 'text-emerald-700' : 'text-heading'}`}>{label}</p>
                  <p className="text-[9px] text-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Button stays at bottom */}
        <Link
          to="/custom-cake"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-foreground text-background"
        >
          Create Custom <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default ProductRelated;