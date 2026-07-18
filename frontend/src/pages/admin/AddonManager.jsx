import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import adminService from '../../services/adminService';
import ImageUpload from '../../components/admin/ImageUpload';
import toast from 'react-hot-toast';

const AddonManager = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', imageFile: null });

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAddons();
      setAddons(res.data.data || []);
    } catch {
      toast.error('Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddons(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', imageFile: null });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (addon) => {
    setEditId(addon._id);
    setForm({ name: addon.name, description: addon.description || '', price: addon.price, imageFile: null });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Add-on name is required');
    if (form.price === '') return toast.error('Price is required');
    if (!editId && !form.imageFile) return toast.error('Image is required');

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.description.trim()) fd.append('description', form.description.trim());
      fd.append('price', form.price);
      if (form.imageFile) fd.append('image', form.imageFile);

      if (editId) {
        await adminService.updateAddon(editId, fd);
        toast.success('Add-on updated!');
      } else {
        await adminService.createAddon(fd);
        toast.success('Add-on created!');
      }
      resetForm();
      fetchAddons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this add-on?')) return;
    try {
      await adminService.deleteAddon(id);
      toast.success('Add-on deleted');
      fetchAddons();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggleActive = async (addon) => {
    try {
      const fd = new FormData();
      fd.append('isActive', String(!addon.isActive));
      await adminService.updateAddon(addon._id, fd);
      fetchAddons();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-heading">Add-ons Manager</h2>
          <p className="text-muted text-sm mt-1">Create and manage add-ons for products</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
        >
          <Plus size={16} /> New Add-on
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
            <h3 className="font-black text-heading text-lg mb-5">{editId ? 'Edit Add-on' : 'New Add-on'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Candles"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase tracking-widest">Description (Optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Pack of 10 magic candles"
                  className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                />
              </div>
              <ImageUpload
                label="Add-on Image"
                onChange={(file) => setForm(p => ({ ...p, imageFile: file }))}
              />
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Add-on'}
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

      {/* Addons Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-20 text-muted font-black uppercase tracking-widest">
          No add-ons yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {addons.map((addon, i) => (
            <motion.div
              key={addon._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!addon.isActive ? 'opacity-50' : 'border-border'}`}
            >
              <div className="aspect-square relative overflow-hidden bg-white/5 flex items-center justify-center p-4">
                <img src={addon.image} alt={addon.name} className="w-full h-full object-contain" />
              </div>
              <div className="p-3 border-t border-border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-black text-heading text-sm uppercase tracking-widest truncate">{addon.name}</h4>
                    <p className="text-primary font-bold">₹{addon.price}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
                  <button
                    onClick={() => handleToggleActive(addon)}
                    className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                    title={addon.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {addon.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    <span className="text-[10px] uppercase font-bold tracking-widest">{addon.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(addon)} className="text-muted hover:text-primary transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(addon._id)} className="text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddonManager;
