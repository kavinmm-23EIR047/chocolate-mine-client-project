import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Sparkles } from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

const WeightManager = () => {
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    weightLabel: '',
    weightValue: '',
    price: 0,
    isActive: true,
    displayOrder: 0
  });

  const fetchWeights = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomCakeWeights();
      setWeights(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load weights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const resetForm = () => {
    setForm({ weightLabel: '', weightValue: '', price: 0, isActive: true, displayOrder: 0 });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (weight) => {
    setEditId(weight._id);
    setForm({
      weightLabel: weight.weightLabel,
      weightValue: weight.weightValue,
      price: weight.price || 0,
      isActive: weight.isActive,
      displayOrder: weight.displayOrder
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.weightLabel.trim() || form.weightValue === '') return toast.error('Label and Value are required');
    try {
      setSaving(true);
      if (editId) {
        await adminService.updateCustomCakeWeight(editId, form);
        toast.success('Weight updated successfully!');
      } else {
        await adminService.createCustomCakeWeight(form);
        toast.success('Weight created successfully!');
      }
      resetForm();
      fetchWeights();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this weight? It will delete related pricing.')) return;
    try {
      await adminService.deleteCustomCakeWeight(id);
      toast.success('Weight deleted successfully');
      fetchWeights();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-heading text-lg">Manage Weights</h3>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-button-text px-4 py-2 rounded-xl font-black text-sm uppercase hover:brightness-110">
          <Plus size={16} /> Add Weight
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h4 className="font-black text-heading text-md mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> {editId ? 'Edit Weight' : 'Add New Weight'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Label</label>
                <input type="text" value={form.weightLabel} onChange={e => setForm({ ...form, weightLabel: e.target.value })} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. 1 Kg" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Numeric Value (Kg)</label>
                <input type="number" step="0.1" value={form.weightValue} onChange={e => setForm({ ...form, weightValue: e.target.value })} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. 1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted uppercase">Adjustment Price (₹)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. 500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActiveWeight" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-primary focus:ring-primary border-input-border bg-input" />
              <label htmlFor="isActiveWeight" className="text-sm font-bold text-heading">Active</label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase hover:brightness-110 disabled:opacity-60"><Check size={16} /> Save</button>
              <button type="button" onClick={resetForm} className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-xl font-black text-sm uppercase hover:bg-border/30"><X size={16} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left bg-border/20">
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Label</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Value</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Price</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Order</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase">Status</th>
              <th className="px-6 py-3.5 text-xs font-black text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {weights.map(weight => (
              <tr key={weight._id} className="hover:bg-border/10">
                <td className="px-6 py-4 font-bold text-sm">{weight.weightLabel}</td>
                <td className="px-6 py-4 font-bold text-sm">{weight.weightValue}</td>
                <td className="px-6 py-4 font-bold text-sm text-primary">₹{weight.price || 0}</td>
                <td className="px-6 py-4 font-bold text-sm">{weight.displayOrder}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${weight.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {weight.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleEdit(weight)} className="p-1.5 text-muted hover:text-heading"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(weight._id)} className="p-1.5 text-muted hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {weights.length === 0 && !loading && (
              <tr><td colSpan="6" className="text-center py-6 text-muted font-bold">No weights found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeightManager;
