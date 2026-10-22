import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';

const PopupBanner = ({ enabled = true }) => {
  const [banner, setBanner] = useState(null);
  const [dismissKey, setDismissKey] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled || dismissed) return undefined;
    let cancelled = false;

    api.get('/banners/active')
      .then((res) => {
        if (cancelled) return;
        const popup = (res.data?.data || []).find((item) => item.bannerType === 'popup' && item.image);
        if (popup) {
          const key = `tcm_popup_banner_dismissed:${popup._id || popup.title}:${popup.updatedAt || popup.createdAt || ''}`;
          try {
            if (localStorage.getItem(key) === '1') {
              setDismissed(true);
              return;
            }
          } catch {
            // Keep the popup available when browser storage is disabled.
          }
          setDismissKey(key);
          setBanner(popup);
        }
      })
      .catch((error) => console.error('Failed to load popup banner:', error));

    return () => {
      cancelled = true;
    };
  }, [enabled, dismissed]);

  useEffect(() => {
    if (!banner || dismissed) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setDismissed(true);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [banner, dismissed]);

  const closePopup = () => {
    if (dismissKey) {
      try {
        localStorage.setItem(dismissKey, '1');
      } catch {
        // Keep the popup dismissed for the current page when storage is disabled.
      }
    }
    setDismissed(true);
  };
  const safeLink = typeof banner?.link === 'string' && (banner.link.startsWith('/') || /^https?:\/\//i.test(banner.link))
    ? banner.link
    : '';
  const viewButtonClass = 'inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-button-text transition hover:opacity-90';
  const viewButton = safeLink && (safeLink.startsWith('/') ? (
    <Link to={safeLink} onClick={closePopup} className={viewButtonClass}>
      View Offer <ArrowRight size={16} />
    </Link>
  ) : (
    <a href={safeLink} onClick={closePopup} className={viewButtonClass}>
      View Offer <ExternalLink size={15} />
    </a>
  ));

  return (
    <AnimatePresence>
      {banner && !dismissed && enabled && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePopup();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-banner-title"
            className="relative my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={closePopup}
              aria-label="Close popup"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black"
            >
              <X size={20} />
            </button>

            <div className="min-h-0 overflow-y-auto">
              <img
                src={getOptimizedCloudinaryUrl(banner.image, 1200)}
                alt={banner.title || 'Store offer'}
                className="block h-auto w-full bg-card-soft object-contain"
              />
              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Special offer</p>
                  <h2 id="popup-banner-title" className="mt-1 text-xl font-black text-heading sm:text-2xl">{banner.title}</h2>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="min-h-11 w-full rounded-xl border border-border px-5 py-3 text-sm font-bold text-heading transition hover:bg-card-soft sm:w-auto"
                  >
                    Close
                  </button>
                  {viewButton}
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupBanner;
