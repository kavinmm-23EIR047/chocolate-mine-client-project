import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  onSearch,
  searchTerm,
  products
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
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[var(--card)] z-[210] p-5 overflow-y-auto shadow-2xl border-r border-[var(--border)] sm:hidden"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--heading)]">Filters</h2>
              <button onClick={onClose} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="py-8 text-center text-[var(--muted)]">
              <p className="text-sm font-medium">Mobile filters</p>
              <p className="text-xs mt-2">Please use the desktop filter sidebar or category pills for now.</p>
            </div>

            <button onClick={onClose}
              className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md"
            >
              Close
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;