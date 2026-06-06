import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Upload, X, Star, Award, CheckCircle, Plus, Trash2, Image, Settings, Package } from 'lucide-react';
import productService from '../../services/productService';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

// Default flavors for cakes
const DEFAULT_FLAVORS = [
  'Vanilla', 'Chocolate', 'Butterscotch', 'Black Forest', 'Red Velvet', 'Strawberry', 'Pineapple'
];

// Default weight options
const DEFAULT_WEIGHTS = ['0.5 kg', '1 kg', '1.5 kg', '2 kg', '3 kg'];

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    offerPrice: '',
    category: '',
    cakeType: '',
    location: 'coimbatore',
    occasion: [],
    stock: true, // Changed to boolean (true = in stock, false = out of stock)
    featured: false,
    bestseller: false,
    isActive: true,
    hasVariants: false,
    allowCustomFlavor: false,
    allowCustomWeight: false,
    coupon: {
      enabled: false,
      code: '',
      type: 'percent',
      value: 0
    }
  });

  // New variant system state
  const [flavors, setFlavors] = useState([]);
  const [weights, setWeights] = useState([]);
  const [variants, setVariants] = useState([]);
  const [weightPrices, setWeightPrices] = useState([]);
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [isCustomFlavor, setIsCustomFlavor] = useState(false);
  const [customFlavorName, setCustomFlavorName] = useState('');
  const [selectedDefaultFlavor, setSelectedDefaultFlavor] = useState('');
  const [isCustomWeight, setIsCustomWeight] = useState(false);
  const [customWeightValue, setCustomWeightValue] = useState('');
  const [selectedDefaultWeight, setSelectedDefaultWeight] = useState('');
  
  const [basePrice, setBasePrice] = useState('');
  
  const blobUrlsRef = useRef([]);

  // Fetch categories and occasions on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, occRes] = await Promise.all([
          adminService.getCategories(),
          adminService.getOccasions()
        ]);
        setCategories(catRes.data.data || []);
        setOccasions(occRes.data.data || []);
      } catch {
        // silently fail
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const res = await productService.getBySlug(id);
          const p = res.data.data;
          setFormData({
            name: p.name,
            description: p.description,
            shortDescription: p.shortDescription || '',
            price: p.price || '',
            offerPrice: p.offerPrice || '',
            category: p.category ? p.category.toLowerCase() : '',
            cakeType: p.cakeType || '',
            location: p.location || 'coimbatore',
            occasion: Array.isArray(p.occasion) ? p.occasion : (p.occasion ? [p.occasion] : []),
            stock: p.stock === true || p.stock === 'true' || p.stock > 0, // Convert to boolean
            featured: p.featured || false,
            bestseller: p.bestseller || false,
            isActive: p.isActive !== false,
            hasVariants: p.hasVariants || false,
            allowCustomFlavor: p.allowCustomFlavor || false,
            allowCustomWeight: p.allowCustomWeight || false,
            coupon: {
              enabled: p.coupon?.enabled || false,
              code: p.coupon?.code || '',
              type: p.coupon?.type || 'percent',
              value: p.coupon?.value || 0
            }
          });
          setPreview(p.image);
          if ((p.category || '').toLowerCase() === 'cakes') {
            setFlavors(p.flavors || []);
            setWeights(p.weights || []);
            setVariants(p.variants || []);
            setWeightPrices(p.weightPrices || []);
            if (p.weightPrices && p.weightPrices.length > 0) {
              const base = p.weightPrices[0];
              setBasePrice(base.price || '');
            }
          }
        } catch (err) {
          toast.error('Failed to load product');
          navigate('/admin/products');
        } finally {
          setFetching(false);
        }
      };
      fetchProduct();
    }
    return () => {};
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOccasionToggle = (value) => {
    setFormData(prev => {
      const current = prev.occasion || [];
      const updated = current.includes(value)
        ? current.filter(o => o !== value)
        : [...current, value];
      return { ...prev, occasion: updated };
    });
  };

  // Flavor management with multiple images
  const addFlavor = () => {
    let flavorName = '';
    if (isCustomFlavor && customFlavorName.trim()) {
      flavorName = customFlavorName.trim();
    } else if (!isCustomFlavor && selectedDefaultFlavor) {
      flavorName = selectedDefaultFlavor;
    }
    
    if (!flavorName) {
      toast.error('Please select or enter a flavor name');
      return;
    }
    
    if (flavors.some(f => f.name === flavorName)) {
      toast.error('Flavor already exists');
      return;
    }
    
    setFlavors([...flavors, { name: flavorName, images: [] }]);
    setSelectedDefaultFlavor('');
    setCustomFlavorName('');
    setIsCustomFlavor(false);
  };
  
  const removeFlavor = (index) => {
    const flavorName = flavors[index]?.name;
    setFlavors(flavors.filter((_, i) => i !== index));
    if (flavorName) {
      setVariants(variants.filter(v => v.flavor !== flavorName));
    }
  };
  
  // Flavor image management
  const handleFlavorImageUpload = (flavorIndex, e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlavors(prevFlavors => {
          const updated = [...prevFlavors];
          if (!updated[flavorIndex].images) {
            updated[flavorIndex].images = [];
          }
          updated[flavorIndex].images.push(reader.result);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeFlavorImage = (flavorIndex, imageIndex) => {
    setFlavors(prevFlavors => {
      const updated = [...prevFlavors];
      updated[flavorIndex].images.splice(imageIndex, 1);
      return updated;
    });
  };
  
  // Weight management
  const addWeight = () => {
    let weightValue = '';
    if (isCustomWeight && customWeightValue.trim()) {
      weightValue = customWeightValue.trim();
    } else if (!isCustomWeight && selectedDefaultWeight) {
      weightValue = selectedDefaultWeight;
    }
    
    if (!weightValue) {
      toast.error('Please select or enter a weight');
      return;
    }
    
    if (weights.some(w => w.value === weightValue)) {
      toast.error('Weight already exists');
      return;
    }
    
    setWeights([...weights, { value: weightValue }]);
    setSelectedDefaultWeight('');
    setCustomWeightValue('');
    setIsCustomWeight(false);
  };
  
  const removeWeight = (index) => {
    const weightValue = weights[index]?.value;
    setWeights(weights.filter((_, i) => i !== index));
    if (weightValue) {
      setVariants(variants.filter(v => v.weight !== weightValue));
    }
  };
  
  // Variant management
  const addVariant = () => {
    setVariants([...variants, { flavor: '', weight: '', price: '', stock: 0 }]);
  };
  
  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };
  
  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  const generateVariantsFromCombinations = () => {
    if (flavors.length === 0 || weights.length === 0) {
      toast.error('Please add at least one flavor and one weight first');
      return;
    }
    
    const newVariants = [];
    flavors.forEach(flavor => {
      weights.forEach(weight => {
        newVariants.push({
          flavor: flavor.name,
          weight: weight.value,
          price: '',
          stock: 0
        });
      });
    });
    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variants`);
  };

  // Compute weight prices based on cakeType and basePrice
  const computeWeightPrices = (type, base) => {
    const b = Number(base) || 0;
    if ((type || '').toLowerCase() === 'bento-cakes') {
      return [
        { weight: '0.25', price: Math.round(b) },
        { weight: '0.5', price: Math.round(b * 2) }
      ];
    }
    return [
      { weight: '0.5', price: Math.round(b) },
      { weight: '1', price: Math.round(b * 2) },
      { weight: '1.5', price: Math.round(b * 3) },
      { weight: '2', price: Math.round(b * 4) },
      { weight: '3', price: Math.round(b * 6) }
    ];
  };

  // When basePrice or cakeType changes, regenerate weights and variants
  useEffect(() => {
    if (!basePrice) return;
    const wp = computeWeightPrices(formData.cakeType, basePrice);
    setWeightPrices(wp);
    setWeights(wp.map(w => ({ value: `${w.weight} kg` })));

    // Auto-generate variants with these prices
    const generatedVariants = [];
    const flavorList = flavors.length > 0 ? flavors : [{ name: '' }];
    flavorList.forEach(fl => {
      wp.forEach(w => {
        generatedVariants.push({ flavor: fl.name, weight: `${w.weight} kg`, price: w.price, stock: 0 });
      });
    });
    setVariants(generatedVariants);
    setFormData(prev => ({ ...prev, hasVariants: generatedVariants.length > 0 }));
  }, [basePrice, formData.cakeType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      
      // Add all form data
      Object.keys(formData).forEach(key => {
        if (key === 'coupon') {
          Object.keys(formData.coupon).forEach(subKey => {
            data.append(`coupon.${subKey}`, formData.coupon[subKey]);
          });
        } else if (key === 'occasion') {
          data.append('occasion', JSON.stringify(formData.occasion));
        } else if (key === 'stock') {
          // Send stock as boolean
          data.append('stock', formData.stock ? 'true' : 'false');
        } else if (key === 'hasVariants' || key === 'allowCustomFlavor' || key === 'allowCustomWeight') {
          // Skip these boolean fields here - they will be handled in cake section
          return;
        } else {
          data.append(key, formData[key]);
        }
      });
      
      // Add variant data for cake category
      if ((formData.category || '').toLowerCase() === 'cakes') {
        // Prepare flavors with images array
        const flavorsForSubmit = flavors.map(flavor => ({
          name: flavor.name,
          images: flavor.images || []
        }));
        data.append('flavors', JSON.stringify(flavorsForSubmit));
        data.append('weights', JSON.stringify(weights));
        const variantsForSubmit = variants.map(v => ({
          ...v,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0
        }));
        data.append('variants', JSON.stringify(variantsForSubmit));

        // Append cakeType, basePrice and weightPrices for server-side storage/generation
        if (formData.cakeType) data.append('cakeType', formData.cakeType);
        if (basePrice !== undefined && basePrice !== null && basePrice !== '') data.append('basePrice', basePrice);
        if (weightPrices && weightPrices.length > 0) data.append('weightPrices', JSON.stringify(weightPrices));
        
        // Use set() instead of append() to prevent duplicate boolean values
        data.set('hasVariants', variants.length > 0 ? 'true' : 'false');
        data.set('allowCustomFlavor', formData.allowCustomFlavor ? 'true' : 'false');
        data.set('allowCustomWeight', formData.allowCustomWeight ? 'true' : 'false');
      } else {
        // For non-cake products, ensure these are set as false
        data.set('hasVariants', 'false');
        data.set('allowCustomFlavor', 'false');
        data.set('allowCustomWeight', 'false');
      }
      
      if (image) data.append('image', image);

      if (isEdit) {
        await productService.update(id, data);
        toast.success('Product updated');
      } else {
        await productService.create(data);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="py-20 text-center font-bold">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="p-2 hover:bg-border rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-black text-heading">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Main Info */}
          <div className="space-y-6">
            <div className="card-premium p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Product Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                    placeholder="e.g. Belgian Truffle Cake"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Category</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={(e) => {
                      const raw = e.target.value || '';
                      const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : raw;
                      setFormData(prev => ({ ...prev, category: normalized }));
                      if (normalized !== 'cakes') {
                        setFlavors([]);
                        setWeights([]);
                        setVariants([]);
                      }
                    }} 
                    required 
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.length > 0
                      ? categories.map(c => <option key={c._id} value={(c.name || '').toLowerCase()}>{c.label || c.name}</option>)
                      : <option disabled>Loading categories...</option>
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest">Short Description</label>
                <input 
                  name="shortDescription" 
                  value={formData.shortDescription} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                  placeholder="One line catchy summary..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest">Full Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4}
                  required
                  className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-medium"
                  placeholder="Tell the story of this treat..."
                />
              </div>

              {/* Regular price fields (for non-cake or simple products) */}
              {(formData.category || '').toLowerCase() !== 'cakes' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted uppercase tracking-widest">Original Price (₹)</label>
                    <input 
                      name="price" 
                      type="number" 
                      value={formData.price} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted uppercase tracking-widest">Offer Price (Optional)</label>
                    <input 
                      name="offerPrice" 
                      type="number" 
                      value={formData.offerPrice} 
                      onChange={handleChange} 
                      className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Delivery Location</label>
                  <select 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold capitalize"
                  >
                    <option value="coimbatore">Coimbatore Only</option>
                    <option value="pan-india">Pan India Only</option>
                    <option value="both">Both (Everywhere)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-muted uppercase tracking-widest">Occasions (Multiple)</label>
                  <div className="flex flex-wrap gap-2">
                    {occasions.length > 0
                      ? occasions.map(o => (
                          <button
                            key={o._id}
                            type="button"
                            onClick={() => handleOccasionToggle(o.name)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${
                              formData.occasion.includes(o.name)
                                ? 'bg-primary border-primary text-button-text shadow-lift'
                                : 'bg-input border-input-border text-muted hover:border-primary/50'
                            }`}
                          >
                            {o.label || o.name}
                          </button>
                        ))
                      : <p className="text-xs text-muted italic">No occasions found.</p>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Cake-specific Variant Section with Multiple Images */}
            {(formData.category || '').toLowerCase() === 'cakes' && (
              <div className="card-premium p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-black text-heading uppercase tracking-widest text-sm">
                    Cake Variants (Flavors & Weights)
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-black">
                      <input
                        type="checkbox"
                        name="allowCustomFlavor"
                        checked={formData.allowCustomFlavor}
                        onChange={handleChange}
                        className="rounded"
                      />
                      Allow Custom Flavor
                    </label>
                    <label className="flex items-center gap-2 text-xs font-black">
                      <input
                        type="checkbox"
                        name="allowCustomWeight"
                        checked={formData.allowCustomWeight}
                        onChange={handleChange}
                        className="rounded"
                      />
                      Allow Custom Weight
                    </label>
                  </div>
                </div>

                {/* Cake Type and Base Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted uppercase tracking-widest">Cake Type</label>
                    <select
                      name="cakeType"
                      value={formData.cakeType}
                      onChange={(e) => {
                        const val = (e.target.value || '').toLowerCase();
                        setFormData(prev => ({ ...prev, cakeType: val }));
                      }}
                      className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                    >
                      <option value="">Select Type</option>
                      <option value="bento-cakes">Bento Cakes</option>
                      <option value="vanilla-cakes">Vanilla Cakes</option>
                      <option value="chocolate-cakes">Chocolate Cakes</option>
                      <option value="red-velvet-cakes">Red Velvet Cakes</option>
                      <option value="tcm-special">TCM Special</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted uppercase tracking-widest">Base Price</label>
                    <input
                      name="basePrice"
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder={formData.cakeType === 'bento-cakes' ? 'Quarter KG Price (₹)' : 'Half KG Price (₹)'}
                      className="w-full bg-input border border-input-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-secondary outline-none font-bold"
                    />
                    <p className="text-[10px] text-muted">Enter base price for {formData.cakeType === 'bento-cakes' ? '0.25 kg' : '0.5 kg'}. Other weights will be calculated automatically.</p>
                  </div>
                </div>
                
                {/* Flavors Section with Multiple Images */}
                <div className="border rounded-2xl p-4 space-y-4">
                  <h4 className="font-black text-sm">Flavors</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {flavors.map((flavor, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold">
                        {flavor.name}
                        <button type="button" onClick={() => removeFlavor(idx)} className="hover:text-error">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomFlavor(!isCustomFlavor)}
                      className="text-xs font-black text-primary"
                    >
                      {isCustomFlavor ? 'Use Default' : '+ Custom Flavor'}
                    </button>
                  </div>
                  
                  {!isCustomFlavor ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedDefaultFlavor}
                        onChange={(e) => setSelectedDefaultFlavor(e.target.value)}
                        className="flex-1 bg-input border border-input-border px-3 py-2 rounded-xl text-sm"
                      >
                        <option value="">Select flavor</option>
                        {DEFAULT_FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <Button type="button" onClick={addFlavor} icon={Plus} size="sm">Add</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFlavorName}
                        onChange={(e) => setCustomFlavorName(e.target.value)}
                        placeholder="Custom flavor name"
                        className="flex-1 bg-input border border-input-border px-3 py-2 rounded-xl text-sm"
                      />
                      <Button type="button" onClick={addFlavor} icon={Plus} size="sm">Add</Button>
                    </div>
                  )}
                  
                  {/* Flavor Images Section */}
                  {flavors.map((flavor, flavorIdx) => (
                    <div key={flavorIdx} className="mt-4 p-3 bg-border/10 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-black text-muted uppercase tracking-widest">
                          {flavor.name} Images
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {flavor.images && flavor.images.length > 0 ? (
                          flavor.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border group/img">
                              <img 
                                src={img} 
                                alt={`${flavor.name} ${imgIdx + 1}`} 
                                className="w-full h-full object-cover" 
                              />
                              <button
                                type="button"
                                onClick={() => removeFlavorImage(flavorIdx, imgIdx)}
                                className="absolute top-1 right-1 p-1 bg-error text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))
                        ) : null}
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <Image size={20} className="text-muted" />
                          <span className="text-[8px] text-muted mt-1">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFlavorImageUpload(flavorIdx, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Weights Section */}
                <div className="border rounded-2xl p-4 space-y-4">
                  <h4 className="font-black text-sm">Weights</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {weights.map((weight, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold">
                        {weight.value}
                        <button type="button" onClick={() => removeWeight(idx)} className="hover:text-error">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomWeight(!isCustomWeight)}
                      className="text-xs font-black text-primary"
                    >
                      {isCustomWeight ? 'Use Default' : '+ Custom Weight'}
                    </button>
                  </div>
                  
                  {!isCustomWeight ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedDefaultWeight}
                        onChange={(e) => setSelectedDefaultWeight(e.target.value)}
                        className="flex-1 bg-input border border-input-border px-3 py-2 rounded-xl text-sm"
                      >
                        <option value="">Select weight</option>
                        {DEFAULT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <Button type="button" onClick={addWeight} icon={Plus} size="sm">Add</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customWeightValue}
                        onChange={(e) => setCustomWeightValue(e.target.value)}
                        placeholder="e.g., 2.5 kg"
                        className="flex-1 bg-input border border-input-border px-3 py-2 rounded-xl text-sm"
                      />
                      <Button type="button" onClick={addWeight} icon={Plus} size="sm">Add</Button>
                    </div>
                  )}
                </div>
                
                {/* Variants Table */}
                {(flavors.length > 0 || weights.length > 0) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm">Price Table (Flavor × Weight)</h4>
                      <div className="flex gap-2">
                        <Button type="button" onClick={generateVariantsFromCombinations} size="sm" variant="secondary">
                          Generate All Combinations
                        </Button>
                        <Button type="button" onClick={addVariant} icon={Plus} size="sm">Add Row</Button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-border/20">
                            <th className="p-2 text-left text-xs font-black">Flavor</th>
                            <th className="p-2 text-left text-xs font-black">Weight</th>
                            <th className="p-2 text-left text-xs font-black">Price (₹)</th>
                            <th className="p-2 text-left text-xs font-black">Stock</th>
                            <th className="p-2 text-left text-xs font-black">Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                          {variants.length > 0 ? (
                            variants.map((variant, idx) => (
                              <tr key={idx} className="border-b border-border">
                                <td className="p-2">
                                  <select
                                    value={variant.flavor}
                                    onChange={(e) => updateVariant(idx, 'flavor', e.target.value)}
                                    className="w-full bg-input border border-input-border px-2 py-1 rounded-lg text-sm"
                                  >
                                    <option value="">Select</option>
                                    {flavors.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                  </select>
                                 </td>
                                <td className="p-2">
                                  <select
                                    value={variant.weight}
                                    onChange={(e) => updateVariant(idx, 'weight', e.target.value)}
                                    className="w-full bg-input border border-input-border px-2 py-1 rounded-lg text-sm"
                                  >
                                    <option value="">Select</option>
                                    {weights.map(w => <option key={w.value} value={w.value}>{w.value}</option>)}
                                  </select>
                                 </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                                    placeholder="Price"
                                    className="w-28 bg-input border border-input-border px-2 py-1 rounded-lg text-sm"
                                  />
                                 </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)}
                                    className="w-20 bg-input border border-input-border px-2 py-1 rounded-lg text-sm"
                                  />
                                 </td>
                                <td className="p-2">
                                  <button type="button" onClick={() => removeVariant(idx)} className="text-error">
                                    <Trash2 size={16} />
                                  </button>
                                 </td>
                               </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-8 text-muted text-sm">
                                No variants defined. Add flavors and weights, then click "Generate All Combinations" or "Add Row" manually.
                               </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card-premium p-6 space-y-6">
              <h3 className="font-black text-heading uppercase tracking-widest text-sm border-b border-border pb-4">Inventory & Promotions</h3>
              
              {/* Stock Management - Simple Boolean */}
              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-widest">Stock Status</label>
                <label className="flex items-center gap-3 p-3 bg-input border border-input-border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    name="stock"
                    checked={formData.stock === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.checked }))}
                    className="w-5 h-5 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <div className="flex items-center gap-2">
                    <Package size={16} className={formData.stock ? 'text-success' : 'text-error'} />
                    <span className="text-sm font-bold text-heading">
                      {formData.stock ? '✓ In Stock' : '✗ Out of Stock'}
                    </span>
                  </div>
                </label>
                <p className="text-[10px] text-muted">
                  {formData.stock 
                    ? 'Product is available for purchase' 
                    : 'Product is currently out of stock'}
                </p>
              </div>

              {/* Coupon Section */}
              <div className="border-t border-border pt-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-border/20 rounded-xl">
                  <input 
                    type="checkbox" 
                    name="coupon.enabled" 
                    checked={formData.coupon.enabled} 
                    onChange={handleChange} 
                    className="w-5 h-5 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <span className="text-xs font-black text-heading uppercase tracking-widest">Enable Coupon</span>
                </label>

                {formData.coupon.enabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-border"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Code</label>
                      <input 
                        name="coupon.code" 
                        value={formData.coupon.code} 
                        onChange={handleChange} 
                        className="w-full bg-input border border-input-border px-3 py-2 rounded-lg outline-none font-bold text-sm"
                        placeholder="SAVE10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Type</label>
                      <select 
                        name="coupon.type" 
                        value={formData.coupon.type} 
                        onChange={handleChange} 
                        className="w-full bg-input border border-input-border px-3 py-2 rounded-lg outline-none font-bold text-sm"
                      >
                        <option value="percent">Percent (%)</option>
                        <option value="flat">Flat (₹)</option>
                        <option value="price">Fixed Price</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Value</label>
                      <input 
                        name="coupon.value" 
                        type="number"
                        value={formData.coupon.value} 
                        onChange={handleChange} 
                        className="w-full bg-input border border-input-border px-3 py-2 rounded-lg outline-none font-bold text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-premium p-6 space-y-6">
              <label className="text-xs font-black text-muted uppercase tracking-widest block">Product Image</label>
              <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-border bg-input flex flex-col items-center justify-center gap-4 transition-all hover:border-secondary">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setPreview(''); setImage(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-lg shadow-xl hover:scale-110 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-muted" />
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest text-center px-4">Upload High Res JPG/PNG</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="card-premium p-6 space-y-6">
              <h3 className="font-black text-heading uppercase tracking-widest text-sm border-b border-border pb-4">Badges</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Star size={16} className={formData.featured ? 'text-yellow-500 fill-current' : 'text-muted'} />
                    Featured
                  </span>
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="w-5 h-5 rounded border-border text-secondary focus:ring-secondary" />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Award size={16} className={formData.bestseller ? 'text-orange-500' : 'text-muted'} />
                    Bestseller
                  </span>
                  <input type="checkbox" name="bestseller" checked={formData.bestseller} onChange={handleChange} className="w-5 h-5 rounded border-border text-secondary focus:ring-secondary" />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle size={16} className={formData.isActive ? 'text-success' : 'text-muted'} />
                    Visible
                  </span>
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 rounded border-border text-secondary focus:ring-secondary" />
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 rounded-2xl shadow-xl" 
              loading={loading}
              icon={Save}
            >
              {isEdit ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;