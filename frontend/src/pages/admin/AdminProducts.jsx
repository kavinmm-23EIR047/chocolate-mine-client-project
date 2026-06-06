import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, Star, Award, EyeOff, Cake } from 'lucide-react';
import productService from '../../services/productService';
import { formatCurrency } from '../../utils/helpers';
import { CATEGORIES } from '../../utils/constants';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12, sort };
      if (category) params.category = category;
      let res;
      if (search) {
        res = await productService.search({ q: search });
      } else {
        res = await productService.getAll(params);
      }
      setProducts(res.data.data || []);
      setTotalPages(Math.ceil((res.data.total || 0) / 12));
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await productService.delete(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = useCallback((q) => { setSearch(q); setPage(1); }, []);

  // Get flavour summary for display
  const getFlavourSummary = (product) => {
    if (product.category !== 'cakes' || !product.flavours || product.flavours.length === 0) {
      return null;
    }
    const flavourNames = product.flavours.map(f => f.name).join(', ');
    const totalWeights = product.flavours.reduce((sum, f) => sum + (f.weightOptions?.length || 0), 0);
    return { flavourNames, totalWeights };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading">Products</h2>
          <p className="text-sm text-muted">Manage your product catalog</p>
        </div>
        <Link to="/admin/products/create"><Button icon={Plus}>Add Product</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput onSearch={handleSearch} placeholder="Search products..." className="flex-1 max-w-sm" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="bg-input border border-input-border text-body px-4 py-2.5 rounded-xl focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-input border border-input-border text-body px-4 py-2.5 rounded-xl focus:outline-none">
          <option value="-createdAt">Newest</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
        </select>
      </div>

      {loading ? <TableSkeleton rows={6} cols={7} /> : products.length === 0 ? (
        <EmptyState title="No products found" message="Start by adding your first product." action={<Link to="/admin/products/create"><Button icon={Plus}>Add Product</Button></Link>} />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-border/20">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Flavours</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Occasion</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted uppercase">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p, i) => {
                  const flavourSummary = getFlavourSummary(p);
                  return (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-border/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-border" onError={(e) => { e.target.src = 'https://placehold.co/100x100/3B1A0F/FAF0EC?text=🍫'; }} />
                          <div><p className="font-bold text-heading text-sm">{p.name}</p><p className="text-xs text-muted">{p.slug}</p></div>
                        </div>
                       </td>
                      <td className="px-4 py-3"><Badge>{p.category}</Badge></td>
                      <td className="px-4 py-3">
                        {p.category === 'cakes' && flavourSummary ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                              <Cake size={12} />
                              <span>{flavourSummary.flavourNames}</span>
                            </div>
                            <span className="text-[10px] text-muted">
                              {flavourSummary.totalWeights} weight options
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.occasion && p.occasion.length > 0 ? (
                            p.occasion.map(o => <Badge key={o} variant="info">{o}</Badge>)
                          ) : (
                            <Badge variant="info">none</Badge>
                          )}
                        </div>
                       </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{p.location}</Badge></td>
                      <td className="px-4 py-3"><span className="font-bold text-heading">{formatCurrency(p.price)}</span></td>
                      <td className="px-4 py-3"><span className={`font-bold text-xs px-2 py-1 rounded-full ${p.stock ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{p.stock ? 'In Stock' : 'Out of Stock'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.featured && <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Star size={12} fill="currentColor" />Featured</span>}
                          {p.bestseller && <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Award size={12} />Best</span>}
                          {!p.isActive && <span className="text-xs font-bold text-error flex items-center gap-1"><EyeOff size={12} />Hidden</span>}
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/products/edit/${p._id}`}><button className="p-2 hover:bg-border rounded-xl text-muted hover:text-heading"><Edit3 size={16} /></button></Link>
                          <button onClick={() => setDeleteId(p._id)} className="p-2 hover:bg-error/10 rounded-xl text-muted hover:text-error"><Trash2 size={16} /></button>
                        </div>
                       </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure? This cannot be undone." isLoading={deleting} />
    </div>
  );
};

export default AdminProducts;