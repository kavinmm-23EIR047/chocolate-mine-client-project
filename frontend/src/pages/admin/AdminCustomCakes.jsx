import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, RotateCcw, Search, Sparkles, Cake } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminCustomCakes = () => {
  const [flavours, setFlavours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: 'Vanilla Cakes',
    pricePerKg: '',
    isActive: true
  });

  const fetchFlavours = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomCakeFlavours();
      setFlavours(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load custom cake flavours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlavours();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      category: 'Vanilla Cakes',
      pricePerKg: '',
      isActive: true
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (flavour) => {
    setEditId(flavour._id);
    setForm({
      name: flavour.name,
      category: flavour.category,
      pricePerKg: flavour.pricePerKg.toString(),
      isActive: flavour.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Flavour name is required');
    if (!form.category) return toast.error('Category is required');
    if (!form.pricePerKg || isNaN(form.pricePerKg) || parseFloat(form.pricePerKg) < 0) {
      return toast.error('Please enter a valid price');
    }

    try {
      setSaving(true);
      const data = {
        name: form.name.trim(),
        category: form.category,
        pricePerKg: parseFloat(form.pricePerKg),
        isActive: form.isActive
      };

      if (editId) {
        await adminService.updateCustomCakeFlavour(editId, data);
        toast.success('Flavour updated successfully!');
      } else {
        await adminService.createCustomCakeFlavour(data);
        toast.success('Flavour created successfully!');
      }
      resetForm();
      fetchFlavours();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom cake flavour?')) return;
    try {
      await adminService.deleteCustomCakeFlavour(id);
      toast.success('Flavour deleted successfully');
      fetchFlavours();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleToggleActive = async (flavour) => {
    try {
      await adminService.updateCustomCakeFlavour(flavour._id, {
        isActive: !flavour.isActive
      });
      toast.success(`Flavour ${!flavour.isActive ? 'activated' : 'deactivated'}`);
      fetchFlavours();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleSeedFlavours = async () => {
    if (!window.confirm('This will replace all existing custom cake flavours with the default 36 flavours. Proceed?')) return;
    try {
      setSeeding(true);
      const res = await adminService.seedCustomCakeFlavours();
      toast.success(`Successfully seeded ${res.data.count} flavours!`);
      fetchFlavours();
    } catch (err) {
      toast.error('Failed to seed flavours');
    } finally {
      setSeeding(false);
    }
  };

  // Filter flavours
  const filteredFlavours = flavours.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === '' || f.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category for list
  const categories = ['Vanilla Cakes', 'Chocolate Cakes', 'Red Velvet Cakes'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading flex items-center gap-2">
            <Cake className="text-primary" /> Custom Cake Flavours
          </h2>
          <p className="text-muted text-sm mt-1">Manage flavours and Half-Kg prices for custom cakes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSeedFlavours}
            disabled={seeding || loading}
            className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/5 disabled:opacity-60 transition-all"
          >
            <RotateCcw size={16} /> {seeding ? 'Seeding...' : 'Seed Default Flavours'}
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
          >
            <Plus size={16} /> Add Flavour
          </button>
        </div>
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
            <h3 className="font-black text-heading text-lg mb-5 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              {editId ? 'Edit Custom Flavour' : 'Add New Custom Flavour'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Flavour Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Classic Vanilla"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold cursor-pointer"
                  >
                    <option value="Vanilla Cakes">Vanilla Cakes</option>
                    <option value="Chocolate Cakes">Chocolate Cakes</option>
                    <option value="Red Velvet Cakes">Red Velvet Cakes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Half-Kg Price (₹)</label>
                  <input
                    type="number"
                    value={form.pricePerKg}
                    onChange={e => setForm(p => ({ ...p, pricePerKg: e.target.value }))}
                    placeholder="e.g. 520"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-input-border bg-input cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-heading cursor-pointer select-none">
                  Available for selection
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Flavour'}
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

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search custom flavours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-input-border pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
          />
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
        </div>
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="bg-input border border-input-border text-body px-4 py-2.5 rounded-xl focus:outline-none font-bold text-sm cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-border rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-border rounded"></div>
            ))}
          </div>
        </div>
      ) : flavours.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl text-muted font-bold flex flex-col items-center justify-center gap-4">
          <Cake size={48} className="text-muted opacity-30" />
          <div>
            <p className="text-heading text-lg font-black">No Custom Cake Flavours found</p>
            <p className="text-sm mt-1">Seeding the default database is recommended to get started.</p>
          </div>
          <button
            onClick={handleSeedFlavours}
            disabled={seeding}
            className="flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-md mt-2"
          >
            <RotateCcw size={16} /> {seeding ? 'Seeding...' : 'Seed Default Flavours'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories
            .filter(cat => selectedCategoryFilter === '' || cat === selectedCategoryFilter)
            .map(categoryName => {
              const categoryFlavours = filteredFlavours.filter(f => f.category === categoryName);
              if (categoryFlavours.length === 0) return null;
              
              return (
                <div key={categoryName} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-border/20 px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-black text-heading text-base uppercase tracking-wider">{categoryName}</h3>
                    <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-full">
                      {categoryFlavours.length} Flavours
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Name</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Base Price (Half Kg)</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Status</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categoryFlavours.map((flavour, i) => (
                          <tr key={flavour._id} className="hover:bg-border/10 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">{flavour.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-extrabold text-heading text-sm">₹{flavour.pricePerKg}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleActive(flavour)}
                                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider transition-all select-none ${
                                  flavour.isActive
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {flavour.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => handleEdit(flavour)}
                                  className="p-1.5 hover:bg-border rounded-lg text-muted hover:text-heading transition-colors"
                                  title="Edit flavour"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(flavour._id)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-600 transition-colors"
                                  title="Delete flavour"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomCakes;
