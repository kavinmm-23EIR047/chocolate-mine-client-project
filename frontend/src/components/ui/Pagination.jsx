import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 mt-6 sm:mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
      >
        <ChevronLeft size={15} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold hover:bg-border transition-colors"
          >
            1
          </button>
          {start > 2 && <span className="text-muted px-1">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            page === currentPage
              ? 'bg-button-bg text-button-text shadow-md'
              : 'hover:bg-border'
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-muted px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold hover:bg-border transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

export default Pagination;
