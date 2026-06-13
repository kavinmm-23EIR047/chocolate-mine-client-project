import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Package,
  Download,
  Share2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LottieImport from 'lottie-react';
import brandAnimation from '../assets/brand-loader.json';
import orderService from '../services/orderService';

// Safely resolve the Lottie component function in both ESM and CJS bundling environments
const Lottie = LottieImport.default || LottieImport;

/** Premium brand Lottie animation instead of standard scooter illustration */
const DeliveryIllustration = () => (
  <div className="w-40 sm:w-48 aspect-square mx-auto flex items-center justify-center overflow-hidden">
    <Lottie
      animationData={brandAnimation}
      loop={true}
      className="w-full h-full scale-110"
    />
  </div>
);

// ─── Animated SVG Tick (replaces tick.gif) ───────────────────────────────────
const AnimatedTick = () => (
  <>
    <style>{`
      .tick-bg {
        fill: #16a34a;
        r: 0;
        animation: tickBgPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
      }
      .tick-ring {
        fill: none;
        stroke: #15803d;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 283;
        stroke-dashoffset: 283;
        animation: tickCircle 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
      }
      .tick-check {
        fill: none;
        stroke: #ffffff;
        stroke-width: 5.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 60;
        stroke-dashoffset: 60;
        animation: tickCheck 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.85s forwards;
      }
      @keyframes tickBgPop  { to { r: 42px; } }
      @keyframes tickCircle { to { stroke-dashoffset: 0; } }
      @keyframes tickCheck  { to { stroke-dashoffset: 0; } }
    `}</style>
    <svg
      viewBox="0 0 96 96"
      width="96"
      height="96"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Order confirmed"
    >
      <circle className="tick-bg" cx="48" cy="48" r="0" />
      <circle
        className="tick-ring"
        cx="48"
        cy="48"
        r="44"
        transform="rotate(-90 48 48)"
      />
      <polyline className="tick-check" points="28,50 42,64 68,34" />
    </svg>
  </>
);

const formatOrderRef = (raw) => {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, '');
  if (s.length <= 20) return s;
  return s.replace(/(.{4})/g, '$1 ').trim();
};

/** Festive cracker-style bursts (left / right cannons + centre blast) */
const CRACKER_COLORS = ['#5c3d36', '#c9a227', '#66BB6A', '#f59e0b', '#fcd34d', '#fda4af', '#fef3c7'];

function fireSuccessCrackerBlast() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const shoot = (originX, opts = {}) => {
    confetti({
      particleCount: opts.particleCount ?? 72,
      spread: opts.spread ?? 52,
      startVelocity: opts.startVelocity ?? 42,
      ticks: opts.ticks ?? 320,
      gravity: opts.gravity ?? 1.05,
      decay: opts.decay ?? 0.92,
      scalar: opts.scalar ?? 1,
      origin: { x: originX, y: opts.originY ?? 0.62 },
      colors: CRACKER_COLORS,
      ...opts.extra,
    });
  };

  shoot(0.08, { spread: 38, particleCount: 55, startVelocity: 48 });
  shoot(0.92, { spread: 38, particleCount: 55, startVelocity: 48 });

  window.setTimeout(() => {
    shoot(0.5, {
      particleCount: 110,
      spread: 78,
      startVelocity: 52,
      scalar: 1.05,
    });
  }, 160);

  window.setTimeout(() => {
    shoot(0.28, { particleCount: 45, spread: 65, startVelocity: 35 });
    shoot(0.72, { particleCount: 45, spread: 65, startVelocity: 35 });
  }, 340);

  window.setTimeout(() => {
    confetti({
      particleCount: 55,
      spread: 360,
      startVelocity: 28,
      ticks: 240,
      gravity: 0.95,
      origin: { x: 0.5, y: 0.35 },
      colors: CRACKER_COLORS,
      shapes: ['circle', 'square'],
      scalar: 0.85,
    });
  }, 520);
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = searchParams.get('id') || location.state?.orderId || null;
  const [fetchedOrderNumber, setFetchedOrderNumber] = useState(null);

  const orderNumber = fetchedOrderNumber || location.state?.orderNumber;
  const displayRef = useMemo(() => formatOrderRef(orderNumber), [orderNumber]);
  const fullRef = orderNumber ? String(orderNumber).replace(/\s+/g, '') : '';

  useEffect(() => {
    fireSuccessCrackerBlast();
    if (orderId) {
      orderService.getOrder(orderId)
        .then((res) => {
          if (res.data?.data?.orderNumber) {
            setFetchedOrderNumber(res.data.data.orderNumber);
          }
        })
        .catch((err) => {
          console.error('Error fetching order details:', err);
        });
    }
  }, [orderId]);

  const handleViewDetails = () => {
    if (orderId) navigate(`/account/orders/${orderId}`);
    else toast.error('Order reference not available');
  };

  const handleCopyId = async () => {
    if (!fullRef) return;
    try {
      await navigator.clipboard.writeText(fullRef);
      toast.success('Order ID copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderId) {
      toast.error('Order ID missing');
      return;
    }
    try {
      const res = await orderService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${displayRef || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Unable to download invoice');
    }
  };

  const handleShareOrder = async () => {
    if (!orderId) {
      toast.error('Order reference not available');
      return;
    }
    const orderUrl = `${window.location.origin}/account/orders/${orderId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'The Chocolate Mine — Order',
          text: `Order ${displayRef || orderId}`,
          url: orderUrl,
        });
      } else {
        await navigator.clipboard.writeText(orderUrl);
        toast.success('Link copied');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl sm:max-w-2xl"
      >
        <div className="rounded-2xl border border-border/50 bg-card shadow-[0_20px_50px_-24px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-6 py-6 sm:px-8 sm:py-8 text-center">

            {/* ── Animated tick ── */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.05 }}
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center"
            >
              <AnimatedTick />
            </motion.div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Thank you
            </p>
            <h1 className="text-2xl sm:text-[1.75rem] font-bold text-heading tracking-tight leading-tight">
              Order confirmed
            </h1>
            <p className="mt-3 text-sm text-muted leading-relaxed max-w-lg mx-auto">
              Payment went through. We're preparing your order with care — you'll get updates on the way.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-4 mb-2"
            >
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                On its way to you soon
              </p>
            </motion.div>
          </div>

          <div className="border-t border-border/40 bg-surface/40 px-6 py-5 sm:px-8">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-left flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                    Order reference
                  </p>
                  <p
                    className="font-mono text-sm font-semibold text-heading break-all leading-snug"
                    title={fullRef || undefined}
                  >
                    {displayRef || 'Generating reference...'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  disabled={!fullRef}
                  className="shrink-0 rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/5 border border-transparent hover:border-border/60 transition-colors disabled:opacity-40"
                  aria-label="Copy order ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border/30">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-[11px] font-semibold text-success-text border border-success/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Confirmed
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleViewDetails}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-3 px-2 text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/[0.04] transition-colors"
              >
                <Package className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  Details
                </span>
              </button>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-3 px-2 text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/[0.04] transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  Invoice
                </span>
              </button>
              <button
                type="button"
                onClick={handleShareOrder}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-3 px-2 text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/[0.04] transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  Share
                </span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 pt-2 space-y-3 bg-card">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-button-text py-3.5 text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all"
            >
              Continue shopping
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/account/orders"
              className="block w-full text-center text-sm font-medium text-muted hover:text-primary py-2 transition-colors"
            >
              View all orders
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;