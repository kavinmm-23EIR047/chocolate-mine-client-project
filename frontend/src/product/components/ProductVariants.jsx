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
  const isCake = product?.category?.toLowerCase().includes('cake');
  if (!isCake) return null;

  const isBento = product?.category?.toLowerCase().includes('bento') || product?.cakeType?.toLowerCase().includes('bento');
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
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {product.flavors?.map((flavor, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFlavorChange(flavor)}
                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${selectedFlavor?.name === flavor.name
                      ? 'bg-primary text-button-text shadow-lg scale-105'
                      : 'bg-muted/10 text-heading border-2 border-border hover:border-primary/50'
                      }`}
                  >
                    {flavor.name}
                  </button>
                ))}
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