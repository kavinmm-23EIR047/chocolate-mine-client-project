import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetProductsQuery } from '../../product/productApi';
import ProductCard from '../../product/ProductCard';
import { CardSkeleton } from '../ui/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const Bestseller = ({ location }) => {
  const sliderRef = useRef(null);
  const progressTrackRef = useRef(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);

  // Mouse Drag on Container State
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const { data: productRes, isLoading } = useGetProductsQuery({
    bestseller: 'true',
    location,
    limit: 100,
  });

  const CHOCO_KEYWORDS = ['choco', 'chocolate', 'truffle', 'fudge', 'oreo', 'brownie', 'nutella', 'ferrero', 'cocoa', 'mud', 'dark', 'black forest'];

  const isChocoProduct = (p) => {
    if (!p) return false;
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const sub = (p.subCategory || '').toLowerCase();
    let cats = [];
    if (Array.isArray(p.category)) cats = p.category;
    else if (typeof p.category === 'string') cats = [p.category];
    const catStr = cats.join(' ').toLowerCase();
    
    let flavoursStr = '';
    if (Array.isArray(p.flavours)) {
      flavoursStr = p.flavours.map(f => f.name || '').join(' ').toLowerCase();
    }

    const combinedText = `${name} ${sub} ${catStr} ${desc} ${flavoursStr}`;
    return CHOCO_KEYWORDS.some(keyword => combinedText.includes(keyword));
  };

  const products = [...((productRes?.data || []).filter(p => p.bestseller === true))].sort((a, b) => {
    const aIsChoco = isChocoProduct(a);
    const bIsChoco = isChocoProduct(b);
    if (aIsChoco && !bIsChoco) return -1;
    if (!aIsChoco && bIsChoco) return 1;
    return 0;
  });

  const handleScroll = useCallback(() => {
    if (sliderRef.current && !isDraggingTrack) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollRatio(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
      }
    }
  }, [isDraggingTrack]);

  const scroll = useCallback((direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  // Mouse Drag Handlers for Container
  const handleMouseDown = (e) => {
    if (!sliderRef.current) return;
    setIsMouseDown(true);
    setIsPaused(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftPos(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
    setIsPaused(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsPaused(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftPos - walk;
  };

  // Automatic slide one by one (5.5s speed - very slow & comfortable)
  useEffect(() => {
    if (isLoading || products.length <= 1 || isPaused || isDraggingTrack || isMouseDown) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const cardStep = 280;

        if (scrollLeft + 20 >= maxScroll) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: cardStep, behavior: 'smooth' });
        }
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [isLoading, products.length, isPaused, isDraggingTrack, isMouseDown]);

  const updateScrollByX = useCallback((clientX) => {
    if (!progressTrackRef.current || !sliderRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / (rect.width > 0 ? rect.width : 1)));
    setScrollRatio(ratio);
    const { scrollWidth, clientWidth } = sliderRef.current;
    sliderRef.current.scrollLeft = ratio * (scrollWidth - clientWidth);
  }, []);

  const handlePointerDown = (e) => {
    setIsDraggingTrack(true);
    setIsPaused(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    updateScrollByX(clientX);
  };

  useEffect(() => {
    if (!isDraggingTrack) return;

    const handlePointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (clientX !== undefined) {
        updateScrollByX(clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingTrack(false);
      setIsPaused(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDraggingTrack, updateScrollByX]);

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="responsive-section !py-6 lg:!py-10 border-b border-border/20 overflow-hidden">
      <div className="flex flex-col gap-5 lg:gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full px-4 sm:px-0 mb-4 lg:mb-6">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Star className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight uppercase text-heading">
              Our Bestsellers
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {!isLoading && products.length > 3 && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  onClick={() => scroll('left')}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 text-heading flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                  aria-label="Previous bestsellers"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 text-heading flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                  aria-label="Next bestsellers"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <Link
                to="/shop?bestseller=true"
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm font-black text-primary hover:text-primary-hover uppercase tracking-widest border-b-2 border-primary/20 pb-0.5 transition-all hover:gap-2 whitespace-nowrap"
              >
                View All <ArrowRight size={14} className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 inline ml-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Carousel Container with Mouse Drag & Touch Swipe */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 tv:gap-8 pb-4 lg:pb-6 scroll-smooth select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={`best-skel-${i}`} className="snap-start shrink-0 w-[172px] sm:w-[230px] md:w-[270px] lg:w-[310px] tv:w-[360px]">
                <CardSkeleton />
              </div>
            ))
          ) : (
            products.map((p, i) => (
              <motion.div
                key={p._id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="snap-start shrink-0 w-[172px] sm:w-[230px] md:w-[270px] lg:w-[310px] tv:w-[360px] h-auto flex flex-col pointer-events-auto"
              >
                <ProductCard product={p} />
              </motion.div>
            ))
          )}
        </div>


      </div>
    </section>
  );
};

export default Bestseller;
