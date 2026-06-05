import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, Search, Sparkles, Cake } from 'lucide-react';
import toast from 'react-hot-toast';

import adminService from '../../../services/adminService';

const ThemeFlavourManager = ({ themeId, flavours, setFlavours, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Vanilla Cakes',
    basePrice: '',
    isActive: true
  });

  const resetForm = () => {
    setForm({
      name: '',
      category: 'Vanilla Cakes',
      basePrice: '',
      isActive: true
    });
    setEditIndex(null);
    setShowForm(false);
  };

  const handleEdit = (flavour, index) => {
    setEditIndex(index);
    setForm({
      name: flavour.name,
      category: flavour.category,
      basePrice: flavour.weights?.find(w => w.kg === 1)?.price?.toString() || '',
      isActive: flavour.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Flavour name is required');
    if (!form.category) return toast.error('Category is required');
    if (!form.basePrice || isNaN(form.basePrice) || parseFloat(form.basePrice) < 0) {
      return toast.error('Please enter a valid 1 Kg base price');
    }

    setSaving(true);
    try {
      const basePrice = parseFloat(form.basePrice);
      const newFlavour = {
        name: form.name.trim(),
        category: form.category,
        isActive: form.isActive,
        weights: [
          { kg: 1, price: basePrice },
          { kg: 1.5, price: basePrice * 1.5 },
          { kg: 2, price: basePrice * 2 },
          { kg: 2.5, price: basePrice * 2.5 },
          { kg: 3, price: basePrice * 3 },
        ]
      };

      if (editIndex !== null) {
        const updated = [...flavours];
        if (updated[editIndex]._id) newFlavour._id = updated[editIndex]._id;
        
        if (themeId && newFlavour._id) {
          await adminService.updateCustomCakeThemeFlavour(themeId, newFlavour._id, newFlavour);
        }
        
        updated[editIndex] = newFlavour;
        setFlavours(updated);
        toast.success('Theme flavour updated!');
      } else {
        if (themeId) {
          const res = await adminService.addCustomCakeThemeFlavour(themeId, newFlavour);
          setFlavours([...flavours, res.data.data]);
        } else {
          setFlavours([...flavours, newFlavour]);
        }
        toast.success('Theme flavour added!');
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flavour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this theme flavour?')) return;
    try {
      const flavour = flavours[index];
      if (themeId && flavour._id) {
        await adminService.deleteCustomCakeThemeFlavour(themeId, flavour._id);
      }
      const updated = flavours.filter((_, i) => i !== index);
      setFlavours(updated);
      toast.success('Flavour removed from theme');
    } catch (err) {
      toast.error('Failed to delete flavour');
    }
  };

  const handleToggleActive = async (index) => {
    try {
      const flavour = flavours[index];
      const newStatus = !flavour.isActive;
      
      if (themeId && flavour._id) {
        await adminService.updateCustomCakeThemeFlavour(themeId, flavour._id, { isActive: newStatus });
      }
      
      const updated = [...flavours];
      updated[index].isActive = newStatus;
      setFlavours(updated);
      toast.success(`Flavour ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredFlavours = flavours.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === '' || f.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Vanilla Cakes', 'Chocolate Cakes', 'Red Velvet Cakes'];

  const fetchDefaultFlavours = async () => {
    try {
      setSaving(true);
      const res = await adminService.getCustomCakeFlavours();
      const defaults = res.data.data || [];
      
      const newFlavours = defaults.filter(f => f.isActive).map(f => ({
        name: f.name,
        category: f.category,
        weights: f.weights,
        isActive: f.isActive
      }));

      // If we're editing an existing theme, save them to the DB immediately
      if (themeId) {
        toast.loading('Importing default flavours...', { id: 'import-flavours' });
        for (const f of newFlavours) {
          await adminService.addCustomCakeThemeFlavour(themeId, f);
        }
        toast.success('Default flavours imported!', { id: 'import-flavours' });
        // The page might need a refresh or we can fetch the theme again to get the IDs
        window.location.reload(); 
      } else {
        setFlavours(newFlavours);
        toast.success('Default flavours loaded!');
      }
    } catch (err) {
      toast.error('Failed to fetch default flavours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading flex items-center gap-2">
            <Cake className="text-primary" /> Theme-Specific Flavours
          </h2>
          <p className="text-muted text-sm mt-1">Manage flavours that will only be available for this specific theme.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {flavours.length === 0 && (
            <button
              onClick={fetchDefaultFlavours}
              disabled={saving}
              className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm"
            >
              Fetch Default Flavours
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
          >
            <Plus size={16} /> Add Flavour
          </button>
        </div>
      </div>

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
              {editIndex !== null ? 'Edit Theme Flavour' : 'Add New Theme Flavour'}
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
                <div className="space-y-1.5 col-span-1 md:col-span-3">
                  <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 border-b border-border pb-1">Price Configuration</label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase">1 Kg Price (₹)</label>
                      <input type="number" value={form.basePrice} onChange={e => {
                        setForm(p => ({ ...p, basePrice: e.target.value }));
                      }} placeholder="e.g. 1040" className="w-full bg-input border border-primary/30 px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-1 opacity-70">
                      <label className="text-[10px] font-black text-muted uppercase">1.5 Kg</label>
                      <input type="text" readOnly value={`₹${(parseFloat(form.basePrice) || 0) * 1.5}`} className="w-full bg-border/10 border border-input-border px-3 py-2 rounded-lg text-muted font-bold text-sm cursor-not-allowed" />
                    </div>
                    <div className="space-y-1 opacity-70">
                      <label className="text-[10px] font-black text-muted uppercase">2 Kg</label>
                      <input type="text" readOnly value={`₹${(parseFloat(form.basePrice) || 0) * 2}`} className="w-full bg-border/10 border border-input-border px-3 py-2 rounded-lg text-muted font-bold text-sm cursor-not-allowed" />
                    </div>
                    <div className="space-y-1 opacity-70">
                      <label className="text-[10px] font-black text-muted uppercase">2.5 Kg</label>
                      <input type="text" readOnly value={`₹${(parseFloat(form.basePrice) || 0) * 2.5}`} className="w-full bg-border/10 border border-input-border px-3 py-2 rounded-lg text-muted font-bold text-sm cursor-not-allowed" />
                    </div>
                    <div className="space-y-1 opacity-70">
                      <label className="text-[10px] font-black text-muted uppercase">3 Kg</label>
                      <input type="text" readOnly value={`₹${(parseFloat(form.basePrice) || 0) * 3}`} className="w-full bg-border/10 border border-input-border px-3 py-2 rounded-lg text-muted font-bold text-sm cursor-not-allowed" />
                    </div>
                  </div>
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
                  className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  <Check size={16} /> Save Flavour
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

      {flavours.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl text-muted font-bold flex flex-col items-center justify-center gap-4">
          <Cake size={48} className="text-muted opacity-30" />
          <div>
            <p className="text-heading text-lg font-black">No Theme Flavours found</p>
            <p className="text-sm mt-1">Add a flavor specific to this theme.</p>
          </div>
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
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">1 Kg</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">1.5 Kg</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">2 Kg</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">2.5 Kg</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">3 Kg</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Status</th>
                          <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categoryFlavours.map((flavour) => {
                           // Find the actual index in the parent array for editing/deleting
                           const originalIndex = flavours.findIndex(f => f === flavour);
                           return (
                          <tr key={originalIndex} className="hover:bg-border/10 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">{flavour.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-extrabold text-primary text-sm">₹{flavour.weights?.find(w => w.kg === 1)?.price || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 1.5)?.price || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 2)?.price || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 2.5)?.price || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 3)?.price || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleActive(originalIndex)}
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
                                  onClick={() => handleEdit(flavour, originalIndex)}
                                  className="p-1.5 hover:bg-border rounded-lg text-muted hover:text-heading transition-colors"
                                  title="Edit flavour"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(originalIndex)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-600 transition-colors"
                                  title="Delete flavour"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )})}
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

export default ThemeFlavourManager;
