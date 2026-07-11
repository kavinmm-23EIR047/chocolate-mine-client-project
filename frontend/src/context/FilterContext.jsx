import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const FilterContext = createContext(null);

export const FilterProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get all filter values from URL
  const getFilterValue = useCallback((key, defaultValue = 'all') => {
    return searchParams.get(key) || defaultValue;
  }, [searchParams]);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 0 || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.keys(newFilters).forEach(key => {
        const value = newFilters[key];
        if (!value || value === 'all' || value === 0 || value === false) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setActiveFilters({});
  }, [setSearchParams]);

  // Toggle a filter value (for multi-select filters like categories)
  const toggleFilterValue = useCallback((key, value) => {
    const currentValues = searchParams.get(key)?.split(',') || [];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (updatedValues.length === 0) {
        next.delete(key);
      } else {
        next.set(key, updatedValues.join(','));
      }
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  // Check if a filter value is active
  const isFilterActive = useCallback((key, value) => {
    const currentValues = searchParams.get(key)?.split(',') || [];
    return currentValues.includes(value);
  }, [searchParams]);

  const contextValue = useMemo(() => ({
    filters: Object.fromEntries(searchParams.entries()),
    getFilterValue,
    updateFilter,
    updateFilters,
    clearFilters,
    toggleFilterValue,
    isFilterActive,
    isFilterOpen,
    setIsFilterOpen,
    searchParams,
    setSearchParams,
  }), [searchParams, getFilterValue, updateFilter, updateFilters, clearFilters, toggleFilterValue, isFilterActive, isFilterOpen]);

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};