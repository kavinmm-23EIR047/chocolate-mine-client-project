import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] sm:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[var(--card)] z-[210] overflow-hidden shadow-2xl border-r border-[var(--border)] sm:hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h2 className="text-lg font-bold text-[var(--heading)] uppercase tracking-tighter">Mobile Filters</h2>
              <button onClick={onClose} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
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

            <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
              <button onClick={onClose}
                className="w-full py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md uppercase tracking-wider"
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