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
          {/* Fully-Bend Pill Base with Dynamic Inner Element Shaping */}
          <style>{`
            @keyframes mobileSweep {
              0% { transform: translate(-50%, -50%) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg); }
            }

            .neo-bottom-nav-container {
              position: relative;
              padding: 2.5px;
              overflow: hidden;
              isolation: isolate;
              border-radius: 9999px; /* Outer frame remains fully bent */
            }

            /* Infinite Instagram Gradient Core Wrapper */
            .neo-bottom-nav-container::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 170%;
              height: 340%;
              background: conic-gradient(
                #f58529, #dd2a7b, #8134af, #515bd4, #dd2a7b, #f58529
              );
              animation: mobileSweep 4s linear infinite;
              z-index: -1;
              transform-origin: center center;
            }

            /* Main Bar Panel Frame (Fully Capsule Shaped) */
            .neo-bottom-nav {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 5px 8px; /* Balanced horizontal offset */
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border-radius: 9999px; /* Inner container matches outer bar shape perfectly */
            }

            /* Custom Geometric Shape for Internal Active & Hover Elements */
            .neo-bottom-nav .nav-item-element {
              border-radius: 14px !important; /* Forces a beautiful soft inner rounded square */
            }

            /* ─── LIGHT THEME STYLE ─── */
            .neo-bottom-nav {
              background-color: rgba(18, 8, 6, 0.92); 
            }
            .neo-bottom-nav .nav-item-active {
              background-color: #EBDEDA; 
              color: #120806;            
            }
            .neo-bottom-nav .nav-item-inactive {
              color: #A18881;            
            }

            /* ─── DARK THEME STYLE ─── */
            .dark .neo-bottom-nav {
              background-color: rgba(235, 222, 218, 0.9); 
            }
            .dark .neo-bottom-nav .nav-item-active {
              background-color: #120806; 
              color: #F2E2DB;            
            }
            .dark .neo-bottom-nav .nav-item-inactive {
              color: #7C6660;            
            }
          `}</style>

          <div
            className="neo-bottom-nav-container max-w-md mx-auto pointer-events-auto"
            style={{ boxShadow: '0 -4px 12px rgba(var(--shadow-color), 0.08)' }}
          >
            <nav className="neo-bottom-nav transition-colors duration-300">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex-1 mx-0.5"
                >
                  {({ isActive }) => (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`flex flex-col items-center justify-center py-2 nav-item-element relative transition-all duration-300
                        ${isActive ? 'nav-item-active font-bold' : 'nav-item-inactive hover:bg-white/5 dark:hover:bg-black/5 hover:opacity-90'}`}
                      style={{
                        boxShadow: isActive ? 'inset 0 2px 4px rgba(var(--shadow-color), 0.1)' : 'none',
                      }}
                    >
                      {/* Icon Base Frame */}
                      <div className="relative flex items-center justify-center">
                        <item.icon
                          size={16}
                          className="transition-transform duration-200"
                          strokeWidth={isActive ? 2.5 : 2}
                        />

                        {/* Notification Counter Badge */}
                        {item.badge > 0 && (
                          <span className="absolute -top-1.5 -right-2 bg-[var(--accent)] text-[#120807] text-[8px] font-black min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center shadow-md border border-transparent">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Micro Fluid Text Label */}
                      <span
                        className={`text-[9px] tracking-wide mt-0.5 transition-all duration-200 origin-center ${isActive
                          ? 'opacity-100 scale-100 max-h-3 dynamic-text'
                          : 'opacity-0 scale-90 max-h-0 overflow-hidden pointer-events-none'
                          }`}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileBottomNav;