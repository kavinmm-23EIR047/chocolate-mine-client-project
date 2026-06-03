import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle2, ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import orderService from '../services/orderService';
import reviewService from '../services/reviewService';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const ReviewPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);
  
  // Review state
  const [reviews, setReviews] = useState({}); // { productId: { rating: 5, comment: '' } }

  useEffect(() => {
    const fetchOrderAndCheckReview = async () => {
      try {
        setLoading(true);
        
        // First check if order can be reviewed
        const checkRes = await reviewService.checkOrderReviewable(orderId);
        setCanReview(checkRes.data.data.canReview);
        setReviewStatus(checkRes.data.data);
        
        if (!checkRes.data.data.canReview) {
          setLoading(false);
          return;
        }
        
        // Fetch order details
        const res = await orderService.getOrder(orderId);
        setOrder(res.data.data);
        
        const initial = {};
        res.data.data.items.forEach(item => {
          const pid = item.productId?._id || item.productId;
          initial[pid] = { rating: 5, comment: '' };
        });
        setReviews(initial);
      } catch (err) {
        console.error('Review Fetch Error:', err);
        setOrder(null);
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndCheckReview();
  }, [orderId]);

  const handleReviewChange = (productId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Submit reviews for each product that has a comment
      const promises = Object.entries(reviews)
        .filter(([_, data]) => data.comment.trim() !== '') // Only submit if comment is not empty
        .map(([productId, data]) => 
          reviewService.createReview({
            orderId,
            productId,
            rating: data.rating,
            comment: data.comment
          })
        );
      
      if (promises.length === 0) {
        toast.error('Please write a review before submitting');
        setSubmitting(false);
        return;
      }
      
      await Promise.all(promises);
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reviews');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Cannot review - Order not delivered or already reviewed
  if (!canReview && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card p-10 rounded-2xl shadow-2xl text-center border border-border/10"
        >
          <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-heading uppercase tracking-tighter mb-2">Cannot Review</h2>
          <p className="text-sm font-bold text-muted uppercase tracking-widest mb-8">
            {reviewStatus?.orderStatus !== 'delivered' 
              ? 'Reviews can only be submitted for delivered orders.'
              : 'You have already reviewed this order.'}
          </p>
          <Button className="w-full py-4" onClick={() => navigate('/account/orders')}>VIEW MY ORDERS</Button>
        </motion.div>
      </div>
    );
  }

  // Order not found
  if (!order && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card p-10 rounded-2xl shadow-2xl text-center border border-border/10">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-heading uppercase tracking-tighter mb-2">Order Not Found</h2>
          <p className="text-sm font-bold text-muted uppercase tracking-widest mb-8">We couldn't find the order for this review. It may be private or invalid.</p>
          <Button className="w-full py-4" onClick={() => navigate('/account/orders')}>VIEW MY ORDERS</Button>
        </div>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card p-10 rounded-2xl shadow-2xl text-center border border-border/10"
        >
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-heading uppercase tracking-tighter mb-2">Review Submitted!</h2>
          <p className="text-sm font-bold text-muted uppercase tracking-widest mb-8">Thank you for helping us grow.</p>
          <div className="flex gap-4">
            <Button className="flex-1 py-4" variant="outline" onClick={() => navigate('/account/orders')}>MY ORDERS</Button>
            <Button className="flex-1 py-4" onClick={() => navigate('/')}>BACK TO HOME</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-8 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="bg-card p-8 sm:p-12 rounded-2xl shadow-card border border-border/30">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-heading uppercase tracking-tighter mb-2">How was your treat?</h1>
            {order && <p className="text-[10px] font-black text-muted uppercase tracking-widest">Order #{order.orderNumber || order.trackingCode}</p>}
            <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-2">Rate and review each item from your order</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {order?.items?.map((item, idx) => {
              const productId = item.productId?._id || item.productId;
              return (
                <div key={productId} className="space-y-6 pb-12 border-b border-border/30 last:border-0 last:pb-0">
                  <div className="flex items-center gap-6">
                    <img src={item.image} className="w-24 h-24 rounded-2xl object-cover border border-border/10 shadow-sm" alt={item.name} />
                    <div>
                      <h3 className="text-lg font-black text-heading uppercase tracking-tighter">{item.name}</h3>
                      {item.selectedFlavor && (
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">{item.isCustomCake ? 'Color' : 'Flavor'}: {item.selectedFlavor}</p>
                      )}
                      {item.selectedWeight && (
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Weight: {item.selectedWeight}</p>
                      )}
                      {item.sku && (
                        <p className="text-[9px] text-muted font-mono mt-1">SKU: {item.sku}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-heading uppercase tracking-widest block">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleReviewChange(productId, 'rating', star)}
                          className={`p-2 transition-all ${reviews[productId]?.rating >= star ? 'text-star scale-110' : 'text-border-muted opacity-30 hover:opacity-100'}`}
                        >
                          <Star size={36} fill={reviews[productId]?.rating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-heading uppercase tracking-widest block">Your Review</label>
                    <textarea
                      required
                      value={reviews[productId]?.comment || ''}
                      onChange={(e) => handleReviewChange(productId, 'comment', e.target.value)}
                      placeholder="Tell us what you liked about this treat..."
                      className="w-full bg-surface border-2 border-border/50 rounded-2xl p-6 text-sm font-black text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[140px] placeholder:text-muted/40 shadow-sm"
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full py-6 text-sm tracking-[0.2em] shadow-premium bg-primary text-button-text hover:brightness-110 font-black"
                loading={submitting}
                icon={Send}
              >
                SUBMIT ALL REVIEWS
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;