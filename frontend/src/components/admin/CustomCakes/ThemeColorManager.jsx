import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, Search, Sparkles, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

import adminService from '../../../services/adminService';

const ThemeColorManager = ({ themeId, colors, setColors, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    hexCode: '#000000',
    isActive: true
  });

  const resetForm = () => {
    setForm({
      name: '',
      hexCode: '#000000',
      isActive: true
    });
    setEditIndex(null);
    setShowForm(false);
  };

  const handleEdit = (color, index) => {
    setEditIndex(index);
    setForm({
      name: color.name,
      hexCode: color.hexCode || '#000000',
      isActive: color.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Color name is required');
    if (!form.hexCode) return toast.error('Hex code is required');

    setSaving(true);
    try {
      const newColor = {
        name: form.name.trim(),
        hexCode: form.hexCode,
        isActive: form.isActive,
        price: 0,
        images: { tier1: null, tier2: null, tier3: null }
      };

      if (editIndex !== null) {
        const updated = [...colors];
        if (updated[editIndex]._id) newColor._id = updated[editIndex]._id;
        
        if (themeId && newColor._id) {
          await adminService.updateCustomCakeThemeColor(themeId, newColor._id, newColor);
        }
        
        // Preserve existing images and price from the old color
        newColor.images = updated[editIndex].images;
        newColor.price = updated[editIndex].price;

        updated[editIndex] = newColor;
        setColors(updated);
        toast.success('Theme color updated!');
      } else {
        if (themeId) {
          const res = await adminService.addCustomCakeThemeColor(themeId, newColor);
          setColors([...colors, res.data.data]);
        } else {
          setColors([...colors, newColor]);
        }
        toast.success('Theme color added!');
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save color');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this theme color? This will also remove its uploaded images.')) return;
    try {
      const color = colors[index];
      if (themeId && color._id) {
        await adminService.deleteCustomCakeThemeColor(themeId, color._id);
      }
      const updated = colors.filter((_, i) => i !== index);
      setColors(updated);
      toast.success('Color removed from theme');
    } catch (err) {
      toast.error('Failed to delete color');
    }
  };

  const handleToggleActive = async (index) => {
    try {
      const color = colors[index];
      const newStatus = !color.isActive;
      
      if (themeId && color._id) {
        await adminService.updateCustomCakeThemeColor(themeId, color._id, { isActive: newStatus });
      }
      
      const updated = [...colors];
      updated[index].isActive = newStatus;
      setColors(updated);
      toast.success(`Color ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const fetchDefaultColors = async () => {
    try {
      setSaving(true);
      const res = await adminService.getCustomCakeColors();
      const defaults = res.data.data || [];
      
      const newColors = defaults.filter(c => c.isActive).map(c => ({
        name: c.name,
        hexCode: c.hexCode,
        isActive: c.isActive,
        price: 0,
        images: { tier1: null, tier2: null, tier3: null }
      }));

      if (themeId) {
        toast.loading('Importing default colors...', { id: 'import-colors' });
        for (const c of newColors) {
          await adminService.addCustomCakeThemeColor(themeId, c);
        }
        toast.success('Default colors imported!', { id: 'import-colors' });
        window.location.reload(); 
      } else {
        setColors(newColors);
        toast.success('Default colors loaded!');
      }
    } catch (err) {
      toast.error('Failed to fetch default colors');
    } finally {
      setSaving(false);
    }
  };

  const filteredColors = colors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading flex items-center gap-2">
            <Palette className="text-primary" /> Theme-Specific Colors
          </h2>
          <p className="text-muted text-sm mt-1">Manage colors that will only be available for this specific theme.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.length === 0 && (
            <button
              onClick={fetchDefaultColors}
              disabled={saving}
              className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm"
            >
              Fetch Default Colors
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
          >
            <Plus size={16} /> Add Color
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
              {editIndex !== null ? 'Edit Theme Color' : 'Add New Theme Color'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Color Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Lavender"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Hex Code</label>
                  <div className="flex items-center gap-3 bg-input border border-input-border p-2 rounded-xl">
                    <input
                      type="color"
                      value={form.hexCode}
                      onChange={e => setForm(p => ({ ...p, hexCode: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                    />
                    <input
                      type="text"
                      value={form.hexCode}
                      onChange={e => setForm(p => ({ ...p, hexCode: e.target.value }))}
                      className="bg-transparent outline-none font-bold flex-1"
                    />
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
                  <Check size={16} /> Save Color
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

      <div className="relative flex-1 max-w-sm">
        <input
          type="text"
          placeholder="Search custom colors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-input border border-input-border pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
        />
        <Search size={16} className="absolute left-3 top-3.5 text-muted" />
      </div>

      {colors.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl text-muted font-bold flex flex-col items-center justify-center gap-4">
          <Palette size={48} className="text-muted opacity-30" />
          <div>
            <p className="text-heading text-lg font-black">No Theme Colors found</p>
            <p className="text-sm mt-1">Add a color specific to this theme.</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Color</th>
                <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Name</th>
                <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Hex Code</th>
                <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-xs font-black text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredColors.map((color) => {
                const originalIndex = colors.findIndex(c => c === color);
                return (
                  <tr key={originalIndex} className="hover:bg-border/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: color.hexCode }}></div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-heading text-sm">{color.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-muted text-sm font-mono">{color.hexCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(originalIndex)}
                        className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider transition-all select-none ${
                          color.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {color.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEdit(color, originalIndex)}
                          className="p-1.5 hover:bg-border rounded-lg text-muted hover:text-heading transition-colors"
                          title="Edit color"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(originalIndex)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-600 transition-colors"
                          title="Delete color"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ThemeColorManager;
