import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Heart, ShoppingBag, Cake } from 'lucide-react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const MobileBottomNav = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const location = useLocation();
  const cartCount = cartItems?.reduce((acc, item) => acc + item.qty, 0) || 0;
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Observe footer to hide bottom nav when footer is in view
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Custom', icon: Cake, path: '/custom-cake' },
    { label: 'Wishlist', icon: Heart, path: '/account/wishlist' },
    { label: 'Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
    { label: 'Profile', icon: User, path: '/account/dashboard' },
  ];

  // Hide on checkout and product details pages
  const hideOn = ['/product', '/checkout'];
  if (hideOn.some(path => location.pathname.startsWith(path))) return null;

  return (
    <AnimatePresence>
      {!isFooterVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className="lg:hidden fixed bottom-5 left-0 right-0 z-[100] px-4 pointer-events-none"
        >
          <nav className="bg-surface/80 backdrop-blur-lg border border-border/40 rounded-2xl flex items-center justify-between p-1.5 pointer-events-auto max-w-md mx-auto shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 my-0.5"
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl relative transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted/80'
                      }`}
                  >
                    {/* Sliding Glass Capsule Highlight Behind Active Item */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavigationPill"
                        className="absolute inset-0 bg-primary/8 dark:bg-primary/15 rounded-xl -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Icon Container */}
                    <div className="relative flex items-center justify-center">
                      <item.icon
                        size={19}
                        className="transition-transform duration-200"
                        strokeWidth={isActive ? 2.5 : 2}
                      />

                      {/* Cart Notification Badge */}
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-accent text-[#120807] text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md border border-surface">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Smooth Fade/Slide Label Text */}
                    <span
                      className={`text-[9px] font-bold tracking-wide mt-0.5 transition-all duration-200 origin-center ${isActive
                          ? 'opacity-100 scale-100 max-h-3 dynamic-text'
                          : 'opacity-0 scale-90 max-h-0 overflow-hidden pointer-events-none'
                        }`}
                    >
                      {item.label}
                    </span>

                    {/* Small Premium Active Dot Dot Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorDot"
                        className="w-1 h-1 bg-primary rounded-full absolute bottom-1"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileBottomNav;