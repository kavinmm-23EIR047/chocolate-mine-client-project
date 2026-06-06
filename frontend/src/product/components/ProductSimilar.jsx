import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard'; // ensure path is correct

const ProductSimilar = ({ relatedProducts }) => {
    if (!relatedProducts || relatedProducts.length === 0) return null;

    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Check scroll position to show/hide arrows
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            checkScrollPosition();
            return () => container.removeEventListener('scroll', checkScrollPosition);
        }
    }, [relatedProducts]);

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollContainerRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    };

    // Responsive card width based on screen size
    const getCardWidth = () => {
        if (typeof window === 'undefined') return 'w-[260px]';
        if (window.innerWidth < 480) return 'w-[220px]';
        if (window.innerWidth < 640) return 'w-[240px]';
        if (window.innerWidth < 768) return 'w-[260px]';
        if (window.innerWidth < 1024) return 'w-[280px]';
        return 'w-[300px]';
    };

    const [cardWidth, setCardWidth] = useState(getCardWidth());

    useEffect(() => {
        const handleResize = () => setCardWidth(getCardWidth());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-full">
            {/* Header with View All link */}
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5 px-4 lg:px-0">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                        Similar Products
                    </h2>
                    <p className="text-xs text-muted mt-1 hidden sm:block">
                        You might also like these
                    </p>
                </div>
                <Link
                    to="/shop"
                    className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                    View All
                    <ChevronRight size={12} />
                </Link>
            </div>

            {/* Horizontal Scroll Container with Arrows */}
            <div className="relative group">
                {/* Left Arrow - Desktop only */}
                {!isMobile && showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-border/50 hover:bg-primary hover:text-white"
                        style={{ transform: 'translateY(-50%)' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide pb-4 px-4 lg:px-0"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                    onScroll={checkScrollPosition}
                >
                    <div className="flex gap-4 md:gap-5 w-max">
                        {relatedProducts.map((product) => (
                            <div
                                key={product._id?.$oid || product._id}
                                className={`${cardWidth} flex-shrink-0`}
                            >
                                <ProductCard product={product} layout="vertical" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Arrow - Desktop only */}
                {!isMobile && showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-border/50 hover:bg-primary hover:text-white"
                        style={{ transform: 'translateY(-50%)' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>

            {/* Mobile Hint - Swipe Indicator */}
            {isMobile && (
                <div className="flex justify-center mt-2">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                    </div>
                    <p className="text-[8px] text-muted ml-2">Swipe to see more →</p>
                </div>
            )}
        </div>
    );
};

export default ProductSimilar;