import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateCartQty, setCoupon } from "../redux/slices/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  ChevronRight,
  ChevronDown,
  Truck,
  Shield,
} from "lucide-react";

import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { formatCurrency, getCouponUnitDiscount, normalizeCartCoupon } from "../utils/helpers";
import toast from "react-hot-toast";

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);

  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(true);

  // ==================== PRICE CALCULATION LOGIC ====================
  /** Cake variants: backend sends variantPrice as the effective sale unit price before coupon */
  const getItemBasePrice = (item) => {
    const vp = item.variantPrice != null ? Number(item.variantPrice) : NaN;
    if (!Number.isNaN(vp) && vp > 0) return vp;

    const hasOfferPrice =
      item.offerPrice !== undefined &&
      item.offerPrice !== null &&
      Number(item.offerPrice) > 0 &&
      Number(item.offerPrice) < Number(item.price);

    return hasOfferPrice ? Number(item.offerPrice) : Number(item.price);
  };

  const getItemMrp = (item) => Number(item.price ?? 0);

  const getItemCouponDiscount = (item) => {
    const applied = normalizeCartCoupon(appliedCoupon);
    if (!applied || !item.coupon?.enabled) return 0;

    if (applied !== normalizeCartCoupon(item.coupon.code)) return 0;

    const basePrice = getItemBasePrice(item);
    return getCouponUnitDiscount(basePrice, item.coupon);
  };

  const getFinalItemPrice = (item) => {
    const basePrice = getItemBasePrice(item);
    const couponDiscount = getItemCouponDiscount(item);
    return basePrice - couponDiscount;
  };

  // ==================== CART CALCULATIONS (bag only — no delivery/taxes) ====================

  const appliedCouponDisplay = normalizeCartCoupon(appliedCoupon);
  const hasAppliedCoupon = appliedCouponDisplay !== "";

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getFinalItemPrice(item) * item.qty,
    0
  );

  const originalTotal = cartItems.reduce(
    (sum, item) => sum + getItemMrp(item) * item.qty,
    0
  );

  const offerDiscount = cartItems.reduce((sum, item) => {
    const mrp = getItemMrp(item);
    const base = getItemBasePrice(item);
    return sum + Math.max(0, mrp - base) * item.qty;
  }, 0);

  const couponDiscount = cartItems.reduce((sum, item) => {
    return sum + getItemCouponDiscount(item) * item.qty;
  }, 0);

  const hasApplicableCoupons = cartItems.some((item) => item.coupon?.enabled);

  const handleApplyCoupon = async () => {
    if (hasAppliedCoupon) {
      toast.error("Remove the applied coupon before entering another code.");
      return;
    }
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Enter coupon code");
      return;
    }
    setCouponBusy(true);
    try {
      // In a real production app, you'd verify the coupon with an API call here.
      // For this implementation, we'll assume valid if it matches any item's coupon.
      const isValid = cartItems.some(i => normalizeCartCoupon(i.coupon?.code) === code);
      if (isValid) {
        dispatch(setCoupon(code));
        toast.success(`Coupon ${code} applied`);
        setCouponInput("");
      } else {
        toast.error("Invalid coupon code for items in bag");
      }
    } catch (err) {
      toast.error("Failed to apply coupon");
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    dispatch(setCoupon(null));
    toast.success("Coupon removed");
  };

  const handleQuickCoupon = async (code) => {
    const normalized = String(code).trim().toUpperCase();
    if (!normalized) return;
    dispatch(setCoupon(normalized));
    toast.success(`Coupon ${normalized} applied`);
  };

  const handleQuantityUpdate = (productId, newQty, item) => {
    if (newQty < 1) {
      dispatch(removeFromCart(productId));
      toast.success("Item removed");
    } else {
      // Stock Validation
      if (newQty > item.stock) {
        toast.error(`Only ${item.stock} units available`);
        return;
      }
      dispatch(updateCartQty({ productId, qty: newQty }));
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Fresh cakes waiting for you."
          action={
            <Link to="/">
              <Button icon={ArrowRight}>SHOP NOW</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      <div className="bg-navbar text-navbar-text border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              onClick={() => navigate("/")}
              className="hover:text-primary transition-colors"
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span className="font-bold text-foreground">Shopping Bag</span>
            <span className="ml-auto text-sm font-black text-heading uppercase tracking-widest">
              {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-2xl font-bold mb-6">MY BAG</h1>

            {cartItems.map((item) => {
              const baseAfterOffer = getItemBasePrice(item);
              const couponOff = getItemCouponDiscount(item);
              const finalPrice = getFinalItemPrice(item);
              const originalPrice = getItemMrp(item);
              const hasOfferOnly = originalPrice > baseAfterOffer;
              const showStrike =
                originalPrice > finalPrice &&
                (hasOfferOnly || couponOff > 0);

              return (
                <motion.div
                  key={`${item.productId}-${item.selectedFlavor || ""}-${item.selectedWeight || ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl shadow-card border border-border/50 p-6"
                >
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-surface flex-shrink-0 border border-border/40">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">
                            {item.category}
                          </p>
                          <h3 className="font-black text-heading text-lg capitalize mb-2">
                            {item.name}
                          </h3>
                          {item.selectedFlavor && (
                            <p className="text-xs text-muted font-medium">
                              Flavor: {item.selectedFlavor}
                            </p>
                          )}
                          {item.selectedWeight && (
                            <p className="text-xs text-muted font-medium">
                              Weight: {item.selectedWeight}
                            </p>
                          )}

                          <div className="mt-3 space-y-1.5 text-xs font-medium text-muted">
                            <div className="flex justify-between gap-4">
                              <span>MRP</span>
                              <span className="text-heading font-bold tabular-nums">
                                {formatCurrency(originalPrice)} × {item.qty}
                              </span>
                            </div>
                            {hasOfferOnly && (
                              <div className="flex justify-between gap-4 text-success-text">
                                <span>Offer price</span>
                                <span className="font-black tabular-nums">
                                  {formatCurrency(baseAfterOffer)} / unit
                                  <span className="text-[10px] ml-1 opacity-80">
                                    (−
                                    {formatCurrency(
                                      (originalPrice - baseAfterOffer) * item.qty
                                    )}
                                    )
                                  </span>
                                </span>
                              </div>
                            )}
                            {couponOff > 0 && (
                              <div className="flex justify-between gap-4 text-coupon">
                                <span>Coupon ({item.coupon?.code})</span>
                                <span className="font-black tabular-nums">
                                  − {formatCurrency(couponOff * item.qty)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-baseline flex-wrap gap-2 mt-3">
                            <span className="text-2xl font-bold text-primary tabular-nums">
                              {formatCurrency(finalPrice)}
                            </span>
                            <span className="text-[11px] text-muted uppercase tracking-wider">
                              / unit
                            </span>
                            {showStrike && (
                              <span className="line-through text-muted/60 text-sm font-medium tabular-nums">
                                {formatCurrency(originalPrice)}
                              </span>
                            )}
                          </div>

                          {hasAppliedCoupon &&
                            item.coupon?.enabled &&
                            appliedCouponDisplay ===
                              normalizeCartCoupon(item.coupon.code) && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 mt-2 bg-success-light rounded text-xs text-success-text border border-success/10">
                                <Tag size={12} />
                                <span>{item.coupon.code} applied</span>
                              </div>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.productId,
                              item.selectedFlavor,
                              item.selectedWeight
                            )
                          }
                          className="text-muted/40 hover:text-error transition-colors p-2 hover:bg-error-light rounded-full shrink-0"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-3 border border-border rounded-xl bg-surface shadow-soft">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(
                                item.productId,
                                item.qty - 1,
                                item
                              )
                            }
                            className="p-2 hover:bg-card-soft transition rounded-l-xl text-foreground"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-black text-foreground">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(
                                item.productId,
                                item.qty + 1,
                                item
                              )
                            }
                            className="p-2 hover:bg-card-soft transition rounded-r-xl text-foreground"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                            Line total
                          </p>
                          <p className="font-black text-heading text-lg tabular-nums">
                            {formatCurrency(finalPrice * item.qty)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest hover:gap-3 transition-all mt-4 text-xs"
            >
              <ArrowRight size={16} />
              Continue Shopping
            </Link>
          </div>

          {/* Summary: MRP, offer, coupon, bag subtotal only */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/40 bg-card-soft/80">
                  <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-2">
                    Bag subtotal
                  </p>
                  <p className="text-3xl font-black text-heading tracking-tight tabular-nums">
                    {formatCurrency(subtotal)}
                  </p>
                  <p className="text-xs text-muted mt-2 font-medium leading-relaxed">
                    Product prices with offers & coupons. Delivery, GST and fees
                    are added at checkout after you choose your address on the
                    map.
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="border border-border/50 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPriceDetailsOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-surface/50 hover:bg-surface transition text-left"
                    >
                      <span className="text-[11px] font-black text-heading uppercase tracking-widest">
                        Price details
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-muted shrink-0 transition-transform ${priceDetailsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {priceDetailsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border/40"
                        >
                          <div className="p-4 space-y-3 text-sm">
                            <div className="flex justify-between font-bold">
                              <span className="text-muted text-[11px] uppercase tracking-widest">
                                Total MRP
                              </span>
                              <span className="text-heading tabular-nums">
                                {formatCurrency(originalTotal)}
                              </span>
                            </div>
                            {offerDiscount > 0 && (
                              <div className="flex justify-between text-success font-black text-[11px] uppercase tracking-widest">
                                <span>Offer discount</span>
                                <span>- {formatCurrency(offerDiscount)}</span>
                              </div>
                            )}
                            {couponDiscount > 0 && (
                              <div className="flex justify-between text-coupon font-black text-[11px] uppercase tracking-widest">
                                <span>Coupon ({appliedCouponDisplay})</span>
                                <span>- {formatCurrency(couponDiscount)}</span>
                              </div>
                            )}
                            {(offerDiscount + couponDiscount) > 0 && (
                              <div className="bg-success-light rounded-xl px-3 py-2.5 flex justify-between text-success-text font-black text-[10px] uppercase tracking-widest border border-success/10">
                                <span>You save</span>
                                <span>
                                  -{" "}
                                  {formatCurrency(
                                    offerDiscount + couponDiscount
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="border-t border-border/30 pt-3 flex justify-between font-black text-lg">
                              <span className="text-muted text-[11px] uppercase tracking-widest self-center">
                                Bag total
                              </span>
                              <span className="text-primary tabular-nums">
                                {formatCurrency(subtotal)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {hasAppliedCoupon ? (
                    <div className="p-4 bg-success-light rounded-2xl flex justify-between items-center border border-success/10">
                      <div>
                        <span className="text-[10px] font-black text-success-text uppercase tracking-widest opacity-70">
                          Coupon applied
                        </span>
                        <p className="text-sm font-mono font-black text-success-text tracking-widest">
                          {appliedCouponDisplay}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-black text-error uppercase tracking-widest hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
                        <Tag size={14} className="text-coupon" />
                        <span>Have a coupon?</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="input-field font-black uppercase tracking-widest h-11 flex-1 min-w-0"
                          placeholder="CODE"
                          value={couponInput}
                          disabled={couponBusy || hasAppliedCoupon}
                          onChange={(e) =>
                            setCouponInput(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleApplyCoupon()
                          }
                        />
                        <Button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponBusy || hasAppliedCoupon}
                          className="bg-primary text-button-text hover:brightness-110 px-6 h-11 shrink-0"
                        >
                          {couponBusy ? "…" : "APPLY"}
                        </Button>
                      </div>
                      {hasApplicableCoupons && !hasAppliedCoupon && (
                        <div className="flex flex-wrap gap-2">
                          {[
                            ...new Set(
                              cartItems
                                .filter((i) => i.coupon?.enabled)
                                .map((i) => i.coupon.code)
                            ),
                          ].map((code) => (
                            <button
                              key={code}
                              type="button"
                              disabled={couponBusy}
                              onClick={() => handleQuickCoupon(code)}
                              className="px-3 py-1.5 bg-accent-light/30 rounded-lg text-[10px] font-black text-heading font-mono hover:bg-accent-light/50 transition-colors uppercase tracking-widest border border-accent/20"
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => navigate("/checkout")}
                    className="w-full mt-2"
                  >
                    PROCEED TO CHECKOUT
                    <ArrowRight size={16} className="ml-2" />
                  </Button>

                  <div className="flex items-center justify-center gap-4 pt-4 text-[10px] text-muted font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 opacity-60">
                      <Shield size={14} /> Secure
                    </span>
                    <span className="flex items-center gap-1.5 opacity-60">
                      <Truck size={14} /> Fresh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-card border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-premium">
        <div>
          <p className="text-xs text-muted font-black uppercase tracking-widest">
            Bag subtotal
          </p>
          <p className="text-xl font-black text-primary tabular-nums">
            {formatCurrency(subtotal)}
          </p>
          <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest">
            Taxes & delivery at checkout
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="px-8 h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all flex items-center gap-2 bg-secondary text-button-text hover:brightness-110"
        >
          CHECKOUT <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Cart;
