import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Search, Sparkles } from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

const ColorManager = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    hexCode: '',
    isActive: true
  });

  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomCakeColors();
      setColors(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load colors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const resetForm = () => {
    setForm({ name: '', hexCode: '', isActive: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (color) => {
    setEditId(color._id);
    setForm({
      name: color.name,
      hexCode: color.hexCode || '',
      isActive: color.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Color name is required');
    try {
      setSaving(true);
      if (editId) {
        await adminService.updateCustomCakeColor(editId, form);
        toast.success('Color updated successfully!');
      } else {
        await adminService.createCustomCakeColor(form);
        toast.success('Color created successfully!');
      }
      resetForm();
      fetchColors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    try {
      await adminService.deleteCustomCakeColor(id);
      toast.success('Color deleted successfully');
      setColors(prev => prev.filter(c => c._id !== id));
      fetchColors();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filteredColors = colors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-heading text-lg">Manage Colors</h3>
        <div className="flex gap-2">

          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-button-text px-4 py-2 rounded-xl font-black text-sm uppercase hover:brightness-110">
            <Plus size={16} /> Add Color
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h4 className="font-black text-heading text-md mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> {editId ? 'Edit Color' : 'Add New Color'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. Vanilla" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Hex Code (Optional)</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.hexCode || '#ffffff'} onChange={e => setForm({ ...form, hexCode: e.target.value })} className="w-10 h-10 rounded border-0 bg-transparent p-0 cursor-pointer" />
                  <input type="text" value={form.hexCode} onChange={e => setForm({ ...form, hexCode: e.target.value })} className="flex-1 bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="#FFFFFF" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActiveColor" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-primary focus:ring-primary border-input-border bg-input" />
              <label htmlFor="isActiveColor" className="text-sm font-bold text-heading">Active</label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase hover:brightness-110 disabled:opacity-60"><Check size={16} /> Save</button>
              <button type="button" onClick={resetForm} className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-xl font-black text-sm uppercase hover:bg-border/30"><X size={16} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative max-w-sm">
        <input type="text" placeholder="Search colors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-input border border-input-border pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm" />
        <Search size={16} className="absolute left-3 top-3.5 text-muted" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[500px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-left bg-border/20">
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Color</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Name</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Status</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredColors.map(color => (
              <tr key={color._id} className="hover:bg-border/10">
                <td className="px-6 py-4">
                  {color.hexCode && (
                    <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: color.hexCode }}></div>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-sm">{color.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${color.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {color.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleEdit(color)} className="p-1.5 text-muted hover:text-heading"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(color._id)} className="p-1.5 text-muted hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filteredColors.length === 0 && !loading && (
              <tr><td colSpan="4" className="text-center py-6 text-muted font-bold">No colors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredColors.length === 0 && !loading ? (
          <div className="text-center py-6 text-muted font-bold">No colors found.</div>
        ) : (
          filteredColors.map(color => (
            <div key={`mobile-${color._id}`} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full shadow-inner border border-border shrink-0 flex items-center justify-center" 
                  style={{ backgroundColor: color.hexCode || 'transparent' }}
                >
                  {!color.hexCode && <span className="text-xs text-muted">?</span>}
                </div>
                <div>
                  <p className="font-bold text-heading text-sm">{color.name}</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 inline-block ${color.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {color.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(color)} className="p-2 text-muted hover:text-heading bg-border/20 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(color._id)} className="p-2 text-muted hover:text-red-600 bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ColorManager;
