import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  onSearch,
  searchTerm,
  products,
  categories
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] sm:hidden"
          />

          {/* Right Slide-out Sidebar (Full Height) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[380px] h-full bg-[#1A0E0B] z-[210] flex flex-col text-[#ecded9] border-l border-[#3A211B] shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center py-5 px-6 border-b border-[#3A211B] bg-[#2A1813] select-none">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#E6B25A]" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">Filters</h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-[#A18881] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Filters Content */}
            <div className="flex-1 min-h-0 bg-[#1A0E0B]">
              <FilterSidebar 
                isMobileDrawer={true}
                activeFilters={filters}
                onApply={onApply}
                onReset={onReset}
                onSearch={onSearch}
                searchTerm={searchTerm}
                products={products}
                categories={categories}
              />
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-5 border-t border-[#3A211B] bg-[#2A1813] flex gap-3">
              <button 
                onClick={onReset}
                className="flex-1 py-3.5 border border-[#3A211B] bg-[#1A0E0B] text-white hover:bg-black/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Reset
              </button>
              <button 
                onClick={onClose}
                className="flex-[2] py-3.5 bg-[#E6B25A] hover:bg-[#F0C46E] text-[#120806] rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#E6B25A]/10 transition-all"
              >
                Apply & Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;