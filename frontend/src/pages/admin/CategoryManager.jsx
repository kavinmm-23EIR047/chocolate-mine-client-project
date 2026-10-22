import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import adminService from '../../services/adminService';
import ImageUpload from '../../components/admin/ImageUpload';
import toast from 'react-hot-toast';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';
import compressImage from '../../utils/compressImage';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', label: '', categoryType: 'both', subCategories: '', allowCakeMessage: false, imageFile: null, currentImage: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCategories();
      setCategories(res.data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: '', label: '', categoryType: 'both', subCategories: '', allowCakeMessage: false, imageFile: null, currentImage: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (cat) => {
    setEditId(cat._id);
    const subStr = Array.isArray(cat.subCategories) ? cat.subCategories.join(', ') : (cat.subCategories || '');
    setForm({ 
      name: cat.name, 
      label: cat.label || cat.name, 
      categoryType: cat.categoryType || 'both', 
      subCategories: subStr, 
      allowCakeMessage: !!cat.allowCakeMessage, 
      imageFile: null,
      currentImage: cat.image || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    if (!editId && !form.imageFile) return toast.error('Category image is required');

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('label', form.label.trim() || form.name.trim());
      fd.append('categoryType', form.categoryType || 'both');
      fd.append('allowCakeMessage', String(form.allowCakeMessage));
      
      const subList = form.subCategories
        ? form.subCategories.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];
      fd.append('subCategories', JSON.stringify(subList));
      
      if (form.imageFile) {
        let imageToUpload = form.imageFile;
        if (form.imageFile instanceof File) {
          try {
            imageToUpload = await compressImage(form.imageFile);
          } catch (compressErr) {
            console.warn('Compression skipped, using original file:', compressErr);
          }
        }
        fd.append('image', imageToUpload);
      }

      if (editId) {
        await adminService.updateCategory(editId, fd);
        toast.success('Category updated successfully!');
      } else {
        await adminService.createCategory(fd);
        toast.success('Category created successfully!');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error('Category save failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminService.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const fd = new FormData();
      fd.append('active', String(!cat.active));
      await adminService.updateCategory(cat._id, fd);
      toast.success(`Category ${!cat.active ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-heading">Category Manager</h2>
          <p className="text-muted text-sm mt-1">Create and manage product categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto justify-center whitespace-nowrap flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm"
          >
            <h3 className="font-black text-heading text-lg mb-5">{editId ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Name (slug)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. cakes"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Display Label</label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Premium Cakes"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Applies To</label>
                  <select
                    value={form.categoryType}
                    onChange={e => setForm(p => ({ ...p, categoryType: e.target.value }))}
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold cursor-pointer"
                  >
                    <option value="both">Both (Ordinary & Custom)</option>
                    <option value="ordinary">Ordinary Cake Only</option>
                    <option value="custom">Custom Cake Only</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase tracking-widest">Subcategories (Comma Separated)</label>
                <input
                  type="text"
                  value={form.subCategories}
                  onChange={e => setForm(p => ({ ...p, subCategories: e.target.value }))}
                  placeholder="e.g. mini-cakes, cookies, tres-leches, brownie"
                  className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                />
              </div>
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="allowCakeMessage"
                  checked={form.allowCakeMessage}
                  onChange={e => setForm(p => ({ ...p, allowCakeMessage: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="allowCakeMessage" className="text-xs font-black text-muted uppercase tracking-widest cursor-pointer select-none">
                  Enable "Message on Cake" input field for products in this category
                </label>
              </div>
              <ImageUpload
                label="Category Image"
                value={form.imageFile || form.currentImage}
                onChange={(file) => setForm(p => ({ ...p, imageFile: file }))}
              />
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving} aria-busy={saving}
                  className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Category'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-border/30 transition-all"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-muted font-black uppercase tracking-widest">
          No categories yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!cat.active ? 'opacity-50' : ''}`}
            >
              <div className="aspect-video relative overflow-hidden">
                <img src={getOptimizedCloudinaryUrl(cat.image, 300)} alt={cat.label || cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-3">
                  <span className="self-end text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-black/60 text-amber-300 backdrop-blur-sm">
                    {cat.categoryType === 'ordinary' ? 'Ordinary' : cat.categoryType === 'custom' ? 'Custom' : 'Both'}
                  </span>
                  <p className="text-white text-sm font-black uppercase tracking-widest truncate">{cat.label || cat.name}</p>
                </div>
              </div>
              {Array.isArray(cat.subCategories) && cat.subCategories.length > 0 && (
                <div className="px-3 pb-1.5 flex flex-wrap gap-1">
                  {cat.subCategories.map((sub, sIdx) => (
                    <span key={sIdx} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                      {sub.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              {cat.allowCakeMessage && (
                <div className="px-3 pb-1">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                    🎂 Msg Field Enabled
                  </span>
                </div>
              )}
              <div className="p-3 pt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest truncate">{cat.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className="text-muted hover:text-primary transition-colors"
                    title={cat.active ? 'Deactivate' : 'Activate'}
                  >
                    {cat.active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => handleEdit(cat)} className="text-muted hover:text-primary transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat._id)} className="text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
