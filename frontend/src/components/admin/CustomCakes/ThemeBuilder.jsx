import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Image as ImageIcon, Plus, Edit2, Trash2, UploadCloud } from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import ThemeColorManager from './ThemeColorManager';
import ThemeFlavourManager from './ThemeFlavourManager';

const ThemeBuilder = ({ themeId, onBack }) => {
  const [theme, setTheme] = useState({
    name: '',
    description: '',
    isActive: true,
    basePrice: 0,
    displayOrder: 0,
    category: [],
    tiers: {
      tier1: { isActive: true, price: 0 },
      tier2: { isActive: false, price: 0 },
      tier3: { isActive: false, price: 0 }
    },
    flavors: [],
    colors: []
  });

  const [categories, setCategories] = useState([]);

  const [globalColors, setGlobalColors] = useState([]);
  const [themeColors, setThemeColors] = useState([]); // Kept for backwards-compatible loading of old colors if needed

  const [pendingColorMappings, setPendingColorMappings] = useState({});
  const [editingMappingIndex, setEditingMappingIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals for global management
  const [showColorModal, setShowColorModal] = useState(false);
  const [showFlavourModal, setShowFlavourModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [themeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await adminService.seedCustomCakeDefaults(); // Ensure defaults exist
      
      const [colorsRes, categoriesRes] = await Promise.all([
        adminService.getCustomCakeColors(),
        adminService.getCategories({ type: 'custom' })
      ]);

      setCategories(categoriesRes.data?.data || []);
      setGlobalColors(colorsRes.data?.data || []);

      if (themeId) {
        const themesRes = await adminService.getCustomCakeThemes();
        const existingTheme = themesRes.data.data.find(t => t._id === themeId);
        if (existingTheme) {
          setTheme({
            ...existingTheme,
            category: existingTheme.category || [],
            flavors: existingTheme.flavors || [],
            colors: existingTheme.colors || []
          });
          setThemeColors(existingTheme.colors || []);
        }
      } else {
        // Clean initial state for new theme - colors and flavors added as configured by admin
        setTheme(prev => ({
          ...prev,
          flavors: [],
          colors: []
        }));
      }
    } catch (error) {
      console.error('Error loading theme builder data:', error);
      toast.error('Failed to load theme data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!theme.name.trim()) return toast.error('Theme name is required');
    try {
      setSaving(true);
      let savedThemeId = themeId;
      
      // Save or Create Theme
      if (themeId) {
        await adminService.updateCustomCakeTheme(themeId, theme);
      } else {
        const res = await adminService.createCustomCakeTheme(theme);
        savedThemeId = res.data.data._id;
        // Fetch the fresh theme to get the newly generated color IDs
        const freshThemesRes = await adminService.getCustomCakeThemes();
        const freshTheme = freshThemesRes.data.data.find(t => t._id === savedThemeId);
        if (freshTheme) {
          setTheme(freshTheme);
        }
      }

      // Upload pending color images
      const currentColors = themeId ? theme.colors : (await adminService.getCustomCakeThemes()).data.data.find(t => t._id === savedThemeId)?.colors || [];
      
      const uploadEntries = Object.entries(pendingColorMappings).filter(([, data]) => isMappingReadyToSave(data));
      if (uploadEntries.length > 0) {
        toast.loading('Uploading images...', { id: 'upload-toast' });
        for (const [colorName, data] of uploadEntries) {
          const colorRecord = currentColors.find(c => c.name === colorName);
          if (!colorRecord || !colorRecord._id) continue;

          const formData = new FormData();
          formData.append('price', data.price);
          if (data.files.tier1) formData.append('tier1Image', data.files.tier1);
          if (data.files.tier2) formData.append('tier2Image', data.files.tier2);
          if (data.files.tier3) formData.append('tier3Image', data.files.tier3);
          await adminService.uploadCustomCakeThemeColorImages(savedThemeId, colorRecord._id, formData);
        }
        toast.success('Images uploaded successfully', { id: 'upload-toast' });
      }

      toast.success(themeId ? 'Theme updated successfully' : 'Theme created successfully');
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPendingMapping = (colorName, files, price) => {
    setPendingColorMappings(prev => ({
      ...prev,
      [colorName]: {
        files: { ...prev[colorName]?.files, ...files },
        price: price === '' ? '' : (parseFloat(price) || prev[colorName]?.price || ''),
        previewUrls: { 
          tier1: files.tier1 ? URL.createObjectURL(files.tier1) : prev[colorName]?.previewUrls?.tier1,
          tier2: files.tier2 ? URL.createObjectURL(files.tier2) : prev[colorName]?.previewUrls?.tier2,
          tier3: files.tier3 ? URL.createObjectURL(files.tier3) : prev[colorName]?.previewUrls?.tier3
        }
      }
    }));
  };

  const getColorIndexByName = (colorName) => theme.colors.findIndex(c => c.name === colorName);

  const ensureEditingIndex = (colorName) => {
    const index = getColorIndexByName(colorName);
    if (index !== -1 && editingMappingIndex !== index) {
      setEditingMappingIndex(index);
    }
  };

  const handleFileInputChange = (colorName, field, file) => {
    if (!file) return;
    const prev = pendingColorMappings[colorName] || { files: {}, price: '', previewUrls: {} };
    ensureEditingIndex(colorName);
    handleSetPendingMapping(colorName, { [field]: file }, prev.price === 0 ? 0 : (prev.price || ''));
  };

  const handleRemoveTierFile = (colorName, field) => {
    setPendingColorMappings(prev => {
      const current = prev[colorName];
      if (!current) return prev;
      const files = { ...current.files };
      const previewUrls = { ...current.previewUrls };
      delete files[field];
      delete previewUrls[field];
      return {
        ...prev,
        [colorName]: {
          ...current,
          files,
          previewUrls,
          price: current.price || 0
        }
      };
    });
  };

  const isMappingReadyToSave = mapping => {
    if (!mapping) return false;
    const fileCount = Object.values(mapping.files || {}).filter(Boolean).length;
    return fileCount > 0 && (mapping.price || 0) >= 0;
  };

  const handlePriceInputChange = (colorName, price) => {
    ensureEditingIndex(colorName);
    setPendingColorMappings(prev => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        files: prev[colorName]?.files || {},
        previewUrls: prev[colorName]?.previewUrls || {},
        price: price === '' ? '' : parseFloat(price)
      }
    }));
  };

  const saveThemeColorMapping = async (colorName, files, price) => {
    const colorIndex = theme.colors.findIndex(c => c.name === colorName);
    const color = theme.colors[colorIndex];
    const hasExistingImages = Boolean(color?.images?.tier1 || color?.images?.tier2 || color?.images?.tier3);
    const hasFiles = Boolean(files.tier1 || files.tier2 || files.tier3);
    const numericPrice = parseFloat(price) || 0;

    if (!themeId || !color?._id) {
      if (numericPrice < 0) {
        throw new Error('Please enter a valid price before saving.');
      }
      handleSetPendingMapping(colorName, files, numericPrice);
      return null;
    }
    if (numericPrice < 0) {
      throw new Error('Please enter a valid price before saving.');
    }

    const formData = new FormData();
    formData.append('price', numericPrice);
    if (files.tier1) formData.append('tier1Image', files.tier1);
    if (files.tier2) formData.append('tier2Image', files.tier2);
    if (files.tier3) formData.append('tier3Image', files.tier3);

    const response = await adminService.uploadCustomCakeThemeColorImages(themeId, color._id, formData);
    const savedColor = response.data.data;

    setTheme(prev => {
      const next = { ...prev };
      next.colors = next.colors.map(c => c._id === color._id ? { ...c, price: savedColor.price, images: savedColor.images } : c);
      return next;
    });
    handleRemovePendingMapping(colorName);
    return savedColor;
  };

  const handleRemovePendingMapping = (colorName) => {
    setPendingColorMappings(prev => {
      const newState = { ...prev };
      delete newState[colorName];
      return newState;
    });
  };

  const handleApplyToAll = async (colorId) => {
    if (!window.confirm('Apply these images and price to all other colors in this theme? This will overwrite existing mappings.')) return;
    try {
      const response = await adminService.applyCustomCakeThemeColorToAll(theme._id, colorId);
      toast.success('Applied to all colors successfully');
      setTheme(prev => ({
        ...prev,
        colors: response.data.data
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply to all colors');
    }
  };
  
  const handleDeleteThemeColor = async (tcId) => {
    if (!window.confirm('Are you sure you want to delete this mapped image?')) return;
    try {
      await adminService.deleteCustomCakeThemeColor(tcId);
      toast.success('Removed mapping');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted font-bold animate-pulse">Loading Theme Builder...</div>;

  return (
    <div className="space-y-8 bg-card rounded-2xl p-6 border border-border shadow-sm">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-black text-heading text-xl flex items-center gap-2">
          <Sparkles className="text-primary" /> {themeId ? 'Edit Theme' : 'Create New Theme'}
        </h3>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 text-sm font-black uppercase text-muted hover:bg-border/20 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSaveTheme} disabled={saving} className="px-6 py-2 bg-primary text-button-text font-black text-sm uppercase tracking-widest rounded-xl hover:brightness-110 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check size={16} />} 
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      {/* SECTION 1: THEME INFO */}
      <div className="space-y-4 bg-border/5 p-5 rounded-xl border border-border/50">
        <h4 className="font-black text-sm uppercase tracking-wider text-muted mb-2">1. Theme Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-muted uppercase">Theme Name</label>
            <input type="text" value={theme.name} onChange={e => setTheme({...theme, name: e.target.value})} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. Teddy Theme" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-muted uppercase">Theme Base Price (₹)</label>
            <input type="number" value={theme.basePrice || 0} onChange={e => setTheme({...theme, basePrice: parseFloat(e.target.value) || 0})} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="e.g. 500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-muted uppercase">Display Order</label>
            <input type="number" value={theme.displayOrder} onChange={e => setTheme({...theme, displayOrder: parseInt(e.target.value) || 0})} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted uppercase">Description</label>
          <textarea value={theme.description} onChange={e => setTheme({...theme, description: e.target.value})} className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold" rows="2" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black text-muted uppercase">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.length > 0
              ? categories.map(c => {
                  const normalized = (c.name || '').toLowerCase();
                  const isSelected = (theme.category || []).includes(normalized);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        const cats = theme.category || [];
                        setTheme({
                          ...theme,
                          category: isSelected
                            ? cats.filter(cat => cat !== normalized)
                            : [...cats, normalized]
                        });
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${
                        isSelected
                          ? 'bg-primary border-primary text-button-text shadow-lift'
                          : 'bg-input border-input-border text-muted hover:border-primary/50'
                      }`}
                    >
                      {c.label || c.name}
                    </button>
                  );
                })
              : <p className="text-xs text-muted italic">Loading categories...</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="isActive" checked={theme.isActive} onChange={e => setTheme({...theme, isActive: e.target.checked})} className="w-4 h-4 text-primary" />
          <label htmlFor="isActive" className="text-sm font-bold">Theme is Active</label>
        </div>
      </div>

      {/* SECTION 2: TIERS */}
      <div className="space-y-4 bg-border/5 p-5 rounded-xl border border-border/50">
        <h4 className="font-black text-sm uppercase tracking-wider text-muted mb-2">2. Tier Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['tier1', 'tier2', 'tier3'].map((tier, idx) => (
            <div key={tier} className="flex flex-col gap-3 p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase">Tier {idx + 1}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={theme.tiers?.[tier]?.isActive} onChange={e => setTheme({...theme, tiers: {...theme.tiers, [tier]: { ...theme.tiers?.[tier], isActive: e.target.checked }}})} />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {theme.tiers?.[tier]?.isActive && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase">Tier Adjustment Price (₹)</label>
                  <input type="number" value={theme.tiers?.[tier]?.price} onChange={e => setTheme({...theme, tiers: {...theme.tiers, [tier]: { ...theme.tiers?.[tier], price: parseFloat(e.target.value) || 0 }}})} className="w-full bg-input border border-input-border px-3 py-2 rounded-lg text-sm font-bold" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: COLORS & IMAGES (OPTIONAL) */}
      <div className="space-y-4 bg-border/5 p-5 rounded-xl border border-border/50">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider text-muted">3. Theme Colors & Images (Optional)</h4>
            <p className="text-xs text-muted">Add colors and tier images if this theme has color options. If none added, default design is used.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowColorModal(true)} className="text-xs font-black bg-input border border-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-border/30 shadow-sm transition-all">
              <Edit2 size={14} /> Add / Manage Colors
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(theme.colors || []).map((color, index) => {
            const hasImages = color.images?.tier1 || color.images?.tier2 || color.images?.tier3;
            const pending = pendingColorMappings[color.name];
            
            return (
              <div key={index} className="p-4 bg-card border border-border rounded-xl flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color.hexCode }}></div>
                <div className="flex justify-between items-center pl-2">
                  <span className="font-black text-sm">{color.name}</span>
                  {(hasImages || pending) && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setEditingMappingIndex(index)}
                        className="text-muted hover:text-heading hover:bg-border/30 p-1.5 rounded transition-colors"
                        title="Edit base price"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (hasImages) {
                            if (window.confirm('Remove images and price mapping?')) {
                              const updatedTheme = { ...theme };
                              updatedTheme.colors[index].images = { tier1: null, tier2: null, tier3: null };
                              updatedTheme.colors[index].price = 0;
                              setTheme(updatedTheme);
                            }
                          }
                          if (pending) {
                            handleRemovePendingMapping(color.name);
                          }
                        }} 
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                        title="Remove image mapping"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {(hasImages || pending) && editingMappingIndex !== index ? (
                  <div className="flex flex-col gap-2 pl-2">
                    <div className="grid grid-cols-3 gap-2">
                      {theme.tiers?.tier1?.isActive && (
                        <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                          <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T1</span>
                          {(pending?.previewUrls?.tier1 || color.images?.tier1) ? <img src={pending?.previewUrls?.tier1 || color.images?.tier1} alt="T1" className={`h-full object-contain ${pending?.previewUrls?.tier1 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                        </div>
                      )}
                      {theme.tiers?.tier2?.isActive && (
                        <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                          <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T2</span>
                          {(pending?.previewUrls?.tier2 || color.images?.tier2) ? <img src={pending?.previewUrls?.tier2 || color.images?.tier2} alt="T2" className={`h-full object-contain ${pending?.previewUrls?.tier2 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                        </div>
                      )}
                      {theme.tiers?.tier3?.isActive && (
                        <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                          <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T3</span>
                          {(pending?.previewUrls?.tier3 || color.images?.tier3) ? <img src={pending?.previewUrls?.tier3 || color.images?.tier3} alt="T3" className={`h-full object-contain ${pending?.previewUrls?.tier3 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center bg-input px-3 py-2 rounded-lg border border-input-border">
                      <span className="text-xs font-black text-muted uppercase">Base Price</span>
                      <span className="font-black text-primary">₹{pending?.price ?? color.price ?? 0}</span>
                    </div>
                    {color._id && hasImages && !pending && (
                      <button 
                        onClick={() => handleApplyToAll(color._id)}
                        className="w-full mt-1 py-1.5 bg-secondary text-white rounded font-bold text-xs hover:bg-secondary/90 transition-colors"
                      >
                        Apply to All Colors
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pl-2 flex flex-col gap-2">
                    <form onSubmit={async e => {
                      e.preventDefault();
                      const price = e.target.price.value;
                      const files = {};
                      if (theme.tiers?.tier1?.isActive && e.target.tier1Image?.files[0]) files.tier1 = e.target.tier1Image.files[0];
                      if (theme.tiers?.tier2?.isActive && e.target.tier2Image?.files[0]) files.tier2 = e.target.tier2Image.files[0];
                      if (theme.tiers?.tier3?.isActive && e.target.tier3Image?.files[0]) files.tier3 = e.target.tier3Image.files[0];
                      try {
                        await saveThemeColorMapping(color.name, files, price);
                        toast.success('Mapping saved');
                        setEditingMappingIndex(null);
                      } catch (error) {
                        toast.error(error.message || error.response?.data?.message || 'Failed to save mapping');
                      }
                    }} className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        {theme.tiers?.tier1?.isActive && (
                          <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                            {pending?.previewUrls?.tier1 || color.images?.tier1 ? (
                              <>
                                <img src={pending?.previewUrls?.tier1 || color.images?.tier1} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(color.name, 'tier1'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <ImageIcon size={14} className="z-10" />
                                <span className="z-10">Tier 1</span>
                              </>
                            )}
                            <input type="file" name="tier1Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(color.name, 'tier1', e.target.files?.[0])} />
                          </label>
                        )}
                        {theme.tiers?.tier2?.isActive && (
                          <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                            {pending?.previewUrls?.tier2 || color.images?.tier2 ? (
                              <>
                                <img src={pending?.previewUrls?.tier2 || color.images?.tier2} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(color.name, 'tier2'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <ImageIcon size={14} className="z-10" />
                                <span className="z-10">Tier 2</span>
                              </>
                            )}
                            <input type="file" name="tier2Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(color.name, 'tier2', e.target.files?.[0])} />
                          </label>
                        )}
                        {theme.tiers?.tier3?.isActive && (
                          <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                            {pending?.previewUrls?.tier3 || color.images?.tier3 ? (
                              <>
                                <img src={pending?.previewUrls?.tier3 || color.images?.tier3} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(color.name, 'tier3'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <ImageIcon size={14} className="z-10" />
                                <span className="z-10">Tier 3</span>
                              </>
                            )}
                            <input type="file" name="tier3Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(color.name, 'tier3', e.target.files?.[0])} />
                          </label>
                        )}
                        {!theme.tiers?.tier1?.isActive && !theme.tiers?.tier2?.isActive && !theme.tiers?.tier3?.isActive && (
                          <span className="col-span-3 text-xs text-muted text-center py-4">No tiers enabled for this theme.</span>
                        )}
                      </div>
                      <input type="number" name="price" value={pending?.price !== undefined ? pending.price : (color.price || '')} placeholder="Base Price (₹)" required onChange={e => handlePriceInputChange(color.name, e.target.value)} className="w-full text-sm font-bold bg-input border border-input-border px-3 py-2 rounded-lg outline-none focus:border-primary/50" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={
                          (!theme.tiers?.tier1?.isActive && !theme.tiers?.tier2?.isActive && !theme.tiers?.tier3?.isActive) ||
                          !(parseFloat(pending?.price !== undefined ? pending.price : color.price) > 0)
                        } className="flex-1 bg-primary text-button-text px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:brightness-110 disabled:opacity-50">
                          {editingMappingIndex === index ? 'Update' : 'Add Mapping'}
                        </button>
                        {editingMappingIndex === index && (
                          <button type="button" onClick={() => setEditingMappingIndex(null)} className="px-3 py-2 bg-input border border-input-border rounded-lg text-[10px] font-black uppercase hover:bg-border/30">Cancel</button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: FLAVOURS */}
      <div className="space-y-4 bg-border/5 p-5 rounded-xl border border-border/50">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider text-muted">4. Theme-Specific Flavours & Weights</h4>
            <p className="text-xs font-bold text-muted mt-1">Manage the flavours available exclusively for this theme.</p>
          </div>
          <button onClick={() => setShowFlavourModal(true)} className="text-xs font-black bg-input border border-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-border/30 shadow-sm transition-all">
            <Edit2 size={14} /> Manage Flavours
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 mt-4">
          {(theme.flavors || []).map((f, i) => (
            <div key={i} className="flex justify-between items-center bg-card p-4 rounded-xl border border-border text-sm font-bold shadow-sm">
              <span className="uppercase tracking-wider">{f.name}</span>
              <div className="text-right flex items-center gap-4">
                <div>
                  <span className="text-primary font-black block">Base: ₹{f.weights?.find(w => w.kg === 1)?.price || 0}</span>
                  <span className="text-muted text-[10px] uppercase">Up to ₹{f.weights?.find(w => w.kg === 3)?.price || 0} (3Kg)</span>
                </div>
                <div className="flex gap-1 border-l border-border pl-4">
                  <button onClick={() => setShowFlavourModal(true)} className="p-1.5 bg-input border border-border rounded-lg text-muted hover:text-heading transition-colors" title="Edit Flavour">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={async () => {
                    if (window.confirm(`Are you sure you want to remove ${f.name} from this theme?`)) {
                      try {
                        if (themeId && f._id) {
                          await adminService.deleteCustomCakeThemeFlavour(themeId, f._id);
                        }
                        const newFlavors = [...theme.flavors];
                        newFlavors.splice(i, 1);
                        setTheme({...theme, flavors: newFlavors});
                        toast.success('Flavour removed');
                      } catch (err) {
                        toast.error('Failed to remove flavour');
                      }
                    }
                  }} className="p-1.5 bg-input border border-border rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Remove Flavour">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!theme.flavors || theme.flavors.length === 0) && (
            <div className="col-span-1 md:col-span-2 text-center py-6 text-muted font-bold bg-card border border-border rounded-xl">
              No theme-specific flavours. Click Manage Flavours to add some.
            </div>
          )}
        </div>
      </div>

      {/* Modals for Global Management */}
      {showColorModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-xl border border-border p-6 relative">
            <ThemeColorManager 
              themeId={themeId}
              colors={theme.colors || []} 
              setColors={(updatedColors) => setTheme({ ...theme, colors: updatedColors })}
              onClose={() => setShowColorModal(false)}
            />
            <button onClick={() => setShowColorModal(false)} className="absolute top-3 right-3 p-2 bg-card border border-border rounded-full shadow-md text-muted hover:text-heading z-[60]"><X size={20} /></button>
          </div>
        </div>
      )}
      {showFlavourModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-xl border border-border p-6 relative">
            <ThemeFlavourManager 
              themeId={themeId}
              flavours={theme.flavors || []} 
              setFlavours={(updatedFlavours) => setTheme({ ...theme, flavors: updatedFlavours })}
              onClose={() => setShowFlavourModal(false)}
            />
            <button onClick={() => setShowFlavourModal(false)} className="absolute top-3 right-3 p-2 bg-card border border-border rounded-full shadow-md text-muted hover:text-heading z-[60]"><X size={20} /></button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ThemeBuilder;
