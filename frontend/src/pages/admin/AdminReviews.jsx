import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Check, X, MessageSquare, User, Calendar, Edit3, ShieldAlert, ChevronDown } from 'lucide-react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  // Modals state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // Edit form state
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editApproved, setEditApproved] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getReviews();
      setReviews(res.data.data.reviews || []);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Apply search and status filters locally
  useEffect(() => {
    let result = [...reviews];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        r.userName?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.productId?.name?.toLowerCase().includes(q) ||
        r.userId?.email?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      const approvedOnly = statusFilter === 'approved';
      result = result.filter(r => r.isApproved === approvedOnly);
    }

    if (ratingFilter !== 'all') {
      const targetRating = parseInt(ratingFilter, 10);
      result = result.filter(r => r.rating === targetRating);
    }

    setFilteredReviews(result);
  }, [reviews, search, statusFilter, ratingFilter]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await adminService.deleteReview(deleteId);
      toast.success('Review deleted successfully');
      setDeleteId(null);
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleApproval = async (review) => {
    try {
      const nextApproved = !review.isApproved;
      toast.loading(nextApproved ? 'Approving review...' : 'Disapproving review...', { id: 'status' });
      await adminService.updateReview(review._id, { isApproved: nextApproved });
      toast.success(nextApproved ? 'Review approved & visible' : 'Review hidden successfully', { id: 'status' });
      fetchReviews();
    } catch (err) {
      toast.error('Failed to update status', { id: 'status' });
    }
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setEditApproved(review.isApproved);
  };

  const handleUpdateReviewSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      setUpdating(true);
      await adminService.updateReview(editingReview._id, {
        rating: editRating,
        comment: editComment,
        isApproved: editApproved
      });
      toast.success('Review updated successfully');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      toast.error('Failed to update review');
    } finally {
      setUpdating(false);
    }
  };

  const renderStars = (count) => {
    return (
      <div className="flex gap-0.5 text-yellow-500">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < count ? 'currentColor' : 'none'} className="shrink-0" />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading">User Reviews</h2>
          <p className="text-sm text-muted">Moderate and update customer reviews and product ratings</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput onSearch={setSearch} placeholder="Search reviews, users, or products..." className="flex-1 max-w-md" />
        <div className="flex flex-wrap gap-2">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-input border border-border text-body px-4 py-2.5 rounded-xl focus:outline-none text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
          <select 
            value={ratingFilter} 
            onChange={(e) => setRatingFilter(e.target.value)} 
            className="bg-input border border-border text-body px-4 py-2.5 rounded-xl focus:outline-none text-xs font-semibold"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton rows={6} cols={6} /> : filteredReviews.length === 0 ? (
        <EmptyState title="No reviews found" message="There are no user reviews matching these filters." icon={MessageSquare} />
      ) : (
        <>
        {/* Desktop Table */}
        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-premium-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-border/20">
                  <th className="text-left px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Rating</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider w-[35%]">Review</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReviews.map((r, i) => (
                  <motion.tr 
                    key={r._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.02 }} 
                    className="hover:bg-border/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                          {r.userImage ? (
                            <img src={r.userImage} alt={r.userName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-heading text-sm truncate">{r.userName || 'Customer'}</p>
                          <p className="text-xs text-muted truncate">{r.userId?.email || 'No email'}</p>
                          <p className="text-[10px] text-muted">{r.userId?.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {r.productId ? (
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <img 
                            src={r.productId.image} 
                            alt={r.productId.name} 
                            className="w-10 h-10 rounded-lg object-cover bg-border shrink-0" 
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100/3B1A0F/FAF0EC?text=🍫'; }} 
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-heading text-xs truncate">{r.productId.name}</p>
                            <p className="text-[10px] text-muted">₹{r.productId.price}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted flex items-center gap-1"><ShieldAlert size={12} /> Deleted Product</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {renderStars(r.rating)}
                        <span className="text-[10px] text-muted font-bold">{r.rating} / 5</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-normal min-w-[300px]">
                      <div className="space-y-1">
                        <p className="text-xs text-heading leading-relaxed break-words font-medium">{r.comment || <em className="text-muted">No comment text</em>}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted">
                          <Calendar size={10} />
                          <span>{new Date(r.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={r.isApproved ? 'success' : 'warning'}>
                        {r.isApproved ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleToggleApproval(r)} 
                          className={`p-2 rounded-xl transition-all ${r.isApproved ? 'hover:bg-warning/15 text-warning hover:text-warning-dark' : 'hover:bg-success/15 text-success hover:text-success-dark'}`}
                          title={r.isApproved ? 'Hide Review' : 'Approve Review'}
                        >
                          {r.isApproved ? <X size={16} /> : <Check size={16} />}
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(r)} 
                          className="p-2 hover:bg-border/40 rounded-xl text-muted hover:text-heading transition-all"
                          title="Edit Review"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(r._id)} 
                          className="p-2 hover:bg-error/15 rounded-xl text-muted hover:text-error transition-all"
                          title="Delete Review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredReviews.map((r) => (
            <details key={`mobile-${r._id}`} className="bg-card border border-border rounded-2xl overflow-hidden group">
              <summary className="p-4 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-border/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    {r.userImage ? (
                      <img src={r.userImage} alt={r.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-heading text-sm truncate">{r.userName || 'Customer'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {renderStars(r.rating)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.isApproved ? 'success' : 'warning'} className="text-[10px]">
                    {r.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                  <ChevronDown size={20} className="text-muted group-open:rotate-180 transition-transform shrink-0" />
                </div>
              </summary>
              
              <div className="px-4 pb-4 pt-1 space-y-3 bg-border/5">
                <div className="h-px w-full bg-border/50 mb-3" />
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Review</span>
                  <p className="text-xs text-heading leading-relaxed break-words font-medium">{r.comment || <em className="text-muted">No comment text</em>}</p>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted mt-1">
                    <Calendar size={10} />
                    <span>{new Date(r.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Product</span>
                  {r.productId ? (
                    <div className="flex items-center gap-2 text-right">
                      <div className="min-w-0">
                        <p className="font-semibold text-heading text-[10px] truncate">{r.productId.name}</p>
                      </div>
                      <img 
                        src={r.productId.image} 
                        alt={r.productId.name} 
                        className="w-6 h-6 rounded object-cover bg-border shrink-0" 
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100/3B1A0F/FAF0EC?text=🍫'; }} 
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted flex items-center gap-1"><ShieldAlert size={10} /> Deleted</span>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleToggleApproval(r)} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${r.isApproved ? 'bg-warning/10 hover:bg-warning/20 text-warning' : 'bg-success/10 hover:bg-success/20 text-success'}`}
                  >
                    {r.isApproved ? <><X size={14} /> Hide</> : <><Check size={14} /> Approve</>}
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(r)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-border/50 hover:bg-border rounded-lg text-xs font-bold text-heading transition-colors"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => setDeleteId(r._id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
        </>
      )}

      {/* Edit Review Modal */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 cursor-pointer" onClick={() => setEditingReview(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-foreground border border-border rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden cursor-default flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleUpdateReviewSubmit}>
                <div className="p-6 border-b border-border bg-card">
                  <h3 className="font-black text-heading text-lg">Update Review</h3>
                  <p className="text-xs text-muted">Moderating review by {editingReview.userName}</p>
                </div>
                <div className="p-6 space-y-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-heading uppercase mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditRating(val)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all border ${val <= editRating ? 'bg-primary border-primary text-button-text' : 'bg-card border-border hover:bg-border/20 text-muted'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment input */}
                  <div>
                    <label className="block text-xs font-bold text-heading uppercase mb-2">Comment/Feedback</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={4}
                      className="w-full bg-input text-foreground border border-border rounded-xl px-4 py-3 outline-none transition-all focus:border-primary text-sm font-medium"
                      placeholder="User feedback text..."
                    />
                  </div>

                  {/* Approved switch */}
                  <div className="flex items-center justify-between p-3 bg-border/10 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-heading">Approval Status</p>
                      <p className="text-[10px] text-muted">Only approved reviews are shown publicly on product pages.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editApproved}
                      onChange={(e) => setEditApproved(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer rounded"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-border bg-card flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
                  <Button type="submit" loading={updating}>Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Review" 
        message="Are you sure you want to permanently delete this customer review? This will also affect the product's ratings average." 
        isLoading={deleting} 
      />
    </div>
  );
};

export default AdminReviews;
