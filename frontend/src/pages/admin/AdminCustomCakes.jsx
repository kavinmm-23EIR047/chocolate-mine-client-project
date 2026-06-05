import React, { useState, useEffect } from 'react';
import { Cake, Plus, Edit2, Trash2, X, Palette, Coffee } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import ThemeBuilder from '../../components/Admin/CustomCakes/ThemeBuilder';
import ColorManager from '../../components/Admin/CustomCakes/ColorManager';
import FlavourManager from '../../components/Admin/CustomCakes/FlavourManager';

const AdminCustomCakes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingThemeId, setEditingThemeId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('edit') || null;
  }); // null = List view, 'new' = Create view, string = Edit view
  const [showGlobalColors, setShowGlobalColors] = useState(false);
  const [showGlobalFlavours, setShowGlobalFlavours] = useState(false);


  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (editingThemeId) {
      params.set('edit', editingThemeId);
    } else {
      params.delete('edit');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    // Only push state if it actually changed to prevent loops
    if (window.location.search !== `?${params.toString()}` && window.location.search !== '') {
      window.history.pushState({ path: newUrl }, '', newUrl);
    } else if (window.location.search === '' && params.toString()) {
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, [editingThemeId]);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setEditingThemeId(params.get('edit') || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (editingThemeId === null) {
      fetchThemes();
    }
  }, [editingThemeId]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomCakeThemes();
      setThemes(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this theme? It will delete related color mappings and pricing.')) return;
    try {
      await adminService.deleteCustomCakeTheme(id);
      toast.success('Theme deleted successfully');
      fetchThemes();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (editingThemeId) {
    return (
      <div className="space-y-6">
        <ThemeBuilder 
          themeId={editingThemeId === 'new' ? null : editingThemeId} 
          onBack={() => setEditingThemeId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-heading flex items-center gap-2">
            <Cake className="text-primary" /> Custom Cakes Themes
          </h2>
          <p className="text-muted text-sm mt-1">Manage themes and their additive pricing configurations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGlobalFlavours(true)} className="flex items-center gap-2 bg-input border border-border text-heading px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-border/30 transition-all">
            <Coffee size={16} /> Global Flavours
          </button>
          <button onClick={() => setShowGlobalColors(true)} className="flex items-center gap-2 bg-input border border-border text-heading px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-border/30 transition-all">
            <Palette size={16} /> Global Colors
          </button>
          <button onClick={() => setEditingThemeId('new')} className="flex items-center gap-2 bg-primary text-button-text px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all ml-2">
            <Plus size={18} /> Create New Theme
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center font-bold text-muted animate-pulse">Loading themes...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left bg-border/20">
                <th className="px-6 py-4 text-xs font-black text-muted uppercase">Theme Name</th>
                <th className="px-6 py-4 text-xs font-black text-muted uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-black text-muted uppercase">Tiers Enabled</th>
                <th className="px-6 py-4 text-xs font-black text-muted uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {themes.map(theme => (
                <tr key={theme._id} className="hover:bg-border/10 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-black text-heading text-sm">{theme.name}</p>
                    <p className="font-bold text-muted text-xs truncate max-w-xs">{theme.description}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${theme.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {theme.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1">
                      {theme.tiers?.tier1?.isActive && <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">T1</span>}
                      {theme.tiers?.tier2?.isActive && <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">T2</span>}
                      {theme.tiers?.tier3?.isActive && <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">T3</span>}
                      {!theme.tiers?.tier1?.isActive && !theme.tiers?.tier2?.isActive && !theme.tiers?.tier3?.isActive && <span className="text-muted text-[10px] font-black uppercase">None</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingThemeId(theme._id)} className="p-2 text-muted hover:text-heading bg-input rounded-lg hover:bg-border/50 transition-colors" title="Edit Theme">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(theme._id)} className="p-2 text-muted hover:text-red-600 bg-input rounded-lg hover:bg-red-50 transition-colors" title="Delete Theme">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {themes.length === 0 && (
                <tr><td colSpan="4" className="text-center py-12 text-muted font-bold">No themes found. Click "Create New Theme" to begin.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals for Global Management */}
      {showGlobalColors && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-xl border border-border p-6 relative">
            <button onClick={() => setShowGlobalColors(false)} className="absolute top-3 right-3 p-2 bg-card border border-border rounded-full shadow-md text-muted hover:text-heading z-[60]"><X size={20} /></button>
            <ColorManager />
          </div>
        </div>
      )}
      {showGlobalFlavours && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-xl border border-border p-6 relative">
            <button onClick={() => setShowGlobalFlavours(false)} className="absolute top-3 right-3 p-2 bg-card border border-border rounded-full shadow-md text-muted hover:text-heading z-[60]"><X size={20} /></button>
            <FlavourManager />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomCakes;
