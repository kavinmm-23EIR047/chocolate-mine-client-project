import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import { Percent, CheckCircle2, Tag, Sparkles } from 'lucide-react';

const ProductPricing = ({
  product,
  currentPrice,
  finalPrice,
  offerDiscount,
  totalSavingsPct,
  couponSavings,
  isCouponApplied,
  applyingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  addonSum = 0,
  selectedFlavor = null
}) => {
  const BENTO_FLAVOR_PRICES = {'White Forest':380,'Butterscotch':390,'Rose Milk':410,'Honey & Almond':410,'Black Forest':380,'Choco Fudge':390,'Choco Truffle':410,'Choco Oreo':410,'Choco Caramel':420,'Death by Chocolate':450,'Red Velvet':470,'Lotus Biscoff':480,'Choco Pistachio':480};
  const flavorPrice = Number(selectedFlavor?.price || (selectedFlavor?.name ? BENTO_FLAVOR_PRICES[selectedFlavor.name] || 0 : 0));
  const productBaseOnly = (finalPrice - addonSum) - flavorPrice;
  
  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <span className="text-3xl sm:text-4xl font-black text-heading tracking-tighter">{formatCurrency(finalPrice)}</span>
          {currentPrice > finalPrice && (
            <span className="text-lg sm:text-xl line-through text-muted/40 font-black tracking-tighter">{formatCurrency(currentPrice)}</span>
          )}
          {totalSavingsPct > 0 && (
            <span className="text-sm sm:text-base font-black text-success-text bg-success-light px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg uppercase tracking-wide border border-success/10">
              {totalSavingsPct}% off
            </span>
          )}
        </div>

        <div className="bg-muted/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3 text-sm font-bold border border-border/20">
          <div className="flex justify-between text-muted/60 uppercase text-[11px] sm:text-xs tracking-widest gap-2">
            <span>Product Base Price</span>
            <span className="text-right">{formatCurrency(productBaseOnly > 0 ? productBaseOnly : (finalPrice - addonSum))}</span>
          </div>
          {flavorPrice > 0 && (
            <div className="flex justify-between text-primary uppercase text-[11px] sm:text-xs tracking-widest gap-2">
              <span>Flavor: {selectedFlavor?.name}</span>
              <span className="text-right">+ {formatCurrency(flavorPrice)}</span>
            </div>
          )}
          {addonSum > 0 && (
            <div className="flex justify-between text-primary uppercase text-[11px] sm:text-xs tracking-widest gap-2">
              <span>Add-ons Total</span>
              <span className="text-right">+ {formatCurrency(addonSum)}</span>
            </div>
          )}
          {offerDiscount > 0 && (
            <div className="flex justify-between text-success-text uppercase text-[11px] sm:text-xs tracking-widest gap-2">
              <span>Offer Savings</span>
              <span className="text-right">- {formatCurrency(offerDiscount)}</span>
            </div>
          )}
          {couponSavings > 0 && (
            <div className="flex justify-between text-success-text uppercase text-[11px] sm:text-xs tracking-widest gap-2">
              <span>Coupon Discount ({product?.coupon?.code})</span>
              <span className="text-right">- {formatCurrency(couponSavings)}</span>
            </div>
          )}
          <div className="border-t border-border/30 pt-3 flex items-center justify-between font-black text-heading text-base sm:text-lg tracking-tight">
            <span className="uppercase text-[11px] sm:text-xs tracking-widest text-muted">Final Total Price</span>
            <span>{formatCurrency(finalPrice)}</span>
          </div>
        </div>
      </div>

      {/* CHANGED: Now checks if a coupon code actually exists instead of an 'enabled' flag */}
      {product?.coupon && product?.coupon?.code && (
        <div className="bg-card rounded-3xl sm:rounded-[2.5rem] border p-5 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden group/coupon mt-6">
          <div className="absolute -top-4 -right-4 p-2 opacity-[0.03] rotate-12 transition-transform group-hover/coupon:rotate-45 duration-700">
            <Percent size={120} />
          </div>
          <p className="text-xs font-black text-muted uppercase tracking-widest mb-3 sm:mb-4">
            {isCouponApplied ? 'Coupon applied to your order' : 'Available Exclusive Offer'}
          </p>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-coupon/10 border border-coupon/20 border-dashed rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 ${isCouponApplied ? 'border-success/30 bg-success-light/40' : ''}`}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="bg-card p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-soft border border-border/50 flex-shrink-0">
                {isCouponApplied ? (
                  <CheckCircle2 size={20} className="text-success" />
                ) : (
                  <Tag size={20} className="text-coupon" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-heading text-base sm:text-lg font-mono tracking-widest truncate">{product.coupon.code}</p>
                {isCouponApplied ? (
                  <p className="text-[11px] sm:text-xs font-black text-success-text uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Sparkles size={12} className="text-success flex-shrink-0" />
                    <span className="truncate">Applied — savings reflected</span>
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs font-black text-coupon uppercase tracking-wider opacity-80 mt-1 truncate">
                    {product.coupon.type === 'percent'
                      ? `${product.coupon.value}% Instant OFF`
                      : product.coupon.type === 'price'
                        ? `Special price ₹${product.coupon.value}`
                        : `Flat ₹${product.coupon.value} OFF`}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={applyingCoupon}
              onClick={isCouponApplied ? handleRemoveCoupon : handleApplyCoupon}
              className={`text-[11px] sm:text-xs w-full sm:w-auto font-black px-5 py-3 rounded-xl transition-all uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:pointer-events-none shrink-0 ${isCouponApplied ? 'bg-card text-error border border-error/20 hover:bg-error-light' : 'bg-primary text-button-text hover:bg-primary-hover shadow-primary/20'}`}
            >
              {applyingCoupon ? '…' : isCouponApplied ? 'Remove' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPricing;