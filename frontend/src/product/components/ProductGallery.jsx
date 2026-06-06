import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, RotateCcw, ShieldCheck, Cake } from 'lucide-react';

const ImagePlaceholder = () => (
  <div className="w-full aspect-square flex flex-col items-center justify-center bg-card-soft group-hover:bg-muted/10 transition-colors duration-500 rounded-3xl">
    <div className="w-16 h-16 sm:w-24 sm:h-24 border-2 border-border/50 rounded-full flex items-center justify-center mb-4 bg-card shadow-sm">
      <Cake size={32} className="text-muted group-hover:text-primary transition-colors duration-300 sm:w-10 sm:h-10" />
    </div>
    <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors duration-300 text-center leading-relaxed">
      Artisan<br />Delight
    </span>
  </div>
);

const ProductGallery = ({
  product,
  displayImage,
  setDisplayImage,
  imgZoom,
  setImgZoom,
  offerPct,
  isWishlisted,
  toggleWishlist,
  selectedFlavor,
  getFlavorImages,
}) => {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="relative bg-card lg:rounded-[2.5rem] overflow-hidden border-b lg:border border-border/50 cursor-zoom-in group shadow-premium transition-all duration-500" onClick={() => setImgZoom(!imgZoom)}>
        <AnimatePresence mode="wait">
          {(!displayImage || displayImage === 'none' || displayImage.trim() === '') ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImagePlaceholder />
            </motion.div>
          ) : (
            <motion.img
              key={displayImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={displayImage || undefined}
              onError={(e) => { e.target.src = product?.image && product.image !== 'none' ? product.image : ''; }}
              className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
        </AnimatePresence>

        {offerPct > 0 && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-error-light text-error-text text-xs font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg z-10 uppercase tracking-widest">
            {offerPct}% OFF
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-card/85 backdrop-blur-md shadow-xl p-2.5 sm:p-3 rounded-full hover:scale-110 transition-all z-10 group/heart border border-border/50"
        >
          <Heart
            size={20}
            fill={isWishlisted ? 'var(--error)' : 'none'}
            className={`${isWishlisted ? 'text-error' : 'text-muted'} transition-colors group-hover/heart:text-error sm:w-6 sm:h-6`}
          />
        </button>

        {product?.bestseller && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 bg-warning-light text-warning-text text-[10px] sm:text-xs font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-full uppercase tracking-widest shadow-xl z-10">
            <Sparkles size={12} fill="currentColor" className="sm:w-3.5 sm:h-3.5" />
            Bestseller
          </div>
        )}
      </div>

      {/* Cake Flavor Gallery Thumbnails */}
      {product?.category === 'cakes' && selectedFlavor && getFlavorImages(selectedFlavor).length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 px-4 lg:px-0 hide-scrollbar">
          {getFlavorImages(selectedFlavor).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setDisplayImage(img)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${displayImage === img ? 'border-primary' : 'border-border hover:border-primary/50'}`}
            >
              <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Highlights Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {[
          { icon: Sparkles, label: 'Handcrafted', sub: '100% Artisanal' },
          { icon: RotateCcw, label: 'Fresh Daily', sub: 'Baked today' },
          { icon: ShieldCheck, label: 'Secure Pay', sub: '100% safe' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-card rounded-3xl border border-border/50 p-5 xl:p-6 flex flex-col items-center text-center gap-2 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <Icon size={24} className="text-primary mb-1 xl:w-7 xl:h-7" />
            <p className="text-xs xl:text-sm font-black uppercase tracking-wider text-heading">{label}</p>
            <p className="text-xs text-muted font-medium">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;