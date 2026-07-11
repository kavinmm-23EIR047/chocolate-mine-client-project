import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get all filter values from URL
  const getFilterValue = useCallback((key, defaultValue = 'all') => {
    return searchParams.get(key) || defaultValue;
  }, [searchParams]);

  // Update a single filter
  const setFilter = useCallback((key, value) => {
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

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Get all filters as an object
  const getAllFilters = useCallback(() => {
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value;
    }
    return filters;
  }, [searchParams]);

  return {
    filters: getAllFilters(),
    getFilter: getFilterValue,
    setFilter,
    clearAllFilters,
    searchParams,
    setSearchParams,
  };
};