import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Star, Heart, ChevronDown, ChevronUp, Layers, Filter, Eye, Search, Settings2, X
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
  <div className="bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3.5 bg-[var(--heading)]/5 hover:bg-[var(--heading)]/10 transition-colors border-b border-[var(--border)]"
    >
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80">
        {title}
      </h3>
      {expanded ? (
        <ChevronUp size={18} className="text-[var(--heading)]/60" />
      ) : (
        <ChevronDown size={18} className="text-[var(--heading)]/60" />
      )}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-3.5 pb-3.5 pt-3"
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

  const [dbThemes, setDbThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDbData = async () => {
      try {
        setLoading(true);
        const [themesRes] = await Promise.all([
          api.get('/custom-cakes/themes')
        ]);

        if (themesRes.data?.data) {
          setDbThemes(themesRes.data.data);
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

    if (tierParam) {
      const tierNum = parseInt(tierParam, 10);
      if ([1, 2, 3].includes(tierNum)) {
        setSelectedTier(tierNum);
      }
    }

    if (themeParam) {
      themeIdToKeep.current = themeParam;
    }
  }, [searchParams]);

  // ── DERIVED ────────────────────────────────────────────────
  const filteredThemes = useMemo(() => {
    let result = dbThemes
      .filter(t => !selectedTier || (t.tiers && t.tiers[`tier${selectedTier}`]?.isActive))
      .filter(t => !themeSearchFilter || t.name.toLowerCase().includes(themeSearchFilter.toLowerCase()))
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

        const basePrice = Math.round((1120) + (mappedFlavors[0]?.price || 0) + (t.tiers?.tier1?.price || 0));

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
  }, [dbThemes, selectedTier, themeSearchFilter, priceSortFilter]);

  const theme = themeIdx !== null ? filteredThemes[themeIdx] : null;
  const weight = WEIGHTS[weightIdx];
  const currentTier = getTierById(selectedTier || 1);

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

      toast.success('🎂 Dream cake added to cart!');
      setTimeout(() => navigate('/cart'), 800);
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
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((num) => {
            const tier = getTierById(num);
            return (
              <button
                key={num}
                onClick={() => setSelectedTier(selectedTier === num ? null : num)}
                className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${selectedTier === num
                    ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                    : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                  }`}
              >
                {tier?.shortName || `Tier ${num}`}
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by theme name..."
            value={themeSearchFilter}
            onChange={(e) => setThemeSearchFilter(e.target.value)}
            className="w-full bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
          />
        </div>
      </SectionCard>

      {/* Sort */}
      <SectionCard
        title="Sort By"
        expanded={expandedSections.sort}
        onToggle={() => toggleSection('sort')}
      >
        <select
          value={priceSortFilter}
          onChange={(e) => setPriceSortFilter(e.target.value)}
          className="w-full bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-lg p-2.5 text-[12px] font-bold outline-none cursor-pointer"
        >
          <option value="">Default</option>
          <option value="asc">Price: Low → High</option>
          <option value="desc">Price: High → Low</option>
        </select>
      </SectionCard>

      {/* Reset */}
      <button
        onClick={() => {
          setSelectedTier(null);
          setThemeSearchFilter('');
          setPriceSortFilter('');
        }}
        className="w-full py-3 border border-dashed border-[var(--heading)]/20 rounded-lg text-[12px] font-bold text-[var(--heading)]/80 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">

      {/* ── BREADCRUMB ── */}
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

      {/* ── MAIN ── */}
      <main className="responsive-container py-6 pb-40 lg:pb-8 tv:py-10">
        {themeIdx === null ? (
          <>
            {/* Browse Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--heading)]">
                Choose Your Theme
                <span className="ml-2 text-sm font-medium text-[var(--muted)] flex-shrink-0">
                  ({filteredThemes.length} designs)
                </span>
              </h2>
            </div>

            {/* Render browse grid */}
            <CustomCakeBrowse
              filteredThemes={filteredThemes}
              loading={loading}
              selectedTier={selectedTier}
              setSelectedTier={setSelectedTier}
              themeSearchFilter={themeSearchFilter}
              setThemeSearchFilter={setThemeSearchFilter}
              priceSortFilter={priceSortFilter}
              setPriceSortFilter={setPriceSortFilter}
              selectTheme={selectTheme}
              hideFilters={true}
              onToggleFilter={() => setIsFilterOpen(true)}
              onToggleDesktopFilter={() => setIsDesktopFilterOpen(true)}
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28 }}
                    className="fixed right-0 top-0 bottom-0 w-full sm:w-[85%] max-w-sm bg-[var(--card)] z-[210] p-5 overflow-y-auto shadow-2xl border-l border-[var(--border)]"
                  >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                      <h2 className="text-lg font-bold text-[var(--heading)]">Filters</h2>
                      <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <FilterPanel />
                    <button onClick={() => setIsFilterOpen(false)}
                      className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md">
                      Show Results
                    </button>
                  </motion.div>
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