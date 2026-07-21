import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, RotateCcw, Search, Sparkles, Cake, ChevronDown } from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

const FlavourManager = () => {
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
    category: 'Vanilla Cakes',
    basePrice: '',
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
      basePrice: '',
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
      basePrice: flavour.weights?.find(w => w.kg === 1)?.price?.toString() || flavour.pricePerKg?.toString() || '',
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

    try {
      setSaving(true);
      const data = {
        name: form.name.trim(),
        category: form.category,
        basePrice: parseFloat(form.basePrice),
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
      setFlavours(prev => prev.filter(f => f._id !== id));
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
          <p className="text-muted text-sm mt-1">Manage flavours and 1 Kg prices for custom cakes</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
                <div className="space-y-1.5 col-span-1 md:col-span-3">
                  <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 border-b border-border pb-1">Price Configuration</label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase">1 Kg Price (₹)</label>
                      <input type="number" value={form.basePrice} onChange={e => {
                        setForm(p => ({ ...p, basePrice: e.target.value }));
                      }} placeholder="e.g. 1040" className="w-full bg-input border border-primary/30 px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary outline-none font-bold text-sm" />
                    </div>
                    
                    {/* Read-only previews of calculated prices */}
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
                  
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full min-w-[800px] whitespace-nowrap">
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
                        {categoryFlavours.map((flavour, i) => (
                          <tr key={flavour._id} className="hover:bg-border/10 transition-colors">
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

                  {/* Mobile Accordion */}
                  <div className="lg:hidden flex flex-col gap-2 p-4">
                    {categoryFlavours.map((flavour, i) => (
                      <details key={`mobile-${flavour._id}`} className="bg-card border border-border rounded-xl overflow-hidden group">
                        <summary className="p-4 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-border/5">
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-heading text-sm break-words">{flavour.name}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 inline-block ${flavour.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {flavour.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <ChevronDown size={20} className="text-muted group-open:rotate-180 transition-transform shrink-0" />
                        </summary>
                        
                        <div className="px-4 pb-4 pt-1 space-y-3 bg-border/5">
                          <div className="h-px w-full bg-border/50 mb-3" />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">1 Kg</span>
                              <span className="font-extrabold text-primary text-sm">₹{flavour.weights?.find(w => w.kg === 1)?.price || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">1.5 Kg</span>
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 1.5)?.price || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">2 Kg</span>
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 2)?.price || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">2.5 Kg</span>
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 2.5)?.price || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">3 Kg</span>
                              <span className="font-bold text-heading text-sm">₹{flavour.weights?.find(w => w.kg === 3)?.price || '-'}</span>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-end gap-2">
                            <button onClick={() => handleToggleActive(flavour)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${flavour.isActive ? 'bg-border/50 hover:bg-border text-heading' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'}`}>
                              <Check size={14} /> Toggle
                            </button>
                            <button onClick={() => handleEdit(flavour)} className="flex items-center gap-1.5 px-3 py-1.5 bg-border/50 hover:bg-border rounded-lg text-xs font-bold text-heading transition-colors">
                              <Edit2 size={14} /> Edit
                            </button>
                            <button onClick={() => handleDelete(flavour._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-bold transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default FlavourManager;
