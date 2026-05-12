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

  // Hide on checkout and product details pages only
  const hideOn = ['/product', '/checkout'];
  if (hideOn.some(path => location.pathname.startsWith(path))) return null;

  return (
    <AnimatePresence>
      {!isFooterVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="lg:hidden fixed bottom-6 left-0 right-0 z-[100] px-2 sm:px-4 pointer-events-none"
        >
          <nav className="rounded-full flex items-center justify-between p-1 px-1 sm:px-2 pointer-events-auto max-w-lg mx-auto cutting-edge-border">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center gap-1 w-10 xs:w-11 sm:w-12 h-10 xs:h-11 sm:h-12 rounded-full transition-all duration-300 relative group ${
                    isActive ? 'text-button-text border-2 border-primary ring-2 ring-primary/20' : 'text-heading hover:text-primary/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabHighlight"
                        className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/30"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    
                    <div className="relative">
                      <item.icon 
                        size={isActive ? 16 : 18} 
                        className="transition-all duration-300" 
                        strokeWidth={isActive ? 3 : 2}
                      />
                      {item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-accent text-primary text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border-2 border-card">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    
                    <span className={`text-[7px] font-black uppercase tracking-widest transition-all duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                    }`}>
                      {item.label}
                    </span>
                  </>
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
