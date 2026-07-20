import React from 'react';
import { Cake, Scale } from 'lucide-react';

const ProductVariants = ({
  product,
  selectedFlavor,
  handleFlavorChange,
  showCustomFlavorInput,
  setShowCustomFlavorInput,
  customFlavor,
  setCustomFlavor,
  handleCustomFlavorSubmit,
  selectedWeight,
  handleWeightChange,
  showCustomWeightInput,
  setShowCustomWeightInput,
  customWeight,
  setCustomWeight,
  handleCustomWeightSubmit,
  isInStock
}) => {
  const isCake = Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('cake')) : (product?.category || '').toLowerCase().includes('cake');
  const hasVariants = product?.hasVariants || false;

  const isBento = (Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('bento')) : (product?.category || '').toLowerCase().includes('bento')) || product?.cakeType?.toLowerCase().includes('bento');
  const weights = isBento
    ? [{ value: '250g' }]
    : [
        { value: '500g' },
        { value: '1kg' },
        { value: '1.5kg' },
        { value: '2kg' },
        { value: '2.5kg' },
        { value: '3kg' }
      ];

  return (
    <div className="space-y-6 mb-6">
      {product.flavors && product.flavors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cake size={16} className="text-primary" />
            <label className="text-xs font-black text-muted uppercase tracking-widest">Select Flavor</label>
          </div>

          {!showCustomFlavorInput ? (
            <>
              <div className="relative">
                <select
                  value={selectedFlavor?.name || ''}
                  onChange={(e) => {
                    const flavor = product.flavors.find(f => f.name === e.target.value);
                    if (flavor) handleFlavorChange(flavor);
                  }}
                  className="w-full appearance-none bg-card border-2 border-border text-heading px-4 py-3 pr-10 rounded-xl text-sm font-bold uppercase tracking-wide cursor-pointer outline-none focus:border-primary transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" disabled>Choose a flavor</option>
                  {product.flavors.map((flavor, idx) => (
                    <option key={idx} value={flavor.name}>
                      {flavor.name} (+₹{flavor.price || ({'White Forest':380,'Butterscotch':390,'Rose Milk':410,'Honey & Almond':410,'Black Forest':380,'Choco Fudge':390,'Choco Truffle':410,'Choco Oreo':410,'Choco Caramel':420,'Death by Chocolate':450,'Red Velvet':470,'Lotus Biscoff':480,'Choco Pistachio':480}[flavor.name] || 0)})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {product.allowCustomFlavor && (
                <button
                  onClick={() => setShowCustomFlavorInput(true)}
                  className="text-xs text-primary font-black underline mt-1"
                >
                  + Add Custom Flavor
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customFlavor}
                onChange={(e) => setCustomFlavor(e.target.value)}
                placeholder="Enter custom flavor"
                className="flex-1 w-full bg-input border border-input-border px-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCustomFlavorSubmit}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-button-text rounded-xl text-xs font-black"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCustomFlavorInput(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-card-soft text-heading rounded-xl text-xs font-black border border-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-primary" />
          <label className="text-xs font-black text-muted uppercase tracking-widest">Select Weight</label>
        </div>

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {weights.map((weight, idx) => (
            <button
              key={idx}
              onClick={() => handleWeightChange(weight.value)}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${selectedWeight === weight.value
                ? 'bg-primary text-button-text shadow-lg scale-105'
                : 'bg-muted/10 text-heading border-2 border-border hover:border-primary/50'
                }`}
            >
              {weight.value}
            </button>
          ))}
        </div>
      </div>

      {!isInStock && (
        <div className="text-center py-3 bg-error-light text-error-text border border-error/10 rounded-xl text-xs font-black uppercase tracking-widest">
          Out of Stock for this combination
        </div>
      )}
    </div>
  );
};

export default ProductVariants;