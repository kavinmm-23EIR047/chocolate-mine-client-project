import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Star, Shield, Leaf, Clock, Heart, Share2, ChevronDown, X,
  ChevronUp, Sparkles, BadgeCheck, ChevronRight as Next,
  Cake, Palette, Weight, UserCircle, ReceiptText, Layers,
  Filter, Eye
} from 'lucide-react';
import { addToCart } from '../redux/slices/cartSlice';
import { saveCustomCakeRequest } from '../utils/customCake';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PureVegIcon from '../assets/pure veg.webp';

// ── Import separated data ────────────────────────────────────────────────
import {
  TIERS, WEIGHTS, TRUST, STEPS, getTierById
} from './customCakeData';

// ─── SVG ICONS ────────────────────────────────────────────────
const VegIcon = () => (
  <img src={PureVegIcon} alt="Pure Veg" className="inline-block flex-shrink-0 w-4 h-4" style={{ marginTop: '-1px' }} />
);

// ─── COMPONENT ────────────────────────────────────────────────
export default function CustomCake() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // ── STATE ──────────────────────────────────────────────────
  const [selectedTier, setSelectedTier] = useState(null);   // null = all, 1/2/3
  const [themeIdx, setThemeIdx] = useState(null);            // null = browse mode (no theme picked)
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [weightIdx, setWeightIdx] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [age, setAge] = useState('1');
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState(0); // 0 = tier, 1 = theme, …
  const [wishlisted, setWishlisted] = useState(false);
  const [dbFlavors, setDbFlavors] = useState([]);
  const [selectedDbFlavor, setSelectedDbFlavor] = useState(null);
  const [flavorDropdownOpen, setFlavorDropdownOpen] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState('');

  const [dbThemes, setDbThemes] = useState([]);
  const [dbThemeColors, setDbThemeColors] = useState([]);

  useEffect(() => {
    const loadDbData = async () => {
      try {
        const [themesRes] = await Promise.all([
          api.get('/custom-cakes/themes')
        ]);
        
        if (themesRes.data?.data) {
          setDbThemes(themesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load custom cake data:', err);
      }
    };
    loadDbData();
  }, []);

  // ── HANDLE URL PARAMETERS FOR TIER & THEME ────────────────
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    const themeParam = searchParams.get('theme');
    
    if (tierParam) {
      const tierNum = parseInt(tierParam, 10);
      if ([1, 2, 3].includes(tierNum)) {
        setSelectedTier(tierNum);
      }
    }
    
    if (themeParam && dbThemes.length > 0) {
      const themeIndex = dbThemes.findIndex(t => t._id === themeParam);
      if (themeIndex >= 0) {
        setThemeIdx(themeIndex);
      }
    }
  }, [searchParams, dbThemes]);

  // ── DERIVED ────────────────────────────────────────────────
  const filteredThemes = useMemo(() => {
    return dbThemes
      .filter(t => !selectedTier || (t.tiers && t.tiers[`tier${selectedTier}`]?.isActive))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(t => {
        // Map embedded colors (design flavors)
        const mappedFlavors = (t.colors || []).filter(c => c.isActive).map(c => {
          let imgUrl = c.images?.[`tier${selectedTier || 1}`] || c.images?.tier1;
          if (!imgUrl) imgUrl = c.images?.tier2 || c.images?.tier3;
          return {
            id: c._id,
            name: c.name,
            hexCode: c.hexCode || '#fff',
            image: imgUrl,
            price: c.price || 0,
            bg: c.hexCode || '#fff'
          };
        });
        
        return {
          id: t._id,
          name: t.name,
          shortName: t.name,
          description: t.description,
          enabled: t.isActive,
          badge: t.isActive ? 'Available' : 'Coming Soon',
          rating: 5.0, reviews: 0,
          flavors: mappedFlavors, // design colors
          dbFlavors: (t.flavors || []).filter(f => f.isActive), // cake sponge flavors
          bg: mappedFlavors[0]?.bg || '#fefefe',
          tiers: selectedTier ? [selectedTier] : [1, 2, 3].filter(num => t.tiers && t.tiers[`tier${num}`]?.isActive),
          emoji: '🎂',
          tierPricing: t.tiers
        };
      });
  }, [dbThemes, selectedTier]);

  const theme = themeIdx !== null ? filteredThemes[themeIdx] : null;
  const weight = WEIGHTS[weightIdx];
  const currentTier = getTierById(selectedTier || 1);
  
  // Update color when theme changes
  useEffect(() => {
    if (theme && theme.flavors?.length) {
      // Keep selected color if available in new theme, else pick first
      const existing = theme.flavors.find(f => f.name === selectedFlavor?.name);
      setSelectedFlavor(existing || theme.flavors[0]);
    } else {
      setSelectedFlavor(null);
    }

    if (theme && theme.dbFlavors?.length) {
      const existing = theme.dbFlavors.find(f => f.name === selectedDbFlavor?.name);
      setSelectedDbFlavor(existing || theme.dbFlavors[0]);
    } else {
      setSelectedDbFlavor(null);
    }
  }, [themeIdx, selectedTier, theme]);

  const themeIdToKeep = useRef(null);

  // When tier changes, reset theme selection unless explicitly keeping it
  useEffect(() => {
    if (themeIdToKeep.current && filteredThemes.length > 0) {
      const newIdx = filteredThemes.findIndex(t => t.id === themeIdToKeep.current);
      setThemeIdx(newIdx !== -1 ? newIdx : null);
      themeIdToKeep.current = null;
    } else if (!themeIdToKeep.current) {
      setThemeIdx(null);
    }
  }, [selectedTier, filteredThemes]);

  const prevTheme = useCallback(() => {
    if (!filteredThemes.length) return;
    setThemeIdx(i => i === null ? filteredThemes.length - 1 : (i - 1 + filteredThemes.length) % filteredThemes.length);
  }, [filteredThemes]);

  const nextTheme = useCallback(() => {
    if (!filteredThemes.length) return;
    setThemeIdx(i => i === null ? 0 : (i + 1) % filteredThemes.length);
  }, [filteredThemes]);

  // ── PRICE CALCULATION ──────────────────────────────────────
  const getFlavorWeightPrice = (w) => {
    if (!selectedDbFlavor || !selectedDbFlavor.weights) return 1120; // fallback
    const weightVal = parseFloat(w.label);
    const weightObj = selectedDbFlavor.weights.find(x => x.kg === weightVal);
    if (weightObj) return weightObj.price;
    // Fallback to 1KG price if not found
    const baseObj = selectedDbFlavor.weights.find(x => x.kg === 1);
    return baseObj ? baseObj.price : 1120;
  };

  const getTierPrice = () => {
    if (!theme || !selectedTier) return 0;
    return theme.tierPricing?.[`tier${selectedTier}`]?.price || 0;
  };
  
  const getThemeColorPrice = () => {
    return selectedFlavor?.price || 0;
  };

  const basePrice = getFlavorWeightPrice(weight);
  const themePrice = getThemeColorPrice();
  const tierPrice = getTierPrice();
  
  const grandTotal = basePrice + themePrice + tierPrice;
  
  const chipTotal = (w) => getFlavorWeightPrice(w) + themePrice + tierPrice;

  // ── ADD TO CART ────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!theme) { toast.error('Please select a theme first'); return; }
    if (!theme.enabled) { toast.error('This theme is coming soon!'); return; }
    if (!customerName.trim()) { toast.error('Please enter the name for the cake'); setDrawerOpen(true); setMobileStep(4); return; }
    try {
      setIsAdding(true);
      const tierLabel = currentTier ? currentTier.shortName : 'Tier 1';
      const baseCakeId = `custom-${theme.id}-${selectedFlavor.id}-${selectedTier || 1}-${selectedDbFlavor?._id || 'noflav'}`;
      dispatch(addToCart({
        product: {
          _id: baseCakeId,
          name: `${selectedDbFlavor?.name || 'Custom'} Cake — ${theme.name} (${tierLabel})`,
          description: theme.description,
          image: selectedFlavor.image,
          price: grandTotal, stock: 5, category: 'Custom Cakes',
        },
        qty: 1,
        options: { 
          theme: theme.name, 
          tier: tierLabel, 
          color: selectedFlavor.name, 
          flavor: selectedDbFlavor?.name || 'Classic Vanilla', 
          weight: weight.label, 
          name: customerName, 
          age, 
          message: message || 'None' 
        },
        variantPrice: grandTotal,
      }));
      saveCustomCakeRequest({
        designTheme: theme.name, 
        tier: tierLabel, 
        servingWeight: weight.label, 
        themeColor: selectedFlavor.name,
        flavour: selectedDbFlavor?.name || 'Classic Vanilla',
        messageOnCake: `Name: ${customerName}, Age: ${age}, Message: ${message || 'None'}`,
        estimatedPrice: grandTotal,
      });
      toast.success('🎂 Dream cake added to bag!');
    } catch { toast.error('Failed to add. Please try again.'); }
    finally { setIsAdding(false); }
  };

  // ── BUY NOW (Add to Cart + Redirect to Checkout) ──────────
  const handleBuyNow = async () => {
    if (!theme) { toast.error('Please select a theme first'); return; }
    if (!theme.enabled) { toast.error('This theme is coming soon!'); return; }
    if (!customerName.trim()) { toast.error('Please enter the name for the cake'); setDrawerOpen(true); setMobileStep(4); return; }
    try {
      setIsAdding(true);
      const tierLabel = currentTier ? currentTier.shortName : 'Tier 1';
      const baseCakeId = `custom-${theme.id}-${selectedFlavor.id}-${selectedTier || 1}-${selectedDbFlavor?._id || 'noflav'}`;
      
      const directItem = {
        productId: baseCakeId,
        name: `${selectedDbFlavor?.name || 'Custom'} Cake — ${theme.name} (${tierLabel})`,
        description: theme.description,
        image: selectedFlavor.image,
        category: 'Custom Cakes',
        price: grandTotal,
        variantPrice: grandTotal,
        qty: 1,
        selectedFlavor: selectedFlavor.name,
        selectedWeight: weight.label,
        options: { 
          theme: theme.name, 
          tier: tierLabel, 
          color: selectedFlavor.name, 
          flavor: selectedDbFlavor?.name || 'Classic Vanilla', 
          weight: weight.label, 
          name: customerName, 
          age, 
          message: message || 'None' 
        },
      };

      saveCustomCakeRequest({
        designTheme: theme.name, 
        tier: tierLabel, 
        servingWeight: weight.label, 
        themeColor: selectedFlavor.name,
        flavour: selectedDbFlavor?.name || 'Classic Vanilla',
        messageOnCake: `Name: ${customerName}, Age: ${age}, Message: ${message || 'None'}`,
        estimatedPrice: grandTotal,
      });

      toast.success('🎂 Dream cake ready for checkout!');
      setTimeout(() => navigate('/checkout', { state: { directItem } }), 800);
    } catch { toast.error('Failed to proceed. Please try again.'); }
    finally { setIsAdding(false); }
  };

  // ── Go back to browse mode ─────────────────────────────────
  const goBackToBrowse = () => {
    setThemeIdx(null);
  };

  // ── Select a theme from browse mode ────────────────────────
  const selectTheme = (idx) => {
    setThemeIdx(idx);
    const t = filteredThemes[idx];
    if (t && t.flavors.length) setSelectedFlavor(t.flavors[0]);
    if (t && t.dbFlavors?.length) setSelectedDbFlavor(t.dbFlavors[0]);
  };

  // ── Personalize Form ──────────────────────────────────────
  const renderPersonalizeForm = (compact = false) => (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* VEG BADGE */}
      <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2">
        <VegIcon />
        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">100% Pure Veg & Eggless</span>
      </div>

      {/* 🎂 SEARCHABLE FLAVOR DROPDOWN */}
      <div className="relative">
        <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
          Choose Your Flavour <span className="text-red-500">*</span>
        </label>
        
        <button
          type="button"
          onClick={() => setFlavorDropdownOpen(!flavorDropdownOpen)}
          className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] flex items-center justify-between transition-all font-bold"
        >
          {selectedDbFlavor ? (
            <span>
              {selectedDbFlavor.name}
            </span>
          ) : (
            <span className="text-[var(--muted)]">No flavours mapped</span>
          )}
          <ChevronDown size={16} className={`transition-transform duration-200 ${flavorDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {flavorDropdownOpen && (
            <>
              {/* Overlay to close on outside click */}
              <div className="fixed inset-0 z-40 bg-black/0" onClick={() => setFlavorDropdownOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden max-h-[300px] flex flex-col"
              >
                {/* Search Bar */}
                <div className="p-3 border-b border-[var(--border)] bg-[var(--card-soft)] flex-shrink-0 relative z-50">
                  <input
                    type="text"
                    placeholder="Search flavours..."
                    value={flavorSearch}
                    onChange={(e) => setFlavorSearch(e.target.value)}
                    className="w-full bg-[var(--input)] border border-[var(--input-border)] px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] font-semibold text-[var(--foreground)]"
                    onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
                  />
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 divide-y divide-[var(--border)] relative z-50">
                  {theme && Array.from(new Set(theme.dbFlavors.map(f => f.category))).map(category => {
                    const categoryFlavors = theme.dbFlavors.filter(
                      f => f.category === category && f.name.toLowerCase().includes(flavorSearch.toLowerCase())
                    );
                    if (categoryFlavors.length === 0) return null;

                    return (
                      <div key={category} className="p-2">
                        <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider px-2 py-1 select-none">
                          {category}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {categoryFlavors.map(flavor => {
                            const isSelected = selectedDbFlavor?._id === flavor._id;
                            return (
                              <button
                                key={flavor._id}
                                type="button"
                                onClick={() => {
                                  setSelectedDbFlavor(flavor);
                                  setFlavorDropdownOpen(false);
                                  setFlavorSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-bold transition-all ${
                                  isSelected ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'hover:bg-[var(--input-hover)] text-[var(--foreground)]'
                                }`}
                              >
                                <span>{flavor.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {dbFlavors.length > 0 &&
                    ['Vanilla Cakes', 'Chocolate Cakes', 'Red Velvet Cakes'].every(category => {
                      return dbFlavors.filter(
                        f => f.category === category && f.isActive && f.name.toLowerCase().includes(flavorSearch.toLowerCase())
                      ).length === 0;
                    }) && (
                      <div className="text-center py-6 text-xs text-[var(--muted)] font-bold">
                        No flavours found
                      </div>
                    )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-3'}>
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
            Name on Cake <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text" maxLength={20}
              placeholder="e.g. Niharth"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-12 transition-all"
            />
            <span className="absolute right-3 top-2.5 text-[10px] text-[var(--muted)] font-bold">{customerName.length}/20</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">Age</label>
          <div className="relative">
            <select
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full appearance-none bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer pr-8"
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map(v => (
                <option key={v} value={v}>{v} {v === 1 ? 'Yr' : 'Yrs'}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-3 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
          Message on Cake <span className="text-[var(--muted)] font-normal normal-case">(Optional)</span>
        </label>
        <div className="relative">
          <input
            type="text" maxLength={60}
            placeholder="Happy Birthday Niharth!"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-14 transition-all"
          />
          <span className="absolute right-3 top-2.5 text-[10px] text-[var(--muted)] font-bold">{message.length}/60</span>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TIER FILTER BAR — shown in browse mode
  ════════════════════════════════════════════════════════════ */
  const TierFilterBar = ({ compact = false }) => (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'gap-3'}`}>
      {/* All themes chip */}
      <button
        onClick={() => setSelectedTier(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${selectedTier === null
          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-lg shadow-[var(--primary)]/20 scale-105'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--primary)] hover:shadow-md'
          }`}
      >
        <Eye size={14} />
        All Themes
        {selectedTier === null && <Check size={12} />}
      </button>

      {/* Tier chips */}
      {TIERS.map(tier => (
        <button
          key={tier.id}
          onClick={() => setSelectedTier(tier.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${selectedTier === tier.id
            ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-lg shadow-[var(--primary)]/20 scale-105'
            : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--primary)] hover:shadow-md'
            }`}
        >
          <Layers size={14} />
          {tier.shortName}
          <span className={`text-[10px] font-medium normal-case ${selectedTier === tier.id ? 'opacity-80' : 'text-[var(--muted)]'}`}>
            ({tier.layers} {tier.layers === 1 ? 'Layer' : 'Layers'})
          </span>
          {selectedTier === tier.id && <Check size={12} />}
        </button>
      ))}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     THEME BROWSE GRID — shown when no theme is selected
  ════════════════════════════════════════════════════════════ */
  const ThemeBrowseGrid = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-3xl sm:text-4xl text-[var(--heading)] tracking-tight leading-tight">
            Custom Cakes
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1 font-medium">
            Choose your tier and theme to start designing your dream cake
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--card-soft)] border border-[var(--border)] px-4 py-2 rounded-2xl">
          <Filter size={14} className="text-[var(--primary)]" />
          <span className="text-xs font-black text-[var(--heading)]">
            {filteredThemes.length} {filteredThemes.length === 1 ? 'Theme' : 'Themes'}
          </span>
        </div>
      </div>

      {/* Tier filter */}
      <TierFilterBar />

      {/* Tier description */}
      {selectedTier && currentTier && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-[var(--card-soft)] border border-[var(--border)] rounded-2xl p-4"
        >
          <span className="text-3xl">{currentTier.icon}</span>
          <div>
            <p className="font-black text-sm text-[var(--heading)]">{currentTier.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{currentTier.description}</p>
          </div>
        </motion.div>
      )}

      {/* Theme grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredThemes.map((t, i) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => selectTheme(i)}
              className="relative group flex flex-col rounded-3xl border-2 border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)] hover:shadow-xl hover:shadow-[var(--primary)]/5 hover:scale-[1.02] active:scale-[0.98] text-left bg-[var(--card)] cursor-pointer"
            >
              {/* Image area */}
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '85%', background: t.bg }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {t.enabled && t.flavors[0]
                    ? <img src={t.flavors[0].image} alt={t.name} className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700" />
                    : t.image
                      ? <img src={t.image} alt={t.name} className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700" />
                      : <span className="text-6xl">{t.emoji}</span>
                  }
                </div>

                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                  {t.enabled
                    ? <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 shadow-sm">{t.badge}</span>
                    : <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-700 shadow-sm">Coming Soon</span>
                  }
                </div>

                {/* Tier badges - clickable to view cake at that tier */}
                <div className="absolute top-3 right-3 z-10 flex gap-1">
                  {t.tiers.map(tid => (
                    <button
                      key={tid}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (t.enabled) {
                          navigate(`/custom-cake?tier=${tid}&theme=${t.id}`);
                        }
                      }}
                      disabled={!t.enabled}
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 ${selectedTier === tid
                        ? 'bg-[var(--primary)] text-[var(--button-text)]'
                        : 'bg-white/80 text-[var(--heading)] backdrop-blur-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      title={t.enabled ? `View ${t.name} at Tier ${tid}` : 'This theme is coming soon'}
                    >
                      T{tid}
                    </button>
                  ))}
                </div>

                {/* Coming soon overlay */}
                {!t.enabled && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">{t.emoji}</span>
                      <p className="text-white font-black text-sm mt-2">Coming Soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-base text-[var(--heading)] leading-tight">{t.name}</h3>
                  {t.enabled && t.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={12} className="text-[var(--star)] fill-[var(--star)]" />
                      <span className="text-xs font-black text-[var(--heading)]">{t.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  {t.enabled && t.flavors[0] ? (
                    <span className="text-sm font-black text-[var(--primary)]">
                      From ₹{Math.round((selectedDbFlavor?.weights?.find(x => x.kg === 1)?.price || 1120) + (t.flavors[0]?.price || 0) + (t.tierPricing?.tier1?.price || 0))}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[var(--muted)]">Price TBD</span>
                  )}
                  <span className="text-[10px] font-black text-[var(--primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t.enabled ? 'Customize' : 'Preview'} <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center py-20 bg-[var(--card-soft)] rounded-3xl border-2 border-dashed border-[var(--border)]">
          <Cake size={48} className="mx-auto mb-4 text-[var(--primary)] opacity-20" />
          <p className="text-lg font-black text-[var(--heading)]">No themes found</p>
          <p className="text-xs text-[var(--muted)] mt-1">Try selecting a different tier</p>
          <button
            onClick={() => setSelectedTier(null)}
            className="mt-4 text-xs font-black text-[var(--primary)] underline"
          >
            View All Themes
          </button>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     MOBILE STEP CONTENT
  ════════════════════════════════════════════════════════════ */
  const MobileStepContent = () => {
    switch (mobileStep) {
      // STEP 0 — Tier Selection
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Select Cake Tier</p>
            <div className="grid grid-cols-1 gap-3">
              {TIERS.map(tier => {
                const isSel = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => { setSelectedTier(tier.id); setMobileStep(1); }}
                    className={`relative flex items-center gap-4 rounded-2xl border-2 overflow-hidden transition-all p-4 ${isSel
                      ? 'border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)] ring-offset-1'
                      : 'border-[var(--border)]'
                      }`}
                    style={{ background: 'var(--card-soft)' }}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/40 border border-white/60">
                      <span className="text-2xl">{tier.icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-[var(--heading)]">{tier.name}</p>
                        {isSel && (
                          <span className="w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                            <Check size={9} className="text-white" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{tier.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                          {tier.layers} {tier.layers === 1 ? 'Layer' : 'Layers'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // STEP 1 — Theme
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Select Your Theme</p>
            <div className="grid grid-cols-1 gap-3">
              {filteredThemes.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { setThemeIdx(i); if (t.enabled) setMobileStep(2); }}
                  className={`relative flex items-center gap-4 rounded-2xl border-2 overflow-hidden transition-all p-3 ${themeIdx === i
                    ? 'border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)] ring-offset-1'
                    : 'border-[var(--border)]'
                    }`}
                  style={{ background: t.bg }}
                >
                  {/* Theme image thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/40 border border-white/60">
                    {t.enabled && t.flavors[0]
                      ? <img src={t.flavors[0].image} alt={t.name} className="w-full h-full object-contain p-1" />
                      : t.image
                        ? <img src={t.image} alt={t.name} className="w-full h-full object-contain p-1" />
                        : <span className="text-3xl">{t.emoji}</span>
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm text-[var(--heading)]">{t.name}</p>
                      {themeIdx === i && t.enabled && (
                        <span className="w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                          <Check size={9} className="text-white" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {t.enabled
                        ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t.badge}</span>
                        : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Coming Soon</span>
                      }
                      {t.enabled && <span className="text-xs font-bold text-[var(--primary)]">From ₹{Math.round((selectedDbFlavor?.weights?.find(x => x.kg === 1)?.price || 1120) + (t.flavors[0]?.price || 0) + (t.tierPricing?.tier1?.price || 0))}</span>}
                    </div>
                  </div>
                  {!t.enabled && (
                    <div className="absolute inset-0 bg-white/40 rounded-2xl" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      // STEP 2 — Color
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Choose Your Color</p>
            {!theme?.enabled ? (
              <div className="text-center py-8 text-[var(--muted)]">
                <span className="text-4xl">{theme?.emoji}</span>
                <p className="mt-2 font-bold text-sm">This theme is coming soon!</p>
                <button onClick={() => setMobileStep(1)} className="mt-3 text-xs text-[var(--primary)] font-bold underline">Pick another theme</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {theme.flavors.map(flavor => {
                  const isSel = selectedFlavor?.id === flavor.id;
                  return (
                    <button
                      key={flavor.id}
                      onClick={() => { setSelectedFlavor(flavor); }}
                      className={`relative flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isSel
                        ? 'border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)] ring-offset-1'
                        : 'border-[var(--border)]'
                        }`}
                    >
                      <div className="relative w-full" style={{ paddingBottom: '80%', background: flavor.bg }}>
                        <img
                          src={flavor.image}
                          alt={flavor.name}
                          className="absolute inset-0 w-full h-full object-contain p-3"
                        />
                        {isSel && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow">
                            <Check size={11} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className={`w-full px-2 py-2.5 text-center ${isSel ? 'bg-[var(--card-soft)]' : 'bg-[var(--card)]'}`}>
                        <p className="text-xs font-black text-[var(--heading)] leading-tight">{flavor.name}</p>
                        <p className="text-xs font-bold text-[var(--primary)] mt-0.5">+₹{flavor.price || 0}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      // STEP 3 — Weight
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Select Weight</p>
              <span className="text-xs text-[var(--muted)] font-medium">Serves {weight.serves} people</span>
            </div>
            <div className="space-y-2.5">
              {WEIGHTS.map((w, i) => {
                const isSel = i === weightIdx;
                return (
                  <button
                    key={w.label}
                    onClick={() => setWeightIdx(i)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${isSel
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSel ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border)]'
                        }`}>
                        {isSel && <Check size={10} className="text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm text-[var(--heading)]">{w.label}</p>
                        <p className="text-[11px] text-[var(--muted)]">Serves {w.serves} people</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm ${isSel ? 'text-[var(--primary)]' : 'text-[var(--heading)]'}`}>
                        ₹{chipTotal(w)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // STEP 4 — Personalize
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Personalize Your Cake</p>
            {renderPersonalizeForm(true)}
          </div>
        );

      // STEP 5 — Summary
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Order Summary</p>

            {/* Cake preview */}
            <div
              className="rounded-2xl flex items-center gap-4 p-4 border border-[var(--border)]"
              style={{ background: selectedFlavor?.bg }}
            >
              <img src={selectedFlavor?.image} alt="" className="h-20 w-20 object-contain shrink-0 drop-shadow-lg" />
              <div>
                <p className="font-black text-base text-[var(--heading)]">{theme?.name}</p>
                <p className="text-sm text-[var(--muted)]">{selectedFlavor?.name} · {weight.label} · {currentTier?.shortName}</p>
                <p className="text-xl font-black text-[var(--heading)] mt-1">₹{grandTotal}</p>
              </div>
            </div>

            {/* Summary rows */}
            <div className="bg-[var(--card-soft)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {[
                { label: 'Tier', value: currentTier?.name || 'Tier 1' },
                { label: 'Theme', value: theme?.name || '—' },
                { label: 'Color', value: selectedFlavor?.name },
                { label: 'Weight', value: weight.label },
                { label: 'Name on Cake', value: customerName || '—' },
                { label: 'Age', value: `${age} ${age === '1' ? 'Year' : 'Years'}` },
                { label: 'Message', value: message || 'None' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-black text-[var(--heading)] max-w-[55%] text-right truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {[
                { label: 'Weight Price', value: `₹${basePrice}` },
                { label: 'Theme & Tier Price', value: `+₹${themePrice + tierPrice}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[var(--muted)]">{label}</span>
                  <span className="text-xs font-bold text-[var(--heading)]">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-black text-[var(--heading)]">Grand Total</span>
                <span className="text-lg font-black text-[var(--primary)]">₹{grandTotal}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-4 gap-2">
              {TRUST.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center p-2 rounded-xl bg-[var(--card-soft)] border border-[var(--border)]">
                  <Icon size={16} className="text-[var(--primary)]" />
                  <span className="text-[9px] font-bold text-[var(--muted)] leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">

      {/* ── BREADCRUMB ── */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-8 lg:px-12 py-3">
        <div className="max-w-[1380px] mx-auto flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <button onClick={() => navigate('/')} className="hover:text-[var(--primary)] font-medium flex items-center gap-1">
            <ArrowLeft size={12} /> Home
          </button>
          <span className="opacity-40">/</span>
          <button
            onClick={goBackToBrowse}
            className={`font-medium ${themeIdx === null ? 'font-bold text-[var(--heading)]' : 'hover:text-[var(--primary)]'}`}
          >
            Custom Cakes
          </button>
          {selectedTier && (
            <>
              <span className="opacity-40">/</span>
              <span className={themeIdx === null ? 'font-bold text-[var(--heading)]' : ''}>
                {currentTier?.shortName}
              </span>
            </>
          )}
          {theme && (
            <>
              <span className="opacity-40">/</span>
              <span className="font-bold text-[var(--heading)]">{theme.name}</span>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-28 lg:pb-8">

        {/* ══════════════════════════════════════════════════════
            BROWSE MODE — show all/filtered themes
        ══════════════════════════════════════════════════════ */}
        {themeIdx === null ? (
          <ThemeBrowseGrid />
        ) : (
          /* ══════════════════════════════════════════════════════
              CUSTOMIZER MODE — selected theme
          ══════════════════════════════════════════════════════ */
          <div>
            {/* Back button */}
            <button
              onClick={goBackToBrowse}
              className="flex items-center gap-2 mb-5 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              <ArrowLeft size={16} /> Back to All Themes
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-8 items-start">

              {/* ── LEFT COLUMN ── */}
              <div className="space-y-5">

                {/* ✅ FIXED: Main image card - LARGER IMAGE */}
                <div
                  className="relative rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm"
                  style={{ background: theme.enabled ? (selectedFlavor?.bg || theme.bg) : theme.bg }}
                >
                  {/* Coming soon blurred bg image */}
                  {!theme.enabled && theme.image && (
                    <img
                      src={theme.image}
                      alt={theme.name}
                      className="absolute inset-0 w-full h-full object-contain p-8 opacity-25"
                    />
                  )}

                  {/* Coming soon overlay */}
                  {!theme.enabled && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[3px]">
                      <span className="text-5xl mb-3">{theme.emoji}</span>
                      <p className="text-white font-black text-2xl tracking-wide">Coming Soon</p>
                      <p className="text-white/75 text-sm mt-1.5 max-w-[220px] text-center leading-relaxed">{theme.description}</p>
                    </div>
                  )}

                  {/* Wishlist button */}
                  <button
                    onClick={() => setWishlisted(w => !w)}
                    className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[var(--card)]/90 backdrop-blur shadow-md flex items-center justify-center hover:scale-110 transition-all border border-[var(--border)]"
                  >
                    <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--muted)]'} />
                  </button>

                  {/* Navigation arrows */}
                  <button onClick={prevTheme} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] shadow-md flex items-center justify-center hover:scale-105 transition-all border border-[var(--border)]">
                    <ChevronLeft size={20} className="text-[var(--primary)]" />
                  </button>
                  <button onClick={nextTheme} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] shadow-md flex items-center justify-center hover:scale-105 transition-all border border-[var(--border)]">
                    <ChevronRight size={20} className="text-[var(--primary)]" />
                  </button>

                  {/* ✅ FIXED: Larger image container - removed max-h constraint */}
                  <div className="flex items-center justify-center min-h-[380px] sm:min-h-[450px]">
                    <AnimatePresence mode="wait">
                      {theme.enabled ? (
                        <motion.img
                          key={`${theme.id}-${selectedFlavor?.id}`}
                          src={selectedFlavor?.image}
                          alt={selectedFlavor?.name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          className="w-full h-full max-h-[420px] object-contain drop-shadow-2xl p-3"
                        />
                      ) : (
                        <div style={{ height: 420 }} />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Dot indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                    {filteredThemes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setThemeIdx(i)}
                        className={`rounded-full transition-all ${i === themeIdx ? 'w-5 h-2 bg-[var(--primary)]' : 'w-2 h-2 bg-white/60 hover:bg-[var(--primary)]/60'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Color strip (desktop) */}
                {theme.enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-black text-[var(--heading)]">Choose Your Color</p>
                      <button className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-0.5">
                        View All <ChevronRight size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {theme.flavors.map(flavor => {
                        const isSel = selectedFlavor?.id === flavor.id;
                        return (
                          <button
                            key={flavor.id}
                            onClick={() => setSelectedFlavor(flavor)}
                            className={`relative group flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isSel
                              ? 'border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)] ring-offset-1'
                              : 'border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm'
                              }`}
                          >
                            <div className="relative w-full" style={{ paddingBottom: '100%', background: flavor.bg }}>
                              <img
                                src={flavor.image}
                                alt={flavor.name}
                                className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                              />
                              {isSel && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow">
                                  <Check size={11} className="text-white" />
                                </span>
                              )}
                            </div>
                            <div className={`w-full px-2 py-2 text-center ${isSel ? 'bg-[var(--card-soft)]' : 'bg-[var(--card)]'}`}>
                              <p className="text-[11px] font-black text-[var(--heading)] leading-tight truncate">{flavor.name}</p>
                              <p className="text-[9px] text-[var(--muted)] font-bold mt-0.5">Visual Color</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Theme strip */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-sm font-black text-[var(--heading)]">Choose Your Theme</p>
                    <button
                      onClick={goBackToBrowse}
                      className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-0.5"
                    >
                      View All <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {filteredThemes.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => selectTheme(i)}
                        className={`relative group flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-200 ${i === themeIdx
                          ? 'border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)] ring-offset-1'
                          : 'border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm'
                          }`}
                      >
                        <div className="relative w-full flex items-center justify-center" style={{ paddingBottom: '100%', background: t.bg }}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {t.enabled && t.flavors[0]
                              ? <img src={t.flavors[0].image} alt={t.name} className="w-full h-full object-contain p-2" />
                              : t.image
                                ? <img src={t.image} alt={t.name} className="w-full h-full object-contain p-2" />
                                : <span className="text-3xl">{t.emoji}</span>
                            }
                          </div>
                          {i === themeIdx && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center z-10">
                              <Check size={9} className="text-white" />
                            </span>
                          )}
                          {!t.enabled && (
                            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-1">
                              <span className="text-[8px] font-black text-white bg-black/50 px-1.5 py-0.5 rounded-full">Soon</span>
                            </div>
                          )}
                        </div>
                        <div className={`w-full px-1 py-1.5 text-center ${i === themeIdx ? 'bg-[var(--card-soft)]' : 'bg-[var(--card)]'}`}>
                          <p className="text-[10px] font-black text-[var(--heading)] leading-tight">{t.shortName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN (Desktop only) ── */}
              <div className="hidden lg:flex flex-col gap-5 sticky top-6">
                {/* Title */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="font-black text-2xl text-[var(--heading)] leading-tight">{theme.name} Cake</h1>
                      <div className="flex items-center gap-1.5 mt-2">
                        <VegIcon />
                        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">100% Pure Veg & Eggless</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--card-soft)] transition-colors">
                        <Share2 size={14} className="text-[var(--muted)]" />
                      </button>
                      <button onClick={() => setWishlisted(w => !w)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--card-soft)] transition-colors">
                        <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--muted)]'} />
                      </button>
                      <span className="bg-[var(--card-soft)] border border-[var(--border)] px-3 py-2 rounded-xl text-center">
                        <span className="block text-[9px] text-[var(--muted)] uppercase tracking-wider font-bold">Tier</span>
                        <span className="block text-sm font-black text-[var(--heading)]">{selectedTier || 1}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14}
                          className={s <= Math.floor(theme.rating || 0) ? 'text-[var(--star)] fill-[var(--star)]' : 'text-[var(--border)]'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-[var(--heading)]">{theme.enabled ? theme.rating : '—'}</span>
                    <span className="text-xs text-[var(--muted)]">({theme.enabled ? theme.reviews : 0} reviews)</span>
                    {theme.enabled
                      ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--badge-green-bg)] text-[var(--success-text)]">{theme.badge}</span>
                      : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--badge-amber-bg)] text-[var(--warning-text)]">Coming Soon</span>
                    }
                  </div>

                  {/* Tier selector inline */}
                  <div className="mt-3 flex gap-2">
                    {TIERS.map(tier => (
                      <button
                        onClick={() => {
                          if (theme) themeIdToKeep.current = theme.id;
                          setSelectedTier(tier.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${(selectedTier || 1) === tier.id
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                          : 'border-[var(--border)] text-[var(--heading)] hover:border-[var(--primary)]'
                          }`}
                      >
                        <Layers size={11} />
                        {tier.shortName}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-sm text-[var(--muted)]">From</span>
                    <span className="text-3xl font-black text-[var(--heading)]">₹{theme.enabled ? basePrice : '—'}</span>
                    {theme.enabled && <span className="text-xs text-[var(--muted)]">· Incl. all taxes</span>}
                  </div>

                  {!theme.enabled && (
                    <div className="mt-3 flex items-start gap-3 bg-[var(--card-soft)] border border-[var(--border)] rounded-2xl p-4">
                      <span className="text-2xl mt-0.5">{theme.emoji}</span>
                      <div>
                        <p className="font-black text-sm text-[var(--heading)]">Coming Soon!</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">{theme.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weight selector */}
                {theme.enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-black text-sm text-[var(--heading)]">Select Cake Weight</p>
                      <span className="text-xs text-[var(--muted)]">Serves {weight.serves} people</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {WEIGHTS.map((w, i) => {
                        const isSel = i === weightIdx;
                        return (
                          <button
                            key={w.label}
                            onClick={() => setWeightIdx(i)}
                            className={`relative flex flex-col items-center py-3 px-1 rounded-xl border-2 text-center transition-all duration-200 ${isSel
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                              : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--primary)]'
                              }`}
                          >
                            {isSel && (
                              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                <Check size={9} className="text-white" />
                              </span>
                            )}
                            <span className="font-black text-xs leading-tight">{w.label}</span>
                            <span className={`text-[11px] font-bold mt-0.5 ${isSel ? 'opacity-80' : 'text-[var(--muted)]'}`}>₹{chipTotal(w)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Personalize */}
                {theme.enabled && (
                  <div>
                    <p className="font-black text-sm text-[var(--heading)] mb-3">Personalize Your Cake</p>
                    {renderPersonalizeForm(false)}
                  </div>
                )}

                {/* Order summary strip */}
                {theme.enabled && (
                  <div className="bg-[var(--card-soft)] rounded-2xl border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden border border-[var(--border)] flex items-center justify-center" style={{ background: selectedFlavor?.bg }}>
                        <img src={selectedFlavor?.image} alt="" className="w-full h-full object-contain p-1.5" />
                      </div>
                      <div className="flex-1 grid grid-cols-5 gap-2 text-center divide-x divide-[var(--border)]">
                        {[
                          { label: 'Tier', value: currentTier?.shortName || 'T1' },
                          { label: 'Theme', value: theme.shortName },
                          { label: 'Color', value: selectedFlavor?.name },
                          { label: 'Weight', value: weight.label },
                          { label: 'Price', value: `₹${grandTotal}` },
                        ].map(({ label, value }) => (
                          <div key={label} className="px-1">
                            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">{label}</p>
                            <p className="text-xs font-black text-[var(--heading)] mt-0.5 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Weight Price', value: `₹${basePrice}` },
                        { label: 'Customization', value: `+₹${themePrice + tierPrice}` },
                        { label: 'Total', value: `₹${grandTotal}`, bold: true },
                      ].map(({ label, value, bold }) => (
                        <div key={label}>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">{label}</p>
                          <p className={`text-sm mt-0.5 ${bold ? 'font-black text-[var(--heading)]' : 'font-bold text-[var(--heading)]'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buy Now & Add to Cart buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || !theme.enabled}
                    className={`h-16 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition flex items-center justify-center gap-3 ${!theme.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--primary)]/5'}`}
                  >
                    {isAdding ? <div className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /> : <ShoppingCart size={20} />}
                    {isAdding ? 'ADDING...' : 'ADD TO CART'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isAdding || !theme.enabled}
                    className={`h-16 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition shadow-xl flex items-center justify-center gap-3 ${theme.enabled
                      ? 'bg-[var(--secondary)] text-[var(--button-text)] shadow-[var(--secondary)]/20 hover:brightness-110 cursor-pointer'
                      : 'bg-[var(--muted)]/40 text-[var(--muted)]/60 cursor-not-allowed shadow-none'
                      }`}
                  >
                    {isAdding ? 'PROCESSING...' : theme.enabled ? 'BUY NOW' : 'NOTIFY ME'} <ArrowRight size={20} />
                  </button>
                </div>

                {theme.enabled && (
                  <p className="text-center text-[11px] text-[var(--muted)]">
                    <BadgeCheck size={12} className="inline mr-1 text-emerald-600" />
                    You will earn <strong>{Math.floor(grandTotal / 100)} Chocolates</strong> reward points
                  </p>
                )}

                {/* Trust badges */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border)]">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--card-soft)] border border-[var(--border)] flex items-center justify-center">
                        <Icon size={14} className="text-[var(--primary)]" />
                      </div>
                      <span className="text-[9px] font-bold text-[var(--muted)] leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          MOBILE BOTTOM BAR — Fixed, above MobileNavBar
      ══════════════════════════════════════════════════════ */}
      {theme && (
        <div
          className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--border)] px-4 py-2.5 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            {/* Cake thumbnail */}
            <div
              className="w-11 h-11 rounded-xl shrink-0 border border-[var(--border)] overflow-hidden flex items-center justify-center"
              style={{ background: selectedFlavor?.bg || theme.bg }}
            >
              {theme.enabled && selectedFlavor
                ? <img src={selectedFlavor.image} alt="" className="w-full h-full object-contain p-1" />
                : theme.image
                  ? <img src={theme.image} alt="" className="w-full h-full object-contain p-1 opacity-70" />
                  : <span className="text-xl">{theme.emoji}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[var(--muted)] truncate">
                {currentTier?.shortName} · {theme.shortName} · {theme.enabled ? selectedFlavor?.name : 'Coming Soon'} · {weight.label}
              </p>
              <p className="font-black text-lg text-[var(--heading)] leading-tight">
                {theme.enabled ? `₹${grandTotal}` : '—'}
              </p>
            </div>

            {/* Customize button */}
            <button
              onClick={() => { setDrawerOpen(true); setMobileStep(0); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] text-[var(--button-text)] rounded-xl text-xs font-black uppercase tracking-wide shadow-md active:scale-95 transition-all"
            >
              Customize <ChevronUp size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MOBILE DRAWER — Step-by-step (with Tier as step 0)
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-50"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-3xl border-t border-[var(--border)] flex flex-col"
              style={{ maxHeight: '88vh' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 pt-1 shrink-0 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  {/* Back arrow for steps > 0 */}
                  {mobileStep > 0 && (
                    <button
                      onClick={() => setMobileStep(s => s - 1)}
                      className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"
                    >
                      <ChevronLeft size={15} className="text-[var(--muted)]" />
                    </button>
                  )}
                  <div>
                    <p className="font-black text-base text-[var(--heading)]">
                      {STEPS[mobileStep].label}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Step {mobileStep + 1} of {STEPS.length}</p>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-full border border-[var(--border)]">
                  <X size={15} />
                </button>
              </div>

              {/* Step progress bar */}
              <div className="flex gap-1 px-4 py-2.5 shrink-0">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setMobileStep(i)}
                    className={`flex-1 h-1.5 rounded-full transition-all ${i <= mobileStep ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                      }`}
                  />
                ))}
              </div>

              {/* Step tab icons */}
              <div className="flex px-4 gap-1 pb-3 shrink-0">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < mobileStep;
                  const active = i === mobileStep;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setMobileStep(i)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all ${active
                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
                        : done
                          ? 'bg-[var(--card-soft)]'
                          : 'bg-transparent'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-[var(--primary)]' : active ? 'bg-[var(--primary)]/20' : 'bg-[var(--border)]'
                        }`}>
                        {done
                          ? <Check size={11} className="text-white" />
                          : <Icon size={11} className={active ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                        }
                      </div>
                      <span className={`text-[9px] font-bold leading-none ${active ? 'text-[var(--primary)]' : done ? 'text-[var(--heading)]' : 'text-[var(--muted)]'
                        }`}>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable step content */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  >
                    <MobileStepContent />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom action buttons */}
              <div className="px-4 pt-3 pb-4 border-t border-[var(--border)] shrink-0 space-y-2.5">
                {mobileStep < STEPS.length - 1 ? (
                  <button
                    onClick={() => {
                      if (mobileStep === 0 && !selectedTier) {
                        toast.error('Please select a tier');
                        return;
                      }
                      if (mobileStep === 1 && (themeIdx === null || !filteredThemes[themeIdx]?.enabled)) {
                        toast.error('Please select an available theme');
                        return;
                      }
                      setMobileStep(s => s + 1);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-xl font-black text-sm tracking-wide shadow-md active:scale-95 transition-all"
                  >
                    Continue to {STEPS[mobileStep + 1].label}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleBuyNow}
                      disabled={isAdding || !theme?.enabled}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-xl font-black text-sm tracking-wide shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      {isAdding ? 'Processing...' : 'Buy Now'}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={isAdding || !theme?.enabled}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[var(--card)] border-2 border-[var(--primary)] text-[var(--primary)] rounded-xl font-black text-sm tracking-wide active:scale-95 transition-all disabled:opacity-50"
                    >
                      <ShoppingCart size={16} />
                      {isAdding ? 'Adding...' : 'Cart'}
                    </button>
                  </div>
                )}

                {/* Mini summary row */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{currentTier?.shortName || '—'} · {theme?.shortName || '—'} · {theme?.enabled ? selectedFlavor?.name : '—'} · {weight.label}</span>
                  <span className="font-black text-[var(--heading)]">
                    {theme?.enabled ? `₹${grandTotal}` : '—'}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
