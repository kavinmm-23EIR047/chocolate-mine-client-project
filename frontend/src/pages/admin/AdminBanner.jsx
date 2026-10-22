import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import adminService from '../../services/adminService';
import ImageUpload from '../../components/admin/ImageUpload';
import toast from 'react-hot-toast';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';
import compressImage from '../../utils/compressImage';

const AdminBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    link: '',
    bannerType: 'home',
    displayOrder: 0,
    isActive: true,
    imageFile: null
  });
  const popupBannerExists = banners.some((banner) => banner.bannerType === 'popup');

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await adminService.getBanners();
      setBanners(res.data.data || []);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setForm({
      title: '',
      link: '',
      bannerType: 'home',
      displayOrder: 0,
      isActive: true,
      imageFile: null
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (banner) => {
    setEditId(banner._id);
    setForm({
      title: banner.title,
      link: banner.link || '',
      bannerType: banner.bannerType === 'popup' ? 'popup' : 'home',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive,
      imageFile: null
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Banner title is required');
    if (!editId && !form.imageFile) return toast.error('Image is required');
    if (form.bannerType === 'popup' && !form.link.trim()) return toast.error('Add a redirect link for the popup View Offer button.');
    if (form.bannerType === 'popup' && popupBannerExists && !editId) {
      return toast.error('Only one popup banner is allowed. Edit the existing popup instead.');
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('link', form.link.trim());
      fd.append('bannerType', form.bannerType);
      fd.append('displayOrder', form.displayOrder);
      fd.append('isActive', form.isActive);
      if (form.imageFile) {
        const imageToUpload = form.imageFile instanceof File ? await compressImage(form.imageFile) : form.imageFile;
        fd.append('image', imageToUpload);
      }

      if (editId) {
        await adminService.updateBanner(editId, fd);
        toast.success('Banner updated!');
      } else {
        await adminService.createBanner(fd);
        toast.success('Banner created!');
      }
      resetForm();
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await adminService.deleteBanner(id);
      toast.success('Banner deleted');
      fetchBanners();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminService.toggleBanner(id);
      fetchBanners();
    } catch {
      toast.error('Toggle failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-heading uppercase tracking-tight">Banner Manager</h2>
          <p className="text-muted text-sm mt-1">Manage home slider banners and one site entry popup</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto justify-center whitespace-nowrap flex items-center gap-2 bg-primary text-button-text px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
        >
          <Plus size={16} /> New Banner
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
            <h3 className="font-black text-heading text-lg mb-5">{editId ? 'Edit Banner' : 'New Banner'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Banner Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Summer Collection"
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">
                    Redirect Link {form.bannerType === 'popup' ? '(Required for View Offer)' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                    placeholder="e.g. /shop or https://..."
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Banner Type</label>
                  <select
                    value={form.bannerType}
                    onChange={e => setForm(p => ({ ...p, bannerType: e.target.value }))}
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  >
                    <option value="home">Home Slider</option>
                    <option value="popup" disabled={popupBannerExists && form.bannerType !== 'popup'}>
                      {popupBannerExists && form.bannerType !== 'popup' ? 'Popup Banner (limit reached)' : 'Popup Banner'}
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) }))}
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-black text-heading uppercase tracking-widest">Active</span>
                  </label>
                </div>
              </div>

              <ImageUpload
                label={form.bannerType === 'popup' ? 'Popup Image (one image; square or portrait recommended)' : 'Banner Image (Suggested: 1600x600 for slider)'}
                onChange={(file) => setForm(p => ({ ...p, imageFile: file }))}
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving} aria-busy={saving}
                  className="flex items-center gap-2 bg-primary text-button-text px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all shadow-md"
                >
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Banner'}
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

      {/* Banner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-48" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-muted font-black uppercase tracking-widest border-2 border-dashed border-border rounded-3xl">
          No banners yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner, i) => (
            <motion.div
              key={banner._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!banner.isActive ? 'opacity-60 grayscale-[0.5]' : 'border-border'}`}
            >
              <div className="aspect-[21/9] relative overflow-hidden">
                <img src={getOptimizedCloudinaryUrl(banner.image, 1600)} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">
                    Order: {banner.displayOrder}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                  <div className="w-full">
                    <p className="text-white text-lg font-black uppercase tracking-tight truncate">{banner.title}</p>
                    {banner.link && (
                      <p className="text-white/60 text-[10px] font-bold flex items-center gap-1 mt-0.5 truncate">
                        <ExternalLink size={10} /> {banner.link}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-card/50">
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                  {banner.bannerType === 'promotion' ? 'Retired promotion (hidden)' : `${banner.bannerType === 'popup' ? 'Popup' : 'Home slider'} banner`}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleActive(banner._id)}
                    className="text-muted hover:text-primary transition-colors flex items-center gap-1.5"
                    title={banner.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {banner.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                  </button>
                  <div className="w-[1px] h-4 bg-border" />
                  <button onClick={() => handleEdit(banner)} className="text-muted hover:text-primary transition-colors p-1" title="Edit">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(banner._id)} className="text-muted hover:text-red-500 transition-colors p-1" title="Delete">
                    <Trash2 size={18} />
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

export default AdminBanner;
