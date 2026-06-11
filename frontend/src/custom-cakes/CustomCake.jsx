import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Star, Shield, Leaf, Clock, Heart, Share2, ChevronDown, X,
  ChevronUp, Sparkles, BadgeCheck, Cake, Palette, Weight, 
  UserCircle, ReceiptText, Layers, Filter, Eye
} from 'lucide-react';
import { addToCart } from '../redux/slices/cartSlice';
import { saveCustomCakeRequest } from '../utils/customCake';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PureVegIcon from '../assets/pure veg.webp';

// ── Import separated data ────────────────────────────────────────────────
import {
  TIERS, WEIGHTS, TRUST, getTierById
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
  const [wishlisted, setWishlisted] = useState(false);
  const [dbFlavors, setDbFlavors] = useState([]);
  const [selectedDbFlavor, setSelectedDbFlavor] = useState(null);
  const [flavorDropdownOpen, setFlavorDropdownOpen] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState('');

  const [dbThemes, setDbThemes] = useState([]);

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
          flavors: mappedFlavors,
          dbFlavors: (t.flavors || []).filter(f => f.isActive),
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
  
  useEffect(() => {
    if (theme && theme.flavors?.length) {
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
    if (!selectedDbFlavor || !selectedDbFlavor.weights) return 1120;
    const weightVal = parseFloat(w.label);
    const weightObj = selectedDbFlavor.weights.find(x => x.kg === weightVal);
    if (weightObj) return weightObj.price;
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

  // ── OPERATIONS ─────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!theme) { toast.error('Please select a theme first'); return; }
    if (!theme.enabled) { toast.error('This theme is coming soon!'); return; }
    if (!customerName.trim()) { toast.error('Please enter the name for the cake'); return; }
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

  const handleBuyNow = async () => {
    if (!theme) { toast.error('Please select a theme first'); return; }
    if (!theme.enabled) { toast.error('This theme is coming soon!'); return; }
    if (!customerName.trim()) { toast.error('Please enter the name for the cake'); return; }
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

  const goBackToBrowse = () => {
    setThemeIdx(null);
  };

  const selectTheme = (idx) => {
    setThemeIdx(idx);
    const t = filteredThemes[idx];
    if (t && t.flavors.length) setSelectedFlavor(t.flavors[0]);
    if (t && t.dbFlavors?.length) setSelectedDbFlavor(t.dbFlavors[0]);
  };

  // ── SHARED PERSONALIZATION WORKFLOW ───────────────────────
  const renderPersonalizeForm = (compact = false) => (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2">
        <VegIcon />
        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">100% Pure Veg & Eggless</span>
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
          Choose Your Flavour <span className="text-red-500">*</span>
        </label>
        
        <button
          type="button"
          onClick={() => setFlavorDropdownOpen(!flavorDropdownOpen)}
          className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] flex items-center justify-between transition-all font-bold"
        >
          {selectedDbFlavor ? <span>{selectedDbFlavor.name}</span> : <span className="text-[var(--muted)]">No flavours mapped</span>}
          <ChevronDown size={16} className={`transition-transform duration-200 ${flavorDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {flavorDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/0" onClick={() => setFlavorDropdownOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden max-h-[300px] flex flex-col"
              >
                <div className="p-3 border-b border-[var(--border)] bg-[var(--card-soft)] flex-shrink-0 relative z-50">
                  <input
                    type="text"
                    placeholder="Search flavours..."
                    value={flavorSearch}
                    onChange={(e) => setFlavorSearch(e.target.value)}
                    className="w-full bg-[var(--input)] border border-[var(--input-border)] px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] font-semibold text-[var(--foreground)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

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
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
            Name on Cake <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text" maxLength={20}
              placeholder="e.g. Kavin"
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
            placeholder="Happy Birthday!"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-14 transition-all"
          />
          <span className="absolute right-3 top-2.5 text-[10px] text-[var(--muted)] font-bold">{message.length}/60</span>
        </div>
      </div>
    </div>
  );

  const TierFilterBar = () => (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setSelectedTier(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${selectedTier === null
          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-lg shadow-[var(--primary)]/20 scale-105'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--primary)] hover:shadow-md'
          }`}
      >
        <Eye size={14} /> All Themes {selectedTier === null && <Check size={12} />}
      </button>

      {TIERS.map(tier => (
        <button
          key={tier.id}
          onClick={() => setSelectedTier(tier.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${selectedTier === tier.id
            ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-lg shadow-[var(--primary)]/20 scale-105'
            : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--primary)] hover:shadow-md'
            }`}
        >
          <Layers size={14} /> {tier.shortName}
          <span className={`text-[10px] font-medium normal-case ${selectedTier === tier.id ? 'opacity-80' : 'text-[var(--muted)]'}`}>
            ({tier.layers} {tier.layers === 1 ? 'Layer' : 'Layers'})
          </span>
          {selectedTier === tier.id && <Check size={12} />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      
      {/* ── BREADCRUMB ── */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-8 lg:px-12 py-3">
        <div className="max-w-[1380px] mx-auto flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <button onClick={() => navigate('/')} className="hover:text-[var(--primary)] font-medium flex items-center gap-1">
            <ArrowLeft size={12} /> Home
          </button>
          <span className="opacity-40">/</span>
          <button onClick={goBackToBrowse} className={`font-medium ${themeIdx === null ? 'font-bold text-[var(--heading)]' : 'hover:text-[var(--primary)]'}`}>
            Custom Cakes
          </button>
          {selectedTier && <><span className="opacity-40">/</span><span className={themeIdx === null ? 'font-bold text-[var(--heading)]' : ''}>{currentTier?.shortName}</span></>}
          {theme && <><span className="opacity-40">/</span><span className="font-bold text-[var(--heading)]">{theme.name}</span></>}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-32 lg:pb-8">
        {themeIdx === null ? (
          /* ══════════════════════════════════════════════════════
              BROWSE MODE — Grid of available items
          ══════════════════════════════════════════════════════ */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-black text-3xl sm:text-4xl text-[var(--heading)] tracking-tight leading-tight">Custom Cakes</h1>
                <p className="text-sm text-[var(--muted)] mt-1 font-medium">Choose your tier and theme to start configuring your cake</p>
              </div>
              <div className="flex items-center gap-2 bg-[var(--card-soft)] border border-[var(--border)] px-4 py-2 rounded-2xl">
                <Filter size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-black text-[var(--heading)]">{filteredThemes.length} Themes</span>
              </div>
            </div>

            <TierFilterBar />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredThemes.map((t, i) => (
                  <motion.div
                    key={t.id} layout
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => selectTheme(i)}
                    className="relative group flex flex-col rounded-3xl border-2 border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-left bg-[var(--card)] cursor-pointer"
                  >
                    {/* Portrait Frame Aspect Ratio mapping 70278.jpg correctly */}
                    <div className="relative w-full overflow-hidden aspect-[3/4]" style={{ background: t.bg }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {t.enabled && t.flavors[0]
                          ? <img src={t.flavors[0].image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          : t.image ? <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <span className="text-6xl">{t.emoji}</span>
                        }
                      </div>
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${t.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.badge}</span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-base text-[var(--heading)] leading-tight">{t.name}</h3>
                        {t.enabled && <div className="flex items-center gap-1 shrink-0"><Star size={12} className="text-[var(--star)] fill-[var(--star)]" /><span className="text-xs font-black text-[var(--heading)]">{t.rating}</span></div>}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-2">{t.description}</p>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-sm font-black text-[var(--primary)]">From ₹{Math.round((1120) + (t.flavors[0]?.price || 0) + (t.tierPricing?.tier1?.price || 0))}</span>
                        <span className="text-[10px] font-black text-[var(--primary)] flex items-center gap-1">Customize <ChevronRight size={12} /></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════
              CUSTOMIZER MODE — Unified PC & Mobile Detail Form View
          ══════════════════════════════════════════════════════ */
          <div>
            <button onClick={goBackToBrowse} className="flex items-center gap-2 mb-5 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
              <ArrowLeft size={16} /> Back to All Themes
            </button>

            {/* Always Dual-Column Layout across Mobile, Tablet, and Laptop */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-6 lg:gap-8 items-start">
              
              {/* ── LEFT CONTAINER: Main Structural Image Framing ── */}
              <div className="space-y-5">
                {/* Fixed Portrait Frame Box with dynamic bounds preventing crop issues */}
                <div 
                  className="relative aspect-[3/4] max-w-[450px] mx-auto w-full rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm"
                  style={{ background: theme.enabled ? (selectedFlavor?.bg || theme.bg) : theme.bg }}
                >
                  {!theme.enabled && theme.image && <img src={theme.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
                  {!theme.enabled && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[3px]">
                      <span className="text-5xl mb-3">{theme.emoji}</span>
                      <p className="text-white font-black text-2xl">Coming Soon</p>
                    </div>
                  )}

                  <button onClick={() => setWishlisted(w => !w)} className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[var(--card)]/90 backdrop-blur shadow flex items-center justify-center border border-[var(--border)]">
                    <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--muted)]'} />
                  </button>

                  <button onClick={prevTheme} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] shadow flex items-center justify-center border border-[var(--border)]"><ChevronLeft size={20} /></button>
                  <button onClick={nextTheme} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] shadow flex items-center justify-center border border-[var(--border)]"><ChevronRight size={20} /></button>

                  <div className="w-full h-full">
                    <AnimatePresence mode="wait">
                      {theme.enabled ? (
                        <motion.img
                          key={`${theme.id}-${selectedFlavor?.id}`}
                          src={selectedFlavor?.image}
                          alt={selectedFlavor?.name}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="w-full h-full object-cover"
                        />
                      ) : <div className="w-full h-full" />}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Color Strip Configuration */}
                {theme.enabled && (
                  <div>
                    <p className="text-sm font-black text-[var(--heading)] mb-2.5">Choose Your Color</p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {theme.flavors.map(flavor => {
                        const isSel = selectedFlavor?.id === flavor.id;
                        return (
                          <button
                            key={flavor.id} onClick={() => setSelectedFlavor(flavor)}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${isSel ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'}`}
                            style={{ background: flavor.bg }}
                          >
                            <img src={flavor.image} alt="" className="w-full h-full object-cover" />
                            {isSel && <span className="absolute top-1 right-1 bg-[var(--primary)] text-white rounded-full p-0.5"><Check size={8} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT CONTAINER: Form details display structural parity on mobile ── */}
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="font-black text-2xl lg:text-3xl text-[var(--heading)] leading-tight">{theme.name} Cake</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-[var(--star)] fill-[var(--star)]" />)}</div>
                    <span className="text-xs text-[var(--muted)]">({theme.reviews} reviews)</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {TIERS.map(tier => (
                      <button
                        key={tier.id}
                        onClick={() => { if (theme) themeIdToKeep.current = theme.id; setSelectedTier(tier.id); }}
                        className={`px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${(selectedTier || 1) === tier.id ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)]' : 'border-[var(--border)] text-[var(--heading)]'}`}
                      >
                        {tier.shortName}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-xs text-[var(--muted)] font-bold">Total configuration value:</span>
                    <span className="text-3xl font-black text-[var(--heading)]">₹{theme.enabled ? grandTotal : '—'}</span>
                  </div>
                </div>

                {/* Weight selection configuration setup */}
                {theme.enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black text-sm text-[var(--heading)]">Select Cake Weight</p>
                      <span className="text-xs text-[var(--muted)] font-bold">Serves {weight.serves} people</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {WEIGHTS.map((w, i) => {
                        const isSel = i === weightIdx;
                        return (
                          <button
                            key={w.label} onClick={() => setWeightIdx(i)}
                            className={`py-2.5 rounded-xl border-2 text-center text-xs font-black transition-all ${isSel ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--button-text)] shadow-sm' : 'border-[var(--border)] bg-[var(--card)]'}`}
                          >
                            <div>{w.label}</div>
                            <div className={`text-[9px] font-bold ${isSel ? 'text-white/90' : 'text-[var(--muted)]'}`}>+₹{chipTotal(w) - basePrice}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Main Custom Details Form Fields Render */}
                {theme.enabled && (
                  <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl space-y-4">
                    <p className="font-black text-sm text-[var(--heading)] border-b border-[var(--border)] pb-2">Custom Configuration Specifications</p>
                    {renderPersonalizeForm(false)}
                  </div>
                )}

                {/* Config Breakdown Summary Receipt Area */}
                {theme.enabled && (
                  <div className="bg-[var(--card-soft)] rounded-2xl border border-[var(--border)] p-4 space-y-2 text-xs">
                    <div className="flex justify-between"><span>Base Cake Weight Layer Weight</span><span className="font-bold">₹{basePrice}</span></div>
                    <div className="flex justify-between"><span>Tier & Structural Frame Pricing</span><span className="font-bold">+₹{tierPrice}</span></div>
                    <div className="flex justify-between"><span>Theme Color Modification Addon</span><span className="font-bold">+₹{themePrice}</span></div>
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-black text-[var(--primary)]"><span>Grand Valuation Total:</span><span>₹{grandTotal}</span></div>
                  </div>
                )}

                {/* Structural Grid Buttons (Visible on desktop view models natively) */}
                <div className="hidden md:grid grid-cols-2 gap-3 mt-2">
                  <button onClick={handleAddToCart} disabled={isAdding} className="h-14 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--primary)]/5">
                    <ShoppingCart size={18} /> ADD TO CART
                  </button>
                  <button onClick={handleBuyNow} disabled={isAdding} className="h-14 bg-[var(--secondary)] text-[var(--button-text)] font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg">
                    BUY NOW <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER VIEWPORT FLOATING MOBILE INTERACTION BUTTONS ── */}
      {theme && theme.enabled && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-3 shadow-2xl flex gap-3">
          <button 
            onClick={handleAddToCart} 
            disabled={isAdding} 
            className="flex-1 h-12 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-xs rounded-xl flex items-center justify-center gap-2 bg-[var(--card)]"
          >
            <ShoppingCart size={16} /> CART
          </button>
          <button 
            onClick={handleBuyNow} 
            disabled={isAdding} 
            className="flex-1 h-12 bg-[var(--secondary)] text-[var(--button-text)] font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl"
          >
            BUY NOW <ArrowRight size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
