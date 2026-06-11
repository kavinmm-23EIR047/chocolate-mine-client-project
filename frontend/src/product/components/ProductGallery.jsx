import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, RotateCcw, ShieldCheck, Cake, X, ZoomIn } from 'lucide-react';

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-card-soft group-hover:bg-muted/10 transition-colors duration-500 rounded-[2rem] lg:rounded-[2.5rem]">
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
  offerPct,
  isWishlisted,
  toggleWishlist,
  selectedFlavor,
  getFlavorImages,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Dynamic image resolution fallback array
  const flavorImages = product?.category === 'cakes' && selectedFlavor ? getFlavorImages(selectedFlavor) : [];
  const fallbackImages = (product?.images || [product?.image]).filter(Boolean);
  const currentGallerySet = flavorImages.length > 0 ? flavorImages : fallbackImages;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      
      {/* ── MAIN PORTRAIT IMAGE WRAPPER ── */}
      <div 
        className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] w-full bg-[#e3cbb3] lg:rounded-[2.5rem] overflow-hidden border-b lg:border border-border/50 cursor-zoom-in group shadow-premium transition-all duration-500" 
        onClick={() => setIsLightboxOpen(true)}
      >
        <AnimatePresence mode="wait">
          {(!displayImage || displayImage === 'none' || displayImage.trim() === '') ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <ImagePlaceholder />
            </motion.div>
          ) : (
            <motion.img
              key={displayImage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              src={displayImage || undefined}
              onError={(e) => { e.target.src = product?.image && product.image !== 'none' ? product.image : ''; }}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
            />
          )}
        </AnimatePresence>

        {/* Hover/Tap Zoom Interaction Prompt Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/60 text-white p-3.5 rounded-full backdrop-blur-md shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Offer Percentage Badge */}
        {offerPct > 0 && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-error-light text-error-text text-xs font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg z-20 uppercase tracking-widest">
            {offerPct}% OFF
          </div>
        )}

        {/* Wishlist Toggle Action Button */}
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleWishlist(product?._id?.$oid || product?._id); 
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-card/85 backdrop-blur-md shadow-xl p-2.5 sm:p-3 rounded-full hover:scale-110 transition-all z-20 group/heart border border-border/50"
        >
          <Heart
            size={20}
            fill={isWishlisted ? 'var(--error)' : 'none'}
            className={`${isWishlisted ? 'text-error' : 'text-muted'} transition-colors group-hover/heart:text-error sm:w-6 sm:h-6`}
          />
        </button>

        {/* Bestseller Highlight Overlay */}
        {product?.bestseller && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 bg-warning-light text-warning-text text-[10px] sm:text-xs font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-full uppercase tracking-widest shadow-xl z-20">
            <Sparkles size={12} fill="currentColor" className="sm:w-3.5 sm:h-3.5" />
            Bestseller
          </div>
        )}
      </div>

      {/* ── THUMBNAILS CAROUSEL GALLERY ── */}
      {currentGallerySet.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 px-4 lg:px-0 scrollbar-none snap-x">
          {currentGallerySet.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setDisplayImage(img)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-[#e3cbb3] snap-start ${
                displayImage === img ? 'border-primary shadow-md scale-95' : 'border-border hover:border-primary/50 opacity-80'
              }`}
            >
              <img src={img} alt={`View Variant ${idx + 1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* ── VALUE HIGHLIGHTS GRID (Desktop View Only) ── */}
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

      {/* ── FULLSCREEN LIGHTBOX MODAL OVERLAY ── */}
      <AnimatePresence>
        {isLightboxOpen && displayImage && displayImage !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 select-none"
          >
            {/* Top Bar Info & Dismiss Button */}
            <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent z-10">
              <div className="pl-2 sm:pl-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-black mb-0.5">{product?.category || "Artisan Bakery"}</p>
                <h3 className="text-sm sm:text-base font-black capitalize tracking-tight text-white">{product?.name}</h3>
              </div>
              
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-3 mr-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full border border-white/10 text-white transition-all shadow-2xl"
                aria-label="Close Preview"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* Lightbox Main Card Box Container */}
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()} 
              className="relative w-full max-w-md sm:max-w-lg max-h-[78vh] sm:max-h-[82vh] aspect-[3/4] sm:aspect-[9/16] rounded-2xl overflow-hidden bg-[#e3cbb3] shadow-2xl border border-white/5"
            >
              <img
                src={displayImage}
                alt={product?.name || "Product Gallery Zoom View"}
                className="w-full h-full object-contain mx-auto"
                draggable={false}
              />
            </motion.div>

            <p className="mt-4 text-center text-[10px] text-white/40 uppercase font-black tracking-[0.2em] pointer-events-none">
              Tap anywhere outside or click close button to exit
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductGallery;
