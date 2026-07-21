import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Image as ImageIcon, Plus, Edit2, Trash2, UploadCloud } from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';


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
  const [globalFlavours, setGlobalFlavours] = useState([]);
  const [themeColors, setThemeColors] = useState([]); // Kept for backwards-compatible loading of old colors if needed

  const [pendingColorMappings, setPendingColorMappings] = useState({});
  const [editingMappingName, setEditingMappingName] = useState(null);
  const [editingFlavourName, setEditingFlavourName] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  


  useEffect(() => {
    loadData();
  }, [themeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [colorsRes, categoriesRes, flavoursRes] = await Promise.all([
        adminService.getCustomCakeColors(),
        adminService.getCategories({ type: 'custom' }),
        adminService.getCustomCakeFlavours()
      ]);

      const loadedColors = colorsRes.data?.data || [];
      const loadedFlavours = flavoursRes.data?.data || [];
      setCategories(categoriesRes.data?.data || []);
      setGlobalColors(loadedColors);
      setGlobalFlavours(loadedFlavours);

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
        // New theme: auto-select all flavours by default, colors start empty until selected/configured
        setTheme(prev => ({
          ...prev,
          flavors: loadedFlavours.map(f => ({ name: f.name, category: f.category, isActive: true, weights: f.weights })),
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

  const ensureEditingName = (colorName) => {
    if (editingMappingName !== colorName) {
      setEditingMappingName(colorName);
    }
  };

  const handleFileInputChange = (colorName, field, file) => {
    if (!file) return;
    const prev = pendingColorMappings[colorName] || { files: {}, price: '', previewUrls: {} };
    ensureEditingName(colorName);
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
    ensureEditingName(colorName);
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
            <p className="text-xs text-muted">Select colors and add tier images if this theme has color options. If none added, default design is used.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => {
              setTheme(prev => ({
                ...prev,
                colors: globalColors.map(c => {
                  const existing = (prev.colors || []).find(tc => tc.name === c.name);
                  if (existing) return existing;
                  const { _id, __v, createdAt, updatedAt, ...rest } = c;
                  return { ...rest, price: 0, images: { tier1: null, tier2: null, tier3: null } };
                })
              }));
            }} className="text-[10px] font-black uppercase tracking-wider text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">Select All</button>
            <button type="button" onClick={() => {
              if (window.confirm('Deselect all colors? This will remove any pending images.')) {
                setTheme(prev => ({ ...prev, colors: [] }));
                setPendingColorMappings({});
              }
            }} className="text-[10px] font-black uppercase tracking-wider text-muted border border-border px-3 py-1.5 rounded-lg hover:bg-border/20 transition-colors">Deselect All</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalColors.map((gColor) => {
            const isSelected = (theme.colors || []).some(c => c.name === gColor.name);
            const themeColor = (theme.colors || []).find(c => c.name === gColor.name) || gColor;
            
            const hasImages = isSelected && (themeColor.images?.tier1 || themeColor.images?.tier2 || themeColor.images?.tier3);
            const pending = pendingColorMappings[gColor.name];
            
            return (
              <div key={gColor._id} className={`p-4 bg-card border rounded-xl flex flex-col gap-3 relative overflow-hidden transition-all ${isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: gColor.hexCode }}></div>
                <div className="flex justify-between items-center pl-2">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-sm w-full">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary rounded border-input-border bg-input cursor-pointer"
                      checked={isSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setTheme(prev => {
                            const { _id, __v, createdAt, updatedAt, ...rest } = gColor;
                            return {
                              ...prev,
                              colors: [...(prev.colors || []), { ...rest, price: 0, images: { tier1: null, tier2: null, tier3: null } }]
                            };
                          });
                        } else {
                          if (hasImages || pending) {
                            if (!window.confirm(`Remove ${gColor.name} and all its images/prices from this theme?`)) return;
                          }
                          setTheme(prev => ({
                            ...prev,
                            colors: (prev.colors || []).filter(c => c.name !== gColor.name)
                          }));
                          if (pending) handleRemovePendingMapping(gColor.name);
                        }
                      }}
                    />
                    {gColor.name}
                  </label>
                  
                  {isSelected && (hasImages || pending) && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setEditingMappingName(gColor.name)}
                        className="text-muted hover:text-heading hover:bg-border/30 p-1.5 rounded transition-colors"
                        title="Edit base price"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  (hasImages || pending) && editingMappingName !== gColor.name ? (
                    <div className="flex flex-col gap-2 pl-2">
                      <div className="grid grid-cols-3 gap-2">
                        {theme.tiers?.tier1?.isActive && (
                          <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                            <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T1</span>
                            {(pending?.previewUrls?.tier1 || themeColor.images?.tier1) ? <img src={pending?.previewUrls?.tier1 || themeColor.images?.tier1} alt="T1" className={`h-full object-contain ${pending?.previewUrls?.tier1 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                          </div>
                        )}
                        {theme.tiers?.tier2?.isActive && (
                          <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                            <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T2</span>
                            {(pending?.previewUrls?.tier2 || themeColor.images?.tier2) ? <img src={pending?.previewUrls?.tier2 || themeColor.images?.tier2} alt="T2" className={`h-full object-contain ${pending?.previewUrls?.tier2 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                          </div>
                        )}
                        {theme.tiers?.tier3?.isActive && (
                          <div className="h-24 bg-border/20 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                            <span className="absolute top-1 left-1 text-[8px] font-black uppercase bg-black/50 text-white px-1 py-0.5 rounded z-10">T3</span>
                            {(pending?.previewUrls?.tier3 || themeColor.images?.tier3) ? <img src={pending?.previewUrls?.tier3 || themeColor.images?.tier3} alt="T3" className={`h-full object-contain ${pending?.previewUrls?.tier3 ? 'opacity-80' : ''}`} /> : <span className="text-[10px] text-muted font-bold">{pending ? 'Pending' : 'No Img'}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center bg-input px-3 py-2 rounded-lg border border-input-border">
                        <span className="text-xs font-black text-muted uppercase">Base Price</span>
                        <span className="font-black text-primary">₹{pending?.price ?? themeColor.price ?? 0}</span>
                      </div>
                      {themeColor._id && hasImages && !pending && (
                        <button 
                          onClick={() => handleApplyToAll(themeColor._id)}
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
                          await saveThemeColorMapping(gColor.name, files, price);
                          toast.success('Mapping saved');
                          setEditingMappingName(null);
                        } catch (error) {
                          toast.error(error.message || error.response?.data?.message || 'Failed to save mapping');
                        }
                      }} className="flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                          {theme.tiers?.tier1?.isActive && (
                            <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                              {pending?.previewUrls?.tier1 || themeColor.images?.tier1 ? (
                                <>
                                  <img src={pending?.previewUrls?.tier1 || themeColor.images?.tier1} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                  <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(gColor.name, 'tier1'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <ImageIcon size={14} className="z-10" />
                                  <span className="z-10">Tier 1</span>
                                </>
                              )}
                              <input type="file" name="tier1Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(gColor.name, 'tier1', e.target.files?.[0])} />
                            </label>
                          )}
                          {theme.tiers?.tier2?.isActive && (
                            <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                              {pending?.previewUrls?.tier2 || themeColor.images?.tier2 ? (
                                <>
                                  <img src={pending?.previewUrls?.tier2 || themeColor.images?.tier2} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                  <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(gColor.name, 'tier2'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <ImageIcon size={14} className="z-10" />
                                  <span className="z-10">Tier 2</span>
                                </>
                              )}
                              <input type="file" name="tier2Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(gColor.name, 'tier2', e.target.files?.[0])} />
                            </label>
                          )}
                          {theme.tiers?.tier3?.isActive && (
                            <label className="flex flex-col items-center justify-center gap-1 bg-input border border-input-border p-2 rounded-lg cursor-pointer hover:bg-border/30 transition-colors text-[10px] font-bold text-muted text-center h-20 relative overflow-hidden">
                              {pending?.previewUrls?.tier3 || themeColor.images?.tier3 ? (
                                <>
                                  <img src={pending?.previewUrls?.tier3 || themeColor.images?.tier3} className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                  <button type="button" onClick={e => { e.stopPropagation(); handleRemoveTierFile(gColor.name, 'tier3'); }} className="absolute top-1 right-1 z-20 rounded-full bg-black/60 p-1 text-white">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <ImageIcon size={14} className="z-10" />
                                  <span className="z-10">Tier 3</span>
                                </>
                              )}
                              <input type="file" name="tier3Image" accept="image/*" className="hidden" onChange={e => handleFileInputChange(gColor.name, 'tier3', e.target.files?.[0])} />
                            </label>
                          )}
                          {!theme.tiers?.tier1?.isActive && !theme.tiers?.tier2?.isActive && !theme.tiers?.tier3?.isActive && (
                            <span className="col-span-3 text-xs text-muted text-center py-4">No tiers enabled for this theme.</span>
                          )}
                        </div>
                        <input type="number" name="price" value={pending?.price !== undefined ? pending.price : (themeColor.price || '')} placeholder="Base Price (₹)" required onChange={e => handlePriceInputChange(gColor.name, e.target.value)} className="w-full text-sm font-bold bg-input border border-input-border px-3 py-2 rounded-lg outline-none focus:border-primary/50" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={
                            (!theme.tiers?.tier1?.isActive && !theme.tiers?.tier2?.isActive && !theme.tiers?.tier3?.isActive) ||
                            !(parseFloat(pending?.price !== undefined ? pending.price : themeColor.price) >= 0)
                          } className="flex-1 bg-primary text-button-text px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:brightness-110 disabled:opacity-50">
                            {editingMappingName === gColor.name ? 'Update' : 'Add Mapping'}
                          </button>
                          {editingMappingName === gColor.name && (
                            <button type="button" onClick={() => setEditingMappingName(null)} className="px-3 py-2 bg-input border border-input-border rounded-lg text-[10px] font-black uppercase hover:bg-border/30">Cancel</button>
                          )}
                        </div>
                      </form>
                    </div>
                  )
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
            <p className="text-xs font-bold text-muted mt-1">Select and manage the flavours available exclusively for this theme.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => {
              setTheme(prev => ({
                ...prev,
                flavors: globalFlavours.map(f => {
                  const existing = (prev.flavors || []).find(tf => tf.name === f.name);
                  return existing || { name: f.name, category: f.category, isActive: true, weights: f.weights };
                })
              }));
            }} className="text-[10px] font-black uppercase tracking-wider text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">Select All</button>
            <button type="button" onClick={() => {
              if (window.confirm('Deselect all flavours from this theme?')) {
                setTheme(prev => ({ ...prev, flavors: [] }));
              }
            }} className="text-[10px] font-black uppercase tracking-wider text-muted border border-border px-3 py-1.5 rounded-lg hover:bg-border/20 transition-colors">Deselect All</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2 mt-4">
          {globalFlavours.map((gFlavour) => {
            const isSelected = (theme.flavors || []).some(f => f.name === gFlavour.name);
            const themeFlavour = (theme.flavors || []).find(f => f.name === gFlavour.name) || gFlavour;

            return (
              <div key={gFlavour._id} className={`p-4 bg-card border rounded-xl flex flex-col gap-3 relative overflow-hidden transition-all ${isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-sm w-full">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary rounded border-input-border bg-input cursor-pointer"
                      checked={isSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setTheme(prev => ({
                            ...prev,
                            flavors: [...(prev.flavors || []), { name: gFlavour.name, category: gFlavour.category, isActive: true, weights: gFlavour.weights }]
                          }));
                        } else {
                          if (!window.confirm(`Remove ${gFlavour.name} from this theme?`)) return;
                          
                          setTheme(prev => ({
                            ...prev,
                            flavors: (prev.flavors || []).filter(f => f.name !== gFlavour.name)
                          }));
                        }
                      }}
                    />
                    <span className="uppercase tracking-wider">{gFlavour.name}</span>
                  </label>
                  {isSelected && (
                    <button 
                      onClick={() => setEditingFlavourName(editingFlavourName === gFlavour.name ? null : gFlavour.name)}
                      className="p-1.5 hover:bg-border/30 rounded-lg text-muted hover:text-heading transition-colors"
                      title="Edit Prices"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {isSelected && (
                  editingFlavourName === gFlavour.name ? (
                    <div className="pt-3 border-t border-border mt-2">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const basePrice = parseFloat(e.target.basePrice.value);
                        if (isNaN(basePrice) || basePrice < 0) return toast.error('Invalid base price');
                        
                        const newWeights = [
                          { kg: 1, price: basePrice },
                          { kg: 1.5, price: basePrice * 1.5 },
                          { kg: 2, price: basePrice * 2 },
                          { kg: 2.5, price: basePrice * 2.5 },
                          { kg: 3, price: basePrice * 3 },
                        ];

                        setTheme(prev => ({
                          ...prev,
                          flavors: prev.flavors.map(f => f.name === gFlavour.name ? { ...f, weights: newWeights } : f)
                        }));
                        setEditingFlavourName(null);
                        toast.success('Prices updated');
                      }}>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-primary uppercase">1 Kg Base Price (₹)</label>
                          <input type="number" name="basePrice" defaultValue={themeFlavour.weights?.find(w => w.kg === 1)?.price || 0} required className="w-full bg-input border border-primary/30 px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary outline-none font-bold text-sm" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button type="submit" className="flex-1 bg-primary text-button-text px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:brightness-110">
                            Save Prices
                          </button>
                          <button type="button" onClick={() => setEditingFlavourName(null)} className="px-3 py-2 bg-input border border-input-border rounded-lg text-[10px] font-black uppercase hover:bg-border/30">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-primary font-black block">Base: ₹{themeFlavour.weights?.find(w => w.kg === 1)?.price || 0}</span>
                          <span className="text-muted text-[10px] uppercase">Up to ₹{themeFlavour.weights?.find(w => w.kg === 3)?.price || 0} (3Kg)</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ThemeBuilder;
