import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Star, Heart, ChevronDown, ChevronUp, Layers, Filter, Eye, Search, Settings2, X, SlidersHorizontal
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { addToCart } from '../redux/slices/cartSlice';
import { saveCustomCakeRequest } from '../utils/customCake';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PureVegIcon from '../assets/pure veg.webp';

// ── Import separated data ────────────────────────────────────────────────
import {
  TIERS, WEIGHTS, getTierById
} from './customCakeData';

import CustomCakeBrowse from './CustomCakeBrowse';
import CustomCakeDetail from './CustomCakeDetail';

// ─── HELPER: Accordion Section Card ────────────────────────────────────
const SectionCard = ({ title, expanded, onToggle, children }) => (
  <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01]">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 px-4 text-left group transition-colors"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#A18881] group-hover:text-[#EBD1C6] transition-colors">
        {title}
      </h3>
      {expanded ? (
        <ChevronUp size={16} className="text-[#A18881]/60 group-hover:text-[#EBD1C6] transition-colors" />
      ) : (
        <ChevronDown size={16} className="text-[#A18881]/60 group-hover:text-[#EBD1C6] transition-colors" />
      )}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="px-4 pb-4 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export default function CustomCake() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // ── STATE ──────────────────────────────────────────────────
  const getSessionData = (key, defaultVal) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  // ── Filter Drawer State ──────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);       // mobile
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false); // desktop

  // ── Accordion State ──────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    tiers: true,
    search: true,
    sort: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const [selectedTier, setSelectedTier] = useState(null);
  const [themeIdx, setThemeIdx] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null); // Visual Color
  const [selectedDbFlavor, setSelectedDbFlavor] = useState(null); // Internal Sponge Flavour
  const [weightIdx, setWeightIdx] = useState(() => getSessionData('customCake_weightIdx', 0));
  const [customerName, setCustomerName] = useState(() => getSessionData('customCake_name', ''));
  const [age, setAge] = useState(() => getSessionData('customCake_age', '1'));
  const [message, setMessage] = useState(() => getSessionData('customCake_message', ''));
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('customCake_weightIdx', JSON.stringify(weightIdx));
    sessionStorage.setItem('customCake_name', JSON.stringify(customerName));
    sessionStorage.setItem('customCake_age', JSON.stringify(age));
    sessionStorage.setItem('customCake_message', JSON.stringify(message));
  }, [weightIdx, customerName, age, message]);

  useEffect(() => {
    if (selectedFlavor) sessionStorage.setItem('customCake_visualFlavor', JSON.stringify(selectedFlavor.name));
    if (selectedDbFlavor) sessionStorage.setItem('customCake_insideFlavor', JSON.stringify(selectedDbFlavor.name));
  }, [selectedFlavor, selectedDbFlavor]);
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Flavour Dropdown State
  const [flavorDropdownOpen, setFlavorDropdownOpen] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [showMobileConfig, setShowMobileConfig] = useState(false);
  const configRef = useRef(null);

  // Filter States
  const [themeSearchFilter, setThemeSearchFilter] = useState('');
  const [priceSortFilter, setPriceSortFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [dbThemes, setDbThemes] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedTier, themeSearchFilter, priceSortFilter, categoryFilter]);

  useEffect(() => {
    const loadDbData = async () => {
      try {
        setLoading(true);
        const [themesRes, catsRes] = await Promise.all([
          api.get('/custom-cakes/themes'),
          api.get('/categories', { params: { activeOnly: true, type: 'custom' } })
        ]);

        if (themesRes.data?.data) {
          setDbThemes(themesRes.data.data);
        }
        if (catsRes.data?.data) {
          setDbCategories(catsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load custom cake data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDbData();
  }, []);

  const themeIdToKeep = useRef(searchParams.get('theme'));

  // ── HANDLE URL PARAMETERS FOR TIER & THEME ────────────────
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    const themeParam = searchParams.get('theme');
    const categoryParam = searchParams.get('category');

    if (tierParam) {
      const tierNum = parseInt(tierParam, 10);
      if ([1, 2, 3].includes(tierNum)) {
        setSelectedTier(tierNum);
      }
    }

    if (themeParam) {
      themeIdToKeep.current = themeParam;
    }

    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  // ── DERIVED ────────────────────────────────────────────────
  const filteredThemes = useMemo(() => {
    let result = dbThemes
      .filter(t => {
        if (!selectedTier) return true;
        const numTier = Number(selectedTier);
        if (!t.tiers || Object.keys(t.tiers).length === 0) {
          return numTier === 1;
        }
        return Boolean(t.tiers[`tier${numTier}`]?.isActive);
      })
      .filter(t => {
        if (!themeSearchFilter) return true;
        const q = themeSearchFilter.toLowerCase().trim();
        return (t.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      })
      .filter(t => {
        if (!categoryFilter) return true;
        const targetCat = categoryFilter.toLowerCase().trim();
        if (!t.category || t.category.length === 0) return false;
        return t.category.some(c => c.toLowerCase().trim() === targetCat || c.toLowerCase().trim().includes(targetCat));
      })
      .map(t => {
        const activeTiers = [1, 2, 3].filter(num => !t.tiers || Object.keys(t.tiers).length === 0 ? num === 1 : t.tiers[`tier${num}`]?.isActive);
        const effectiveTier = Number(selectedTier) || activeTiers[0] || 1;

        const mappedFlavors = (t.colors || [])
          .filter(c => c.isActive && Boolean(c.images?.tier1 || c.images?.tier2 || c.images?.tier3))
          .map(c => {
            let imgUrl = c.images?.[`tier${effectiveTier}`] || c.images?.tier2 || c.images?.tier1 || c.images?.tier3;
            return {
              id: c._id,
              name: c.name,
              hexCode: c.hexCode || '#fff',
              image: imgUrl,
              price: c.price || 0,
              bg: c.hexCode || '#fff'
            };
          });

        const tierAdjustmentPrice = t.tiers?.[`tier${effectiveTier}`]?.price || 0;
        const basePrice = Math.round((1120) + (mappedFlavors[0]?.price || 0) + tierAdjustmentPrice);

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
          tiers: activeTiers,
          defaultTier: effectiveTier,
          emoji: '🎂',
          tierPricing: t.tiers,
          basePrice
        };
      });

    if (priceSortFilter === 'asc') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (priceSortFilter === 'desc') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      result.sort((a, b) => {
        const aDoc = dbThemes.find(dt => dt._id === a.id);
        const bDoc = dbThemes.find(dt => dt._id === b.id);
        return (aDoc?.displayOrder || 0) - (bDoc?.displayOrder || 0);
      });
    }

    return result;
  }, [dbThemes, selectedTier, themeSearchFilter, priceSortFilter, categoryFilter]);

  const theme = themeIdx !== null ? filteredThemes[themeIdx] : null;
  const weight = WEIGHTS[weightIdx];
  const activeTierNumber = selectedTier || theme?.defaultTier || theme?.tiers?.[0] || 1;
  const currentTier = getTierById(activeTierNumber);

  useEffect(() => {
    // Set Visual Color
    if (theme && theme.flavors?.length) {
      const storedVisual = getSessionData('customCake_visualFlavor', null);
      const existing = theme.flavors.find(f => f.name === selectedFlavor?.name || f.name === storedVisual);
      setSelectedFlavor(existing || theme.flavors[0]);
    } else {
      setSelectedFlavor(null);
    }

    // Set Internal Sponge Flavour
    if (theme && theme.dbFlavors?.length) {
      const storedInside = getSessionData('customCake_insideFlavor', null);
      const existing = theme.dbFlavors.find(f => f.name === selectedDbFlavor?.name || f.name === storedInside);
      setSelectedDbFlavor(existing || theme.dbFlavors[0]);
    } else {
      setSelectedDbFlavor(null);
    }
  }, [themeIdx, selectedTier, theme]);

  useEffect(() => {
    if (themeIdToKeep.current && filteredThemes.length > 0) {
      const newIdx = filteredThemes.findIndex(t => t.id === themeIdToKeep.current);
      if (newIdx !== -1) {
        setThemeIdx(newIdx);
      } else {
        setThemeIdx(null);
      }
    } else if (themeIdToKeep.current === null) {
      setThemeIdx(null);
    }
  }, [selectedTier, filteredThemes]);

  const updateThemeUrl = useCallback((t) => {
    if (!t) return;
    themeIdToKeep.current = t.id;
    const params = new URLSearchParams(window.location.search);
    params.set('theme', t.id);
    if (selectedTier) params.set('tier', selectedTier);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedTier]);

  const prevTheme = useCallback(() => {
    if (!filteredThemes.length) return;
    setThemeIdx(i => {
      const newIdx = i === null ? filteredThemes.length - 1 : (i - 1 + filteredThemes.length) % filteredThemes.length;
      updateThemeUrl(filteredThemes[newIdx]);
      return newIdx;
    });
  }, [filteredThemes, updateThemeUrl]);

  const nextTheme = useCallback(() => {
    if (!filteredThemes.length) return;
    setThemeIdx(i => {
      const newIdx = i === null ? 0 : (i + 1) % filteredThemes.length;
      updateThemeUrl(filteredThemes[newIdx]);
      return newIdx;
    });
  }, [filteredThemes, updateThemeUrl]);

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
      const baseCakeId = `custom-${theme.id}-${selectedFlavor.id}-${selectedTier || 1}-${selectedDbFlavor?._id || 'noflav'}-${weight.label.replace(/\s+/g, '')}`;

      dispatch(addToCart({
        product: {
          _id: baseCakeId,
          name: `${selectedDbFlavor?.name || 'Custom'} Cake — ${theme.name} (${tierLabel})`,
          description: theme.description,
          image: selectedFlavor.image || theme.image || theme.flavors?.[0]?.image,
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
      setTimeout(() => navigate('/cart'), 400);
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
      const baseCakeId = `custom-${theme.id}-${selectedFlavor.id}-${selectedTier || 1}-${selectedDbFlavor?._id || 'noflav'}-${weight.label.replace(/\s+/g, '')}`;

      const directItem = {
        product: {
          _id: baseCakeId,
          name: `${selectedDbFlavor?.name || 'Custom'} Cake — ${theme.name} (${tierLabel})`,
          description: theme.description,
          image: selectedFlavor.image || theme.image || theme.flavors?.[0]?.image,
          price: grandTotal, stock: 5, category: 'Custom Cakes',
        },
        productId: baseCakeId,
        name: `${selectedDbFlavor?.name || 'Custom'} Cake — ${theme.name} (${tierLabel})`,
        image: selectedFlavor.image || theme.image || theme.flavors?.[0]?.image,
        qty: 1,
        price: grandTotal,
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

      toast.success('🎂 Directed to checkout!');
      setTimeout(() => navigate('/checkout', { state: { directItem } }), 400);
    } catch { toast.error('Failed to proceed. Please try again.'); }
    finally { setIsAdding(false); }
  };

  const goBackToBrowse = () => {
    themeIdToKeep.current = null;
    setThemeIdx(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('theme');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const selectTheme = (idx) => {
    setThemeIdx(idx);
    const t = filteredThemes[idx];
    if (t) themeIdToKeep.current = t.id;
    if (t && t.flavors.length) {
      setSelectedFlavor(t.flavors[0]);
      sessionStorage.setItem('customCake_visualFlavor', JSON.stringify(t.flavors[0].name));
    }
    if (t && t.dbFlavors?.length) {
      setSelectedDbFlavor(t.dbFlavors[0]);
      sessionStorage.setItem('customCake_insideFlavor', JSON.stringify(t.dbFlavors[0].name));
    }
    const params = new URLSearchParams(window.location.search);
    if (t) params.set('theme', t.id);
    if (selectedTier) params.set('tier', selectedTier);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const isThemeWishlisted = theme ? isInWishlist(theme.id, 'customCake') : false;

  // ── Filter Panel (used in both mobile & desktop drawers) ──
  const FilterPanel = () => (
    <div className="space-y-4">
      {/* Tiers */}
      <SectionCard
        title="Tiers"
        expanded={expandedSections.tiers}
        onToggle={() => toggleSection('tiers')}
      >
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              selectedTier === null
                ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
            }`}
          >
            All Tiers
          </button>
          {[1, 2, 3].map((num) => {
            const tier = getTierById(num);
            const isActive = selectedTier === num;
            return (
              <button
                key={num}
                onClick={() => setSelectedTier(isActive ? null : num)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                    : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                }`}
              >
                {tier?.shortName || `Tier ${num}`}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Categories */}
      <SectionCard
        title="Categories"
        expanded={expandedSections.categories}
        onToggle={() => toggleSection('categories')}
      >
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              categoryFilter === ''
                ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
            }`}
          >
            All
          </button>
          {dbCategories.map(c => {
            const slug = (c.name || '').toLowerCase();
            const isActive = categoryFilter.toLowerCase() === slug;
            return (
              <button
                key={c._id}
                onClick={() => setCategoryFilter(isActive ? '' : slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                    : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                }`}
              >
                {c.label || c.name}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Search */}
      <SectionCard
        title="Search Themes"
        expanded={expandedSections.search}
        onToggle={() => toggleSection('search')}
      >
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by theme name..."
            value={themeSearchFilter}
            onChange={(e) => setThemeSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-black/30 border border-[#3A211B] rounded-lg focus:outline-none focus:border-[#E6B25A] text-white placeholder:text-white/20 transition-colors"
          />
        </div>
      </SectionCard>

      {/* Sort */}
      <SectionCard
        title="Sort By"
        expanded={expandedSections.sort}
        onToggle={() => toggleSection('sort')}
      >
        <div className="relative">
          <select
            value={priceSortFilter}
            onChange={(e) => setPriceSortFilter(e.target.value)}
            className="w-full appearance-none bg-black/30 border border-[#3A211B] text-[#ecded9] font-bold text-sm py-3 pl-3.5 pr-8 rounded-lg focus:outline-none focus:border-[#E6B25A] cursor-pointer"
          >
            <option value="" className="bg-[#1A0E0B]">Default</option>
            <option value="asc" className="bg-[#1A0E0B]">Price: Low → High</option>
            <option value="desc" className="bg-[#1A0E0B]">Price: High → Low</option>
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </SectionCard>

      {/* Reset */}
      <button
        onClick={() => {
          setSelectedTier(null);
          setThemeSearchFilter('');
          setPriceSortFilter('');
          setCategoryFilter('');
        }}
        className="w-full py-3.5 border border-[#3A211B] bg-white/[0.01] hover:bg-white/[0.03] text-white/70 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">

      {/* ── BREADCRUMB ── */}
      {themeIdx !== null && (
        <div className="bg-[var(--card)] border-b border-[var(--border)] py-3">
          <div className="responsive-container flex items-center gap-1.5 text-xs text-[var(--muted)] overflow-x-auto no-scrollbar">
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
      )}

      {/* ── MAIN ── */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 pb-40 lg:pb-8 tv:py-10">
        {themeIdx === null ? (
          <>
            {/* Render browse grid */}
            <CustomCakeBrowse
              filteredThemes={filteredThemes}
              loading={loading || isFiltering}
              selectedTier={selectedTier}
              setSelectedTier={setSelectedTier}
              themeSearchFilter={themeSearchFilter}
              setThemeSearchFilter={setThemeSearchFilter}
              priceSortFilter={priceSortFilter}
              setPriceSortFilter={setPriceSortFilter}
              selectTheme={selectTheme}
              hideFilters={false}
              onToggleFilter={() => setIsFilterOpen(true)}
              onToggleDesktopFilter={() => setIsDesktopFilterOpen(true)}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              categories={dbCategories}
            />

            {/* ── Desktop Filter Drawer ── */}
            <AnimatePresence>
              {isDesktopFilterOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDesktopFilterOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 28 }}
                    className="fixed left-0 top-0 bottom-0 w-full sm:w-[85%] max-w-sm bg-[var(--card)] z-[210] p-5 overflow-y-auto shadow-2xl border-r border-[var(--border)]"
                  >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                      <h2 className="text-lg font-bold text-[var(--heading)]">Filters</h2>
                      <button onClick={() => setIsDesktopFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <FilterPanel />
                    <button onClick={() => setIsDesktopFilterOpen(false)}
                      className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md">
                      Apply Filters
                    </button>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* ── Mobile Filter Drawer ── */}
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] sm:hidden"
                  />
                  <motion.aside
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                    className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[380px] h-full bg-[#1A0E0B] z-[210] flex flex-col text-[#ecded9] border-l border-[#3A211B] shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:hidden"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center py-5 px-6 border-b border-[#3A211B] bg-[#2A1813] select-none">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-[#E6B25A]" />
                        <h2 className="text-base font-black uppercase tracking-wider text-white">Filters</h2>
                      </div>
                      <button 
                        onClick={() => setIsFilterOpen(false)} 
                        className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-[#A18881] hover:text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#1A0E0B]">
                      <FilterPanel />
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[#3A211B] bg-[#2A1813] flex gap-3">
                      <button 
                        onClick={() => {
                          setSelectedTier(null);
                          setThemeSearchFilter('');
                          setPriceSortFilter('');
                          setCategoryFilter('');
                        }}
                        className="flex-1 py-3.5 border border-[#3A211B] bg-[#1A0E0B] text-white hover:bg-black/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-[2] py-3.5 bg-[#E6B25A] hover:bg-[#F0C46E] text-[#120806] rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#E6B25A]/10 transition-all"
                      >
                        Show Results
                      </button>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        ) : (
          <CustomCakeDetail
            theme={theme}
            currentTier={currentTier}
            selectedTier={selectedTier}
            filteredThemes={filteredThemes}
            selectedFlavor={selectedFlavor}
            setSelectedFlavor={setSelectedFlavor}
            selectedDbFlavor={selectedDbFlavor}
            setSelectedDbFlavor={setSelectedDbFlavor}
            weight={weight}
            weightIdx={weightIdx}
            setWeightIdx={setWeightIdx}
            customerName={customerName}
            setCustomerName={setCustomerName}
            age={age}
            setAge={setAge}
            message={message}
            setMessage={setMessage}
            isAdding={isAdding}
            flavorDropdownOpen={flavorDropdownOpen}
            setFlavorDropdownOpen={setFlavorDropdownOpen}
            flavorSearch={flavorSearch}
            setFlavorSearch={setFlavorSearch}
            showMobileConfig={showMobileConfig}
            setShowMobileConfig={setShowMobileConfig}
            configRef={configRef}
            getFlavorWeightPrice={getFlavorWeightPrice}
            basePrice={basePrice}
            themePrice={themePrice}
            tierPrice={tierPrice}
            grandTotal={grandTotal}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            goBackToBrowse={goBackToBrowse}
            prevTheme={prevTheme}
            nextTheme={nextTheme}
            selectTheme={selectTheme}
            isThemeWishlisted={isThemeWishlisted}
            toggleWishlist={toggleWishlist}
            WEIGHTS={WEIGHTS}
          />
        )}
      </main>
    </div>
  );
}