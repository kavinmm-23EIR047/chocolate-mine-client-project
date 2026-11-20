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
    const getFooter = () => document.getElementById('site-footer') || document.querySelector('footer');

    const handleCheck = () => {
      const footer = getFooter();
      if (!footer) return;
      const rect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Disappear as soon as the top of footer enters viewport
      const visible = rect.top <= windowHeight + 10;
      setIsFooterVisible(visible);
    };

    // Check immediately and on scroll/resize
    handleCheck();
    window.addEventListener('scroll', handleCheck, { passive: true });
    window.addEventListener('resize', handleCheck, { passive: true });

    // Backup IntersectionObserver
    let observer;
    const footerEl = getFooter();
    if (footerEl) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight) {
            setIsFooterVisible(true);
          } else {
            setIsFooterVisible(false);
          }
        },
        { threshold: [0, 0.01, 0.1], rootMargin: '0px 0px 40px 0px' }
      );
      observer.observe(footerEl);
    }

    // Interval check to handle dynamic page content loading
    const interval = setInterval(handleCheck, 400);

    return () => {
      window.removeEventListener('scroll', handleCheck);
      window.removeEventListener('resize', handleCheck);
      clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', icon: Home, path: '/', exact: true },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Custom', icon: Cake, path: '/custom-cake' },
    { label: 'Cart', icon: ShoppingCart, path: '/cart', badge: cartCount },
    { label: 'Profile', icon: User, path: '/account/dashboard' },
  ];

  const hideOn = ['/product', '/checkout', '/cart', '/login', '/register', '/forgot-password'];
  const shouldHidePermanently = hideOn.some((path) => location.pathname.startsWith(path));

  if (shouldHidePermanently) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex px-2 pb-2 pointer-events-none sm:px-4 lg:hidden transition-all duration-300 ease-in-out ${
        isFooterVisible ? 'translate-y-[120%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
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
