import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Cake, ShoppingCart, User } from 'lucide-react';
import { useSelector } from 'react-redux';

const MobileBottomNav = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const location = useLocation();
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const cartCount = cartItems?.reduce((total, item) => total + item.qty, 0) || 0;

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', icon: Home, path: '/', exact: true },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Custom', icon: Cake, path: '/custom-cake' },
    { label: 'Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
    { label: 'Profile', icon: User, path: '/account/dashboard' },
  ];

  const hideOn = ['/product', '/checkout', '/cart', '/login', '/register', '/forgot-password'];
  if (isFooterVisible || hideOn.some((path) => location.pathname.startsWith(path))) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex px-2 pb-2 pointer-events-none sm:px-4 lg:hidden"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Mobile navigation"
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-[24px] border border-[#5C3626] bg-[#1A0C08] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.28)]"
      >
        {navItems.map(({ label, icon: Icon, path, exact, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) => `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-2 text-[10px] font-bold leading-none transition-colors ${
              isActive ? 'bg-[#E8D3CB] text-[#1A0C08]' : 'text-[#D6BE9F] hover:bg-[#3D2217]'
            }`}
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-5 items-center justify-center">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  {badge > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C89D5A] px-1 text-[9px] font-black text-[#1A0C08]">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
