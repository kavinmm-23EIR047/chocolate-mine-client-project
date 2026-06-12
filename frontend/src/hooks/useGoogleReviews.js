import { useState, useEffect, useCallback } from 'react';
import googleReviewsService from '../services/googleReviewsService';

export const useGoogleReviews = (options = {}) => {
  const { type = 'all', limit = 10, page = 1, fetchOnMount = true } = options;
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchReviews = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (type === 'latest') {
        const res = await googleReviewsService.getLatestReviews();
        setReviews(res.data);
      } else {
        const res = await googleReviewsService.getReviews({ page, limit, ...params });
        setReviews(res.data.reviews);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [type, page, limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await googleReviewsService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchReviews();
      if (type === 'stats' || type === 'latest') {
        fetchStats();
      }
    }
  }, [fetchReviews, fetchStats, fetchOnMount, type]);

  return {
    reviews,
    stats,
    loading,
    error,
    pagination,
    refetch: fetchReviews,
    refetchStats: fetchStats
  };
};
