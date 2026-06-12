import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [customCakeWishlist, setCustomCakeWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
      setCustomCakeWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/wishlist');
      setWishlist(res.data.data || []);
      setCustomCakeWishlist(res.data.customCakes || []);
    } catch (err) {
      console.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId, type = 'product') => {
    if (!user) {
      toast.error('Please login to use wishlist');
      return;
    }
    try {
      await api.post('/users/wishlist/toggle', { productId, type });
      fetchWishlist();
      
      const isRemoving = type === 'customCake' 
        ? customCakeWishlist.some(item => item._id === productId)
        : wishlist.some(item => item._id === productId);
      toast.success(isRemoving ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (productId, type = 'product') => {
    if (type === 'customCake') return customCakeWishlist.some(item => item._id === productId);
    return wishlist.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, customCakeWishlist, loading, toggleWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
